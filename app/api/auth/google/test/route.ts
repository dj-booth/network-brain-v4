import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getTokens } from '@/app/lib/googleTokenStorage';
import { getAuthenticatedClient, getCalendarApi } from '@/app/lib/googleAuth';

// JWT Secret for verifying session tokens
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';

export async function GET() {
  try {
    // Check if user is authenticated
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('nb_session')?.value;
    
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify the JWT token
    const payload = jwt.verify(sessionCookie, JWT_SECRET) as { email: string, sub: string };
    
    if (!payload || !payload.email) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    
    // Get user's Google tokens
    const tokenData = await getTokens(payload.email);
    
    if (!tokenData) {
      return NextResponse.json({ error: 'No Google connection found. Please connect to Google first.' }, { status: 400 });
    }
    
    // Convert stored tokens to format expected by Google API
    const tokens = {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expiry_date: tokenData.expiry_date,
      token_type: tokenData.token_type,
      id_token: tokenData.id_token,
      scope: tokenData.scope
    };
    
    // Setup authenticated client
    const oauth2Client = getAuthenticatedClient(tokens);
    
    // Get Calendar API
    const calendar = getCalendarApi(oauth2Client);
    
    // Try to fetch 5 upcoming events from the calendar to test access
    const now = new Date();
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
    
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: now.toISOString(),
      timeMax: oneMonthFromNow.toISOString(),
      maxResults: 5,
      singleEvents: true,
      orderBy: 'startTime',
    });
    
    // Return success with sample of events
    return NextResponse.json({
      success: true,
      message: 'Successfully connected to Google Calendar',
      events_sample: response.data.items?.map(event => ({
        id: event.id,
        summary: event.summary,
        start: event.start,
        end: event.end,
        attendees: event.attendees?.length || 0
      })) || [],
      total_events_found: response.data.items?.length || 0
    });
    
  } catch (error) {
    console.error('Error testing Google Calendar access:', error);
    return NextResponse.json({ 
      error: 'Failed to test Google Calendar access',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 