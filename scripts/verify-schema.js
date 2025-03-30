const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function verifySchema() {
  const client = new Client({
    connectionString: process.env.SUPABASE_CONNECTION_STRING
  });

  try {
    await client.connect();
    
    // Get all tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('\nTables created:');
    tablesResult.rows.forEach(row => console.log(`- ${row.table_name}`));

    // Get all indexes
    const indexesResult = await client.query(`
      SELECT 
        tablename, 
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `);

    console.log('\nIndexes created:');
    indexesResult.rows.forEach(row => {
      console.log(`\nTable: ${row.tablename}`);
      console.log(`Index: ${row.indexname}`);
      console.log(`Definition: ${row.indexdef}`);
    });

  } catch (error) {
    console.error('Verification failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

verifySchema(); 