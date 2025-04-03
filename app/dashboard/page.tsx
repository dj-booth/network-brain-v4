import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default async function DashboardPage() {
  // Check if user is logged in
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('nb_session');
  
  if (!sessionCookie) {
    redirect('/login');
  }
  
  // Create server-side Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Fetch recent profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .order('profile_created_at', { ascending: false })
    .limit(5);
  
  // Fetch recent events
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('*')
    .order('start_time', { ascending: false })
    .limit(5);
  
  // Fetch profile count
  const { count: profileCount, error: countError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });
  
  // Fetch event count
  const { count: eventCount, error: eventCountError } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true });
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-[rgb(66,66,69)]">Network Brain Dashboard</h1>
      
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Profiles</h2>
          <p className="text-3xl font-bold">{profileCount || 0}</p>
          <Link href="/profiles" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
            View all profiles
          </Link>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Calendar Events</h2>
          <p className="text-3xl font-bold">{eventCount || 0}</p>
          <Link href="/dashboard/calendar" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
            View all events
          </Link>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Actions</h2>
          <div className="space-y-2">
            <Link 
              href="/dashboard/email" 
              className="block px-4 py-2 bg-[rgb(255,196,3)] text-black text-center rounded hover:bg-opacity-90"
            >
              Compose Email
            </Link>
            <Link 
              href="/api/calendar/events" 
              className="block px-4 py-2 border border-gray-300 text-center rounded hover:bg-gray-50"
            >
              Sync Calendar
            </Link>
          </div>
        </div>
      </div>
      
      {/* Recent Profiles */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recent Profiles</h2>
          <Link href="/profiles" className="text-blue-600 hover:underline">
            View all
          </Link>
        </div>
        
        {profilesError ? (
          <p className="text-red-500">Error loading profiles</p>
        ) : !profiles || profiles.length === 0 ? (
          <p className="text-gray-500">No profiles found</p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {profiles.map((profile) => (
                  <tr key={profile.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/profiles/${profile.id}`} className="text-blue-600 hover:underline">
                        {profile.full_name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{profile.email || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {profile.profile_created_at ? new Date(profile.profile_created_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{profile.credibility_score || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Recent Events */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recent Calendar Events</h2>
          <Link href="/dashboard/calendar" className="text-blue-600 hover:underline">
            View all
          </Link>
        </div>
        
        {eventsError ? (
          <p className="text-red-500">Error loading events</p>
        ) : !events || events.length === 0 ? (
          <p className="text-gray-500">No events found. <Link href="/api/calendar/events" className="text-blue-600 hover:underline">Sync your calendar</Link> to view events.</p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {events.map((event) => (
                  <tr key={event.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/dashboard/calendar?event=${event.id}`} className="text-blue-600 hover:underline">
                        {event.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {event.start_time ? new Date(event.start_time).toLocaleString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{event.location || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 