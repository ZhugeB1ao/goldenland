import dotenv from 'dotenv'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { sql } from '@payloadcms/db-postgres'

dotenv.config({ path: '.env' })

const payload = await getPayload({ config: await config })

// Dùng drizzle từ payload DB adapter để chạy raw SQL
const db = (payload.db as any).drizzle

try {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_properties_label" AS ENUM('normal', 'vip', 'hot', 'premium');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `)
  console.log('✓ Enum enum_properties_label OK')

  await db.execute(sql`
    ALTER TABLE "properties"
    ADD COLUMN IF NOT EXISTS "label" "enum_properties_label" DEFAULT 'normal';
  `)
  console.log('✓ Column "label" added to "properties" table')

  const result = await db.execute(sql`
    SELECT column_name, udt_name
    FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'label'
  `)
  console.log('✓ Verified:', result.rows?.[0] ?? result[0] ?? 'NOT FOUND')

} finally {
  process.exit(0)
}
