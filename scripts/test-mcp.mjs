import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { config } from 'dotenv';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: resolve(__dirname, '../.env') });

const connectionString = process.env.SUPABASE_CONNECTION_STRING;
if (!connectionString) {
  console.error('Error: SUPABASE_CONNECTION_STRING not found in environment');
  process.exit(1);
}

const child = spawn('npx', [
  '-y',
  '@modelcontextprotocol/server-postgres',
  connectionString,
  '--test'
], {
  stdio: 'inherit'
});

child.on('error', (error) => {
  console.error('Failed to start MCP test:', error);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code);
}); 