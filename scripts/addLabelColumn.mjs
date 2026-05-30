import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve, dirname } from 'node:path'

// Load env from .env (not .env.local)
const envContent = readFileSync('.env', 'utf8')
const dbUrl = envContent
  .split('\n')
  .find(l => l.startsWith('DATABASE_URL='))
  ?.replace('DATABASE_URL=', '')
  .trim()
  .replace(/^["']|["']$/g, '') // strip surrounding quotes if any

if (!dbUrl) throw new Error('DATABASE_URL not found in .env')
console.log('Using DB URL:', dbUrl.replace(/:[^:@]+@/, ':***@'))

// Import pg from pnpm virtual store using absolute path
const __dirname = dirname(fileURLToPath(import.meta.url))
const pgPath = resolve(__dirname, '../node_modules/.pnpm/pg@8.16.3/node_modules/pg/lib/index.js')
const require = createRequire(import.meta.url)
const pg = require(pgPath)
const { Client } = pg

const client = new Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
})
await client.connect()
console.log('✓ Connected to database')

try {
  // 1. Create enum type (if not exists)
  await client.query(`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_properties_label" AS ENUM('normal', 'vip', 'hot', 'premium');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `)
  console.log('✓ Enum enum_properties_label created (or already exists)')

  // 2. Add label column (if not exists) — no data loss
  await client.query(`
    ALTER TABLE "properties"
    ADD COLUMN IF NOT EXISTS "label" "enum_properties_label" DEFAULT 'normal';
  `)
  console.log('✓ Column "label" added to "properties" table')

  // 3. Verify
  const result = await client.query(`
    SELECT column_name, data_type, udt_name, column_default
    FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'label'
  `)
  if (result.rows.length > 0) {
    console.log('✓ Verified:', result.rows[0])
  } else {
    console.log('✗ Column not found after insert!')
  }
} finally {
  await client.end()
  console.log('✓ Done')
}
