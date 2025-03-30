const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function testConnection() {
  const client = new Client({
    connectionString: process.env.SUPABASE_CONNECTION_STRING
  });

  try {
    console.log('Connecting to Supabase...');
    await client.connect();
    console.log('Connection successful!');

    const result = await client.query('SELECT NOW()');
    console.log('Database time:', result.rows[0].now);

    await client.end();
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Connection failed:', error.message);
    process.exit(1);
  }
}

testConnection(); 