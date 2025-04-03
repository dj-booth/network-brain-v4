import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Try to query the profile_notes table
    const { data, error } = await supabase
      .from('profile_notes')
      .select('id')
      .limit(1);

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ exists: false, message: 'Table does not exist' });
      }
      throw error;
    }

    return NextResponse.json({ exists: true, message: 'Table exists' });
  } catch (err) {
    console.error('Error checking table:', err);
    return NextResponse.json(
      { error: 'Failed to check table existence' },
      { status: 500 }
    );
  }
} 