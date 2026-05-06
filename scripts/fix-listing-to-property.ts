import pg from 'pg'
import dotenv from 'dotenv'
dotenv.config()

async function migrate() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })
  
  try {
    await client.connect()
    console.log('Connected to DB.')

    const queries = [
      'ALTER TABLE reports RENAME COLUMN listing_id TO property_id;',
      'ALTER TABLE orders RENAME COLUMN listing_id TO property_id;',
      'ALTER TABLE view_history RENAME COLUMN listing_id TO property_id;',
      'ALTER TABLE packages RENAME COLUMN total_listings TO total_properties;',
      'ALTER TABLE packages RENAME COLUMN listing_duration_days TO property_duration_days;',
      'ALTER TABLE payload_locked_documents_rels RENAME COLUMN listings_id TO properties_id;',
      'ALTER TABLE payload_locked_documents_rels RENAME COLUMN saved_listings_id TO saved_properties_id;'
    ]

    for (const query of queries) {
      try {
        console.log(`Executing: ${query}`)
        await client.query(query)
      } catch (e) {
        console.warn(`Failed: ${query} - ${e instanceof Error ? e.message : e}`)
      }
    }

    console.log('Migration complete.')

  } catch (err) {
    console.error('Migration failed:', err)
  } finally {
    await client.end()
  }
}

migrate()
