import { NextRequest, NextResponse } from 'next/server';
import { fetchCalendarEvents, storeCalendarEvents } from '@/app/lib/calendarService';
import { getAuthenticatedUser } from '@/app/lib/auth';

// Handler for GET requests to fetch events
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const timeMin = searchParams.get('timeMin') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // Default to 30 days ago
    const timeMax = searchParams.get('timeMax') || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // Default to 30 days ahead
    const communityId = searchParams.get('communityId') || undefined;
    
    // Fetch events from Google Calendar
    const events = await fetchCalendarEvents(user.email, timeMin, timeMax);
    
    // Store events in database
    await storeCalendarEvents(user.email, events, communityId || undefined);
    
    // Return events
    return NextResponse.json({ events });
    
  } catch (error) {
    console.error('Calendar events fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar events' },
      { status: 500 }
    );
  }
}

// Handler for POST requests to manually sync events
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get request body
    const { timeMin, timeMax, communityId } = await request.json();
    
    // Validate
    if (!timeMin || !timeMax) {
      return NextResponse.json(
        { error: 'Missing required parameters: timeMin and timeMax' },
        { status: 400 }
      );
    }
    
    // Fetch events from Google Calendar
    const events = await fetchCalendarEvents(user.email, timeMin, timeMax);
    
    // Store events in database
    await storeCalendarEvents(user.email, events, communityId);
    
    // Return success
    return NextResponse.json({
      success: true,
      message: `Synced ${events.length} events`,
      eventCount: events.length
    });
    
  } catch (error) {
    console.error('Calendar events sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync calendar events' },
      { status: 500 }
    );
  }
} 