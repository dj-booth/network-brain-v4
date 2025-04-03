import { getTokens } from './googleTokenStorage';
import { getAuthenticatedClient, getCalendarApi } from './googleAuth';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Fetch events from Google Calendar
 * @param userEmail - The email of the user whose calendar to fetch
 * @param timeMin - The minimum time (ISO string) to fetch events from
 * @param timeMax - The maximum time (ISO string) to fetch events from
 * @returns An array of Google Calendar events
 */
export async function fetchCalendarEvents(userEmail: string, timeMin: string, timeMax: string) {
  try {
    // Get tokens from database
    const tokenData = await getTokens(userEmail);
    
    if (!tokenData) {
      throw new Error('No Google tokens found for user');
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
    
    // Fetch events
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin,
      timeMax: timeMax,
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 1000 // Adjust based on your needs
    });
    
    return response.data.items || [];
    
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    throw error;
  }
}

/**
 * Store calendar events and attendees in the database
 * @param userEmail - The email of the authenticated user
 * @param events - Array of Google Calendar events
 * @param communityId - Optional community ID to associate events with
 */
export async function storeCalendarEvents(userEmail: string, events: any[], communityId?: string) {
  try {
    for (const event of events) {
      // Skip events without a valid ID
      if (!event.id) continue;
      
      // Create event record
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .upsert({
          google_event_id: event.id,
          title: event.summary || 'Untitled Event',
          description: event.description || null,
          start_time: event.start?.dateTime || event.start?.date,
          end_time: event.end?.dateTime || event.end?.date || null,
          location: event.location || null,
          organizer_email: event.organizer?.email || null,
          link: event.htmlLink || null,
          is_recurring: Array.isArray(event.recurrence) && event.recurrence.length > 0,
          recurrence_pattern: Array.isArray(event.recurrence) ? event.recurrence.join('; ') : null,
          community_id: communityId || null,
          updated_at: new Date()
        }, {
          onConflict: 'google_event_id'
        })
        .select('id')
        .single();
      
      if (eventError) {
        console.error('Error storing event:', eventError);
        continue;
      }
      
      // Process attendees if present
      if (Array.isArray(event.attendees) && event.attendees.length > 0) {
        await processAttendees(eventData.id, event.attendees);
      }
    }
    
    return { success: true };
    
  } catch (error) {
    console.error('Error storing calendar events:', error);
    throw error;
  }
}

/**
 * Process attendees for an event
 * @param eventId - UUID of the event in our database
 * @param attendees - Array of attendee objects from Google Calendar
 */
async function processAttendees(eventId: string, attendees: any[]) {
  try {
    for (const attendee of attendees) {
      if (!attendee.email) continue;
      
      // Try to find a matching profile by email
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', attendee.email)
        .limit(1);
      
      // If profile not found by email and display name is available, try to find by name
      let profileId = null;
      if ((!profileData || profileData.length === 0) && attendee.displayName) {
        const names = attendee.displayName.split(' ');
        if (names.length >= 2) {
          const { data: nameProfileData, error: nameProfileError } = await supabase
            .from('profiles')
            .select('id')
            .ilike('full_name', `%${attendee.displayName}%`)
            .limit(1);
          
          if (nameProfileData && nameProfileData.length > 0) {
            profileId = nameProfileData[0].id;
          }
        }
      } else if (profileData && profileData.length > 0) {
        profileId = profileData[0].id;
      }
      
      // If no profile found, create one
      if (!profileId) {
        const { data: newProfile, error: newProfileError } = await supabase
          .from('profiles')
          .insert({
            full_name: attendee.displayName || attendee.email.split('@')[0],
            email: attendee.email,
            profile_created_at: new Date()
          })
          .select('id')
          .single();
        
        if (newProfileError) {
          console.error('Error creating new profile:', newProfileError);
          continue;
        }
        
        profileId = newProfile.id;
      }
      
      // Create or update the attendee record
      const { error: attendeeError } = await supabase
        .from('event_attendees')
        .upsert({
          event_id: eventId,
          profile_id: profileId,
          response_status: attendee.responseStatus || null,
          is_organizer: attendee.organizer === true,
          updated_at: new Date()
        }, {
          onConflict: 'event_id,profile_id'
        });
      
      if (attendeeError) {
        console.error('Error storing attendee:', attendeeError);
      }
    }
  } catch (error) {
    console.error('Error processing attendees:', error);
    throw error;
  }
} 