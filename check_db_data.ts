import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

async function checkDatabase() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  })

  await client.connect()

  // Find the table name. In Payload it might be 'projects'
  try {
    const res = await client.query(`
      SELECT id, name, views, status 
      FROM projects 
      WHERE status = 'active' 
      ORDER BY views DESC 
      LIMIT 4
    `)
    console.log('--- DATABASE DATA (projects table) ---')
    console.log(JSON.stringify(res.rows, null, 2))
  } catch (error) {
    console.error('Error querying projects table:', error.message)
    
    // Maybe the table name is different, let's list tables
    const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
    console.log('Available tables:', tables.rows.map(t => t.table_name).join(', '))
  }

  await client.end()
}

checkDatabase().catch(console.error)
