import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
  try {
    // Try to query the profile_notes table
    const { data, error } = await supabase
      .from('profile_notes')
      .select('id')
      .limit(1);

    if (error) {
      if (error.code === '42P01') {
        console.error('Table profile_notes does not exist');
        return false;
      }
      throw error;
    }

    console.log('Table profile_notes exists');
    return true;
  } catch (err) {
    console.error('Error checking table:', err);
    return false;
  }
}

checkTable(); 