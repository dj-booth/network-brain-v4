import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Save Google tokens to Supabase
export async function saveTokens(userEmail: string, tokens: any) {
  const { access_token, refresh_token, expiry_date, scope, token_type, id_token } = tokens;
  
  const { data, error } = await supabase
    .from('google_tokens')
    .upsert({
      user_email: userEmail,
      access_token,
      refresh_token,
      expiry_date,
      scope,
      token_type,
      id_token,
      updated_at: new Date()
    }, {
      onConflict: 'user_email'
    });

  if (error) {
    console.error('Error saving Google tokens:', error);
    throw error;
  }

  return data;
}

// Get Google tokens from Supabase
export async function getTokens(userEmail: string) {
  const { data, error } = await supabase
    .from('google_tokens')
    .select('*')
    .eq('user_email', userEmail)
    .single();

  if (error) {
    if (error.code === 'PGRST116') { // Record not found
      return null;
    }
    console.error('Error getting Google tokens:', error);
    throw error;
  }

  return data;
}

// Check if tokens are expired
export function areTokensExpired(tokens: any) {
  if (!tokens || !tokens.expiry_date) {
    return true;
  }

  // Add a buffer of 5 minutes (300000 ms)
  return Date.now() >= (tokens.expiry_date - 300000);
}

// Delete tokens for a user
export async function deleteTokens(userEmail: string) {
  const { error } = await supabase
    .from('google_tokens')
    .delete()
    .eq('user_email', userEmail);

  if (error) {
    console.error('Error deleting Google tokens:', error);
    throw error;
  }

  return true;
} 