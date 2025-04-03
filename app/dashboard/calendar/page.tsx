import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Define types for the attendee and event data
interface Profile {
  full_name: string;
  email: string;
}

interface Attendee {
  id: string;
  profile_id: string;
  is_organizer: boolean;
  response_status: string | null;
  profiles?: Profile;
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  location: string | null;
  event_attendees: Attendee[];
}

interface Community {
  id: string;
  name: string;
  description: string | null;
}

export default async function CalendarPage() {
  // Check if user is logged in
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('nb_session');
  
  if (!sessionCookie) {
    redirect('/login');
  }
  
  // Create a server-side Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Fetch recent events (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('*, event_attendees(*, profiles(full_name, email))')
    .gte('start_time', thirtyDaysAgo.toISOString())
    .order('start_time', { ascending: false })
    .limit(50);
  
  // Fetch communities
  const { data: communities, error: communitiesError } = await supabase
    .from('communities')
    .select('*')
    .order('name');
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[rgb(66,66,69)]">Calendar Events</h1>
        <div className="flex space-x-4">
          <Link
            href="/api/calendar/events?sync=true"
            className="px-4 py-2 bg-[rgb(255,196,3)] text-black rounded hover:bg-opacity-90"
          >
            Sync Calendar
          </Link>
          <Link
            href="/dashboard"
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
      
      {/* Communities Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Communities</h2>
        {communitiesError ? (
          <p className="text-red-500">Error loading communities</p>
        ) : !communities || communities.length === 0 ? (
          <p className="text-gray-500">No communities found. Create one to categorize your events.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {communities.map((community: Community) => (
              <div key={community.id} className="p-4 border rounded shadow">
                <h3 className="font-medium">{community.name}</h3>
                {community.description && <p className="text-sm text-gray-600">{community.description}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Events Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Events</h2>
        {eventsError ? (
          <p className="text-red-500">Error loading events</p>
        ) : !events || events.length === 0 ? (
          <p className="text-gray-500">No events found. Sync your calendar to view events.</p>
        ) : (
          <div className="space-y-6">
            {events.map((event: Event) => (
              <div key={event.id} className="border rounded-lg shadow overflow-hidden">
                <div className="p-4 bg-gray-50 border-b">
                  <h3 className="text-lg font-medium">{event.title}</h3>
                  <p className="text-sm text-gray-600">{formatDate(event.start_time)}</p>
                  {event.location && <p className="text-sm">📍 {event.location}</p>}
                </div>
                
                <div className="p-4">
                  {event.description && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-1">Description</h4>
                      <p className="text-sm text-gray-700">{event.description}</p>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">Attendees</h4>
                    {!event.event_attendees || event.event_attendees.length === 0 ? (
                      <p className="text-sm text-gray-500">No attendees</p>
                    ) : (
                      <ul className="space-y-1">
                        {event.event_attendees.map((attendee: Attendee) => (
                          <li key={attendee.id} className="text-sm">
                            {attendee.profiles ? (
                              <Link href={`/profiles/${attendee.profile_id}`} className="text-blue-600 hover:underline">
                                {attendee.profiles.full_name}
                              </Link>
                            ) : (
                              'Unknown Attendee'
                            )}
                            {attendee.is_organizer && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Organizer</span>}
                            {attendee.response_status && (
                              <span 
                                className={`ml-2 text-xs px-2 py-0.5 rounded ${
                                  attendee.response_status === 'accepted' 
                                    ? 'bg-green-100 text-green-800' 
                                    : attendee.response_status === 'declined'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {attendee.response_status}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 