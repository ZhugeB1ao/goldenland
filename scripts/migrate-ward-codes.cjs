/**
 * Migration script: Cập nhật ward_code và address theo hệ thống hành chính mới 2025
 *
 * Chiến lược:
 * 1. Từ CSV mapping: build lookup old_ward_name + old_province → new ward info
 * 2. Từ địa chỉ: parse tên phường/xã và tỉnh thành
 * 3. Tìm ward mới theo tên + tỉnh (ưu tiên exact match trong cùng tỉnh)
 * 4. Chỉ tự động update HIGH confidence, flag MEDIUM để review
 *
 * Run: node scripts/migrate-ward-codes.cjs [--apply]
 */

const fs = require('fs')
const path = require('path')
const { Client } = require(
  path.join(__dirname, '../node_modules/.pnpm/pg@8.16.3/node_modules/pg')
)

const DB_URL = process.env.DATABASE_URL ||
  'postgresql://postgres.ccwmekftdqxobmxscvzy:Trongdat2005@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres'

const DRY_RUN = !process.argv.includes('--apply')

// ============================================================
// CSV Parser
// ============================================================
function parseCSVLine(line) {
  const result = []; let current = ''; let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') { inQuotes = !inQuotes }
    else if (c === ',' && !inQuotes) { result.push(current); current = '' }
    else { current += c }
  }
  result.push(current)
  return result
}

// ============================================================
// Load new JSON 2025
// ============================================================
const newData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../src/app/data/vietnam-divisions.json'), 'utf8')
)

const wardByCode = {}
const wardByName = {}
const provinceByCode = {}
const provinceByNameNorm = {}

function normalizeName(s) {
  if (!s) return ''
  return s.toLowerCase()
    .replace(/thành phố\s+/g, '')
    .replace(/tỉnh\s+/g, '')
    .replace(/tp\.\s*/g, '')
    .trim()
}

for (const prov of newData) {
  provinceByCode[prov.Code] = prov.FullName
  provinceByNameNorm[normalizeName(prov.FullName)] = prov.Code
  // Also map short name
  provinceByNameNorm[prov.FullName.toLowerCase().trim()] = prov.Code

  for (const ward of (prov.Wards || [])) {
    wardByCode[ward.Code] = {
      Code: ward.Code, FullName: ward.FullName,
      ProvinceCode: prov.Code, ProvinceName: prov.FullName,
    }
    const key = ward.FullName.toLowerCase().trim()
    if (!wardByName[key]) wardByName[key] = []
    wardByName[key].push({ Code: ward.Code, FullName: ward.FullName, ProvinceCode: prov.Code, ProvinceName: prov.FullName })
  }
}

// ============================================================
// Old province names → new province codes (for merged provinces)
// Khi user nhập địa chỉ cũ với tên tỉnh cũ đã bị sáp nhập
// ============================================================
const OLD_PROVINCE_NORM_TO_NEW = {
  // Hà Nội area
  'hà giang':   '08',  // → Tuyên Quang
  'tuyên quang':'08',
  'yên bái':    '14',  // → Sơn La
  'sơn la':     '14',
  'phú thọ':    '25',
  'vĩnh phúc':  '25',  // → Phú Thọ
  'bắc giang':  '24',  // → Bắc Ninh
  'bắc ninh':   '24',
  'hải dương':  '31',  // → Hải Phòng
  'hải phòng':  '31',
  'thái bình':  '33',  // → Hưng Yên
  'hưng yên':   '33',
  'nam định':   '37',  // → Ninh Bình
  'ninh bình':  '37',
  // Central
  'quảng bình': '44',  // → Quảng Trị
  'quảng trị':  '44',
  'quảng nam':  '48',  // → Đà Nẵng
  'đà nẵng':    '48',
  'quảng ngãi': '51',
  'bình định':  '52',  // → Gia Lai
  'gia lai':    '52',
  'kon tum':    '52',  // → Gia Lai
  'ninh thuận': '56',  // → Khánh Hòa
  'bình thuận': '56',  // → Khánh Hòa
  'khánh hòa':  '56',
  'đắk nông':   '66',  // → Đắk Lắk
  'đắk lắk':    '66',
  'lâm đồng':   '68',
  // South
  'bình phước': '79',  // → HCM
  'bình dương': '79',  // → HCM
  'tây ninh':   '80',
  'đồng nai':   '75',
  'bà rịa - vũng tàu': '75',  // → Đồng Nai
  'vũng tàu':   '75',
  'long an':    '82',  // → Đồng Tháp
  'tiền giang': '82',
  'đồng tháp':  '82',
  'bến tre':    '86',  // → Vĩnh Long
  'vĩnh long':  '86',
  'hậu giang':  '92',  // → Cần Thơ
  'sóc trăng':  '92',
  'bạc liêu':   '92',
  'kiên giang': '91',  // → An Giang
  'an giang':   '91',
  'cà mau':     '96',
}

// ============================================================
// Load CSV mapping: old ward name + province → new ward
// ============================================================
const csvFile = path.join(__dirname, '../ward_mapping.csv')
const csv = fs.readFileSync(csvFile, 'utf8')
const csvLines = csv.split('\n').filter(l => l.trim())
const headers = parseCSVLine(csvLines[0])
const COL = {}; headers.forEach((h, i) => COL[h] = i)

const csvByProvAndName = {} // "wardname_lower|province_norm" → new ward info
const csvByName = {}        // "wardname_lower" → [new ward infos]

for (let i = 1; i < csvLines.length; i++) {
  const row = parseCSVLine(csvLines[i])
  if (row[COL.isDefaultNewWard] === 'False') continue

  const oldWard = (row[COL.ward] || '').trim()
  const oldProv = (row[COL.province] || '').trim()
  const newWardCodeRaw = row[COL.newWardCode]
  if (!oldWard || !newWardCodeRaw) continue

  const newCode = String(Math.round(parseFloat(newWardCodeRaw))).padStart(5, '0')
  const newProvCodeRaw = row[COL.newProvinceCode]
  const newProvCode = newProvCodeRaw ? String(parseInt(newProvCodeRaw)).padStart(2, '0') : null

  const info = {
    newCode,
    newProvCode,
    newWardName: row[COL.newWard] || '',
    newProvName: row[COL.newProvince] || '',
    oldWard, oldProv,
  }

  const wKey = oldWard.toLowerCase()
  const pKey = normalizeName(oldProv)
  const fullKey = `${wKey}|${pKey}`

  if (!csvByProvAndName[fullKey]) csvByProvAndName[fullKey] = info
  if (!csvByName[wKey]) csvByName[wKey] = []
  csvByName[wKey].push(info)
}

// ============================================================
// Parse ward name and province from address string
// ============================================================
const WARD_PREFIXES = ['phường', 'xã', 'thị trấn']

function parseAddress(address) {
  if (!address) return { wardName: null, provinceNorm: null, street: null }

  const parts = address.split(',').map(s => s.trim()).filter(Boolean)
  let wardName = null
  let wardIdx = -1
  const streetParts = []

  for (let i = 0; i < parts.length; i++) {
    const lower = parts[i].toLowerCase()
    if (WARD_PREFIXES.some(p => lower.startsWith(p))) {
      wardName = parts[i]
      wardIdx = i
      streetParts.push(...parts.slice(0, i))
      break
    }
  }

  // Province: last part that contains tỉnh/thành phố/tp.
  let provinceName = ''
  for (let i = parts.length - 1; i >= 0; i--) {
    const lower = parts[i].toLowerCase()
    if (lower.includes('tỉnh') || lower.includes('thành phố') || lower.startsWith('tp.') || lower === 'hà nội' || lower === 'đà nẵng' || lower === 'hải phòng' || lower === 'cần thơ' || lower === 'huế') {
      provinceName = parts[i]
      break
    }
    // Last resort: just take the last part
    if (i === parts.length - 1) provinceName = parts[i]
  }

  return {
    wardName,
    provinceNorm: normalizeName(provinceName),
    provinceRaw: provinceName,
    street: streetParts.join(', ') || null,
  }
}

// ============================================================
// Find new ward with confidence scoring
// ============================================================
function findNewWard(wardName, provinceNorm, dbProvinceCode) {
  if (!wardName) return { ward: null, confidence: 'none', method: 'no-ward-name' }

  const wardKey = wardName.toLowerCase().trim()

  // Resolve province: try new JSON first, then OLD→NEW merged-province mapping
  const newProvCodeFromAddr =
    provinceByNameNorm[provinceNorm] ||
    OLD_PROVINCE_NORM_TO_NEW[provinceNorm] ||
    dbProvinceCode

  // --- Step 1: Direct lookup in new JSON by ward name ---
  const jsonCandidates = wardByName[wardKey] || []

  if (jsonCandidates.length === 1) {
    const ward = jsonCandidates[0]
    if (ward.ProvinceCode === newProvCodeFromAddr) {
      return { ward, confidence: 'high', method: 'json-unique-same-province' }
    }
    // Province changed due to merger but ward is unique → still high confidence
    const isKnownMerger = Object.values(OLD_PROVINCE_NORM_TO_NEW).includes(ward.ProvinceCode)
    if (isKnownMerger) {
      return { ward, confidence: 'high', method: 'json-unique-known-merger' }
    }
    return { ward, confidence: 'medium', method: 'json-unique-diff-province' }
  }

  if (jsonCandidates.length > 1) {
    const exact = jsonCandidates.find(c => c.ProvinceCode === newProvCodeFromAddr)
    if (exact) return { ward: exact, confidence: 'high', method: 'json-multi-province-match' }
    return { ward: null, confidence: 'none', method: 'json-ambiguous-no-province-match' }
  }

  // --- Step 2: Ward name doesn't exist in new JSON → CSV for renamed/merged wards ---
  const csvKey = `${wardKey}|${provinceNorm}`
  if (csvByProvAndName[csvKey]) {
    const m = csvByProvAndName[csvKey]
    const newWard = wardByCode[m.newCode]
    if (newWard) return { ward: newWard, confidence: 'high', method: 'csv-exact-province' }
  }

  // Try CSV by name only (if unique match)
  const csvNameMatches = csvByName[wardKey] || []
  if (csvNameMatches.length === 1) {
    const m = csvNameMatches[0]
    const newWard = wardByCode[m.newCode]
    if (newWard) {
      if (newWard.ProvinceCode === newProvCodeFromAddr) {
        return { ward: newWard, confidence: 'high', method: 'csv-unique-same-province' }
      }
      // Known merger → high confidence
      const isKnownMerger = Object.values(OLD_PROVINCE_NORM_TO_NEW).includes(newWard.ProvinceCode)
      if (isKnownMerger) {
        return { ward: newWard, confidence: 'high', method: 'csv-unique-known-merger' }
      }
      return { ward: newWard, confidence: 'medium', method: 'csv-unique-diff-province' }
    }
  }

  if (csvNameMatches.length > 1) {
    // Try to match by province
    const byProv = csvNameMatches.find(m => m.newProvCode === newProvCodeFromAddr)
    if (byProv) {
      const newWard = wardByCode[byProv.newCode]
      if (newWard) return { ward: newWard, confidence: 'high', method: 'csv-multi-province-match' }
    }
  }

  return { ward: null, confidence: 'none', method: 'not-found' }
}

// ============================================================
// Build new address
// ============================================================
function buildNewAddress(street, newWard, originalAddress) {
  const parts = []
  if (street && street.trim()) parts.push(street.trim())
  if (newWard) {
    parts.push(newWard.FullName)
    parts.push(newWard.ProvinceName)
  }
  return parts.length > 0 ? parts.join(', ') : originalAddress
}

// ============================================================
// Main
// ============================================================
async function main() {
  console.log(`\n🚀 Ward Code Migration ${DRY_RUN ? '(DRY RUN)' : '(APPLY)'}`)
  console.log('='.repeat(70))

  const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } })
  await client.connect()

  const { rows } = await client.query(`
    SELECT 'properties' as tbl, id, ward_code, province_code, address, street
    FROM properties WHERE ward_code IS NOT NULL
    UNION ALL
    SELECT 'projects' as tbl, id, ward_code, province_code, address, null as street
    FROM projects WHERE ward_code IS NOT NULL
    UNION ALL
    SELECT 'profiles' as tbl, id, ward_code, province_code, address, null as street
    FROM profiles WHERE ward_code IS NOT NULL
    ORDER BY tbl, id
  `)

  console.log(`📊 Tổng records: ${rows.length}`)

  const highConf = [], medConf = [], noChange = [], errors = []

  for (const row of rows) {
    const { tbl, id, ward_code, province_code, address, street } = row
    const { wardName, provinceNorm, street: parsedStreet } = parseAddress(address)

    const { ward: newWard, confidence, method } = findNewWard(wardName, provinceNorm, province_code)

    if (!newWard) {
      // If ward_code already valid in new JSON with correct province → skip
      const currentWard = wardByCode[ward_code]
      if (currentWard && currentWard.ProvinceCode === province_code) {
        noChange.push({ tbl, id, reason: 'already valid' })
        continue
      }
      errors.push({ tbl, id, ward_code, province_code, address, wardName, method })
      continue
    }

    const newWardCode = newWard.Code
    const newProvinceCode = newWard.ProvinceCode
    const actualStreet = street || parsedStreet
    const newAddress = buildNewAddress(actualStreet, newWard, address)

    if (ward_code === newWardCode && province_code === newProvinceCode && address === newAddress) {
      noChange.push({ tbl, id, reason: 'no change' })
      continue
    }

    const rec = {
      tbl, id, confidence, method,
      old: { ward_code, province_code, address },
      new: { ward_code: newWardCode, province_code: newProvinceCode, address: newAddress },
      wardName, newWardName: newWard.FullName,
      wardCodeChanged: ward_code !== newWardCode,
      provinceChanged: province_code !== newProvinceCode,
    }

    if (confidence === 'high') highConf.push(rec)
    else medConf.push(rec)
  }

  // ─── Report ───────────────────────────────────────────────
  console.log(`\n✅ HIGH confidence (sẽ update): ${highConf.length}`)
  console.log(`⚠️  MEDIUM confidence (review): ${medConf.length}`)
  console.log(`⏭  Không thay đổi: ${noChange.length}`)
  console.log(`❌ Không tìm được: ${errors.length}`)

  if (highConf.length > 0) {
    console.log('\n📝 HIGH confidence updates:')
    for (const u of highConf) {
      const flags = [u.wardCodeChanged ? '⚠️CODE' : '', u.provinceChanged ? '🔄TỈNH' : ''].filter(Boolean).join(' ')
      console.log(`  [${u.tbl}#${u.id}] ${flags} [${u.method}]`)
      if (u.wardCodeChanged) console.log(`    Ward: ${u.old.ward_code} → ${u.new.ward_code} (${u.wardName} → ${u.newWardName})`)
      if (u.provinceChanged) console.log(`    Province: ${u.old.province_code} → ${u.new.province_code}`)
      console.log(`    Addr: "${u.old.address}"`)
      console.log(`       → "${u.new.address}"`)
    }
  }

  if (medConf.length > 0) {
    console.log('\n⚠️  MEDIUM (không tự update):')
    for (const u of medConf) {
      console.log(`  [${u.tbl}#${u.id}] [${u.method}] ward: ${u.old.ward_code}→${u.new.ward_code} prov: ${u.old.province_code}→${u.new.province_code}`)
      console.log(`    "${u.old.address}" → "${u.new.address}"`)
    }
  }

  if (errors.length > 0) {
    console.log('\n❌ Không tìm được (manual):')
    for (const e of errors) {
      console.log(`  [${e.tbl}#${e.id}] code=${e.ward_code} name="${e.wardName}" [${e.method}]`)
      console.log(`    "${e.address}"`)
    }
  }

  // ─── Apply ────────────────────────────────────────────────
  if (!DRY_RUN && highConf.length > 0) {
    console.log('\n💾 Ghi vào database...')
    await client.query('BEGIN')
    try {
      for (const u of highConf) {
        await client.query(
          `UPDATE ${u.tbl} SET ward_code=$1, province_code=$2, address=$3, updated_at=NOW() WHERE id=$4`,
          [u.new.ward_code, u.new.province_code, u.new.address, u.id]
        )
      }
      await client.query('COMMIT')
      console.log(`✅ Đã cập nhật ${highConf.length} records!`)
    } catch (err) {
      await client.query('ROLLBACK')
      console.error('❌ Lỗi rollback:', err.message)
    }
  }

  // ─── Save SQL ─────────────────────────────────────────────
  const lines = [
    '-- Ward Code Migration 2025', `-- ${new Date().toISOString()}`, '',
    '-- HIGH CONFIDENCE (safe to run)', 'BEGIN;', '',
  ]

  for (const u of highConf) {
    lines.push(`-- [${u.tbl}#${u.id}] ${u.wardName} → ${u.newWardName} [${u.method}]`)
    lines.push(`UPDATE ${u.tbl} SET ward_code='${u.new.ward_code}', province_code='${u.new.province_code}', address='${u.new.address.replace(/'/g, "''")}', updated_at=NOW() WHERE id=${u.id};`)
    lines.push('')
  }
  lines.push('COMMIT;', '', '-- MEDIUM CONFIDENCE (review before applying)', '')
  for (const u of medConf) {
    lines.push(`-- [${u.tbl}#${u.id}] ${u.wardName} → ${u.newWardName} [${u.method}]`)
    lines.push(`-- UPDATE ${u.tbl} SET ward_code='${u.new.ward_code}', province_code='${u.new.province_code}', address='${u.new.address.replace(/'/g, "''")}', updated_at=NOW() WHERE id=${u.id};`)
    lines.push('')
  }
  lines.push('-- ERRORS (manual fix)', '')
  for (const e of errors) {
    lines.push(`-- [${e.tbl}#${e.id}] code=${e.ward_code} name="${e.wardName}"`)
    lines.push(`-- Address: ${e.address}`)
    lines.push('')
  }

  const sqlPath = path.join(__dirname, 'migrate-ward-codes.sql')
  fs.writeFileSync(sqlPath, lines.join('\n'), 'utf8')
  console.log(`\n📄 SQL saved: ${sqlPath}`)
  if (DRY_RUN) console.log('💡 Chạy --apply để ghi HIGH confidence vào DB')

  await client.end()
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })