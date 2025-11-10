require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkRides() {
  const result = await pool.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'rides'
    ORDER BY ordinal_position
  `);
  
  console.log('Columns in rides table:');
  result.rows.forEach(col => console.log(`  - ${col.column_name}`));
  
  await pool.end();
}

checkRides();
