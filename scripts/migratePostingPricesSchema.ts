import dotenv from 'dotenv'
import pg from 'pg'

dotenv.config()

const { Client } = pg

const hasColumn = async (client: pg.Client, tableName: string, columnName: string) => {
  const result = await client.query(
    `
      select 1
      from information_schema.columns
      where table_schema = current_schema()
        and table_name = $1
        and column_name = $2
      limit 1
    `,
    [tableName, columnName],
  )

  return result.rowCount > 0
}

const tableExists = async (client: pg.Client, tableName: string) => {
  const result = await client.query(
    `
      select 1
      from information_schema.tables
      where table_schema = current_schema()
        and table_name = $1
      limit 1
    `,
    [tableName],
  )

  return result.rowCount > 0
}

async function run() {
  if (!process.env.DATABASE_URL) {
    throw new Error('Missing DATABASE_URL')
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()

  try {
    await client.query('begin')

    await client.query(`
      alter table posting_prices
        add column if not exists description text,
        add column if not exists display_multiplier numeric not null default 1,
        add column if not exists daily_price numeric not null default 0,
        add column if not exists recommended_duration_days numeric not null default 15
    `)

    const hasOldPrice = await hasColumn(client, 'posting_prices', 'price')
    const hasOldDurationDays = await hasColumn(client, 'posting_prices', 'duration_days')

    if (hasOldPrice) {
      await client.query(`
        update posting_prices
        set daily_price = price
        where coalesce(daily_price, 0) = 0
          and price is not null
      `)
    }

    if (hasOldDurationDays) {
      await client.query(`
        update posting_prices
        set recommended_duration_days = duration_days
        where duration_days is not null
          and (recommended_duration_days is null or recommended_duration_days = 15)
      `)
    }

    await client.query(`
      create table if not exists posting_prices_duration_options (
        id varchar primary key default gen_random_uuid()::text,
        _order integer not null default 0,
        _parent_id integer not null references posting_prices(id) on delete cascade,
        duration_days numeric not null,
        discount_percent numeric default 0,
        label varchar
      )
    `)

    await client.query(`
      create index if not exists posting_prices_duration_options_parent_id_idx
      on posting_prices_duration_options (_parent_id)
    `)

    await client.query(`
      create index if not exists posting_prices_duration_options_order_idx
      on posting_prices_duration_options (_order)
    `)

    if (hasOldDurationDays) {
      await client.query(`
        insert into posting_prices_duration_options (_parent_id, _order, duration_days, discount_percent, label)
        select id, 0, duration_days, 0, 'Đề xuất'
        from posting_prices
        where duration_days is not null
          and not exists (
            select 1
            from posting_prices_duration_options
            where posting_prices_duration_options._parent_id = posting_prices.id
          )
      `)
    }

    if (!(await tableExists(client, 'posting_prices_duration_options'))) {
      throw new Error('posting_prices_duration_options was not created')
    }

    await client.query('commit')
    console.log('Posting prices schema migration complete.')
  } catch (error) {
    await client.query('rollback')
    throw error
  } finally {
    await client.end()
  }
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
