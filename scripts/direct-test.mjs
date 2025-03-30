import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { config } from 'dotenv';
import postgres from '@modelcontextprotocol/server-postgres';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: resolve(__dirname, '../.env') });

const connectionString = process.env.SUPABASE_CONNECTION_STRING;
if (!connectionString) {
  console.error('Error: SUPABASE_CONNECTION_STRING not found in environment');
  process.exit(1);
}

try {
  console.log('Testing connection to Supabase...');
  const client = await postgres(connectionString);
  console.log('Connection successful!');
  
  // Test a simple query
  const result = await client.query('SELECT NOW()');
  console.log('Database time:', result.rows[0].now);
  
  await client.end();
  console.log('Test completed successfully!');
} catch (error) {
  console.error('Connection test failed:', error);
  process.exit(1);
} 