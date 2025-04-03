import { NextResponse } from 'next/server';
import { getAuthUrl } from '@/app/lib/googleAuth';

export async function GET() {
  try {
    // Generate the Google OAuth URL
    const authUrl = getAuthUrl();
    
    // Redirect to Google's OAuth consent screen
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Failed to generate Google OAuth URL:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL || ''}/login?error=Failed to start authentication`
    );
  }
} 