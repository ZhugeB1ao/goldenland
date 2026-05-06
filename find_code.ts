import divisions from './src/app/data/vietnam-divisions.json'

const wardCode = "25846"
let found = null

for (const province of divisions) {
  for (const ward of province.Wards) {
    if (ward.Code === wardCode) {
      found = {
        province: province.FullName,
        provinceCode: province.Code,
        ward: ward.FullName,
        wardCode: ward.Code
      }
      break
    }
  }
  if (found) break
}

console.log('Location for code 25846:', found)
