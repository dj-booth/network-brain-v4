import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import Link from 'next/link';
import EmailComposer from '@/app/components/EmailComposer';

export default function EmailPage() {
  // Check if user is logged in
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('nb_session');
  
  if (!sessionCookie) {
    redirect('/login');
  }
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[rgb(66,66,69)]">Email Sender</h1>
        <Link
          href="/dashboard"
          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
        >
          Back to Dashboard
        </Link>
      </div>
      
      <EmailComposer />
    </div>
  );
} 