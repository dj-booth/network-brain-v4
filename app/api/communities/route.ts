import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from '@/app/lib/auth';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// GET all communities
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get communities
    const { data, error } = await supabase
      .from('communities')
      .select('*')
      .order('name');
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({ communities: data });
    
  } catch (error) {
    console.error('Error fetching communities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch communities' },
      { status: 500 }
    );
  }
}

// POST to create a new community
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get request body
    const { name, description } = await request.json();
    
    // Validate
    if (!name) {
      return NextResponse.json(
        { error: 'Missing required parameter: name' },
        { status: 400 }
      );
    }
    
    // Create community
    const { data, error } = await supabase
      .from('communities')
      .insert({
        name,
        description: description || null
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    // Log the action
    await supabase
      .from('audit_logs')
      .insert({
        action_type: 'create_community',
        action_metadata: {
          community_id: data.id,
          community_name: data.name
        },
        performed_by: user.email
      });
    
    return NextResponse.json({
      success: true,
      community: data
    });
    
  } catch (error) {
    console.error('Error creating community:', error);
    return NextResponse.json(
      { error: 'Failed to create community' },
      { status: 500 }
    );
  }
} 