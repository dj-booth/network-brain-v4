import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getTokens, deleteTokens } from '@/app/lib/googleTokenStorage';
import { getOAuth2Client } from '@/app/lib/googleAuth';

// JWT Secret for verifying session tokens
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';

export async function POST() {
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
      // No tokens to revoke
      return NextResponse.json({ success: true, message: 'No active Google connection found' });
    }
    
    try {
      // Attempt to revoke the token with Google
      const oauth2Client = getOAuth2Client();
      await oauth2Client.revokeToken(tokenData.access_token);
      
      // Revocation succeeded, delete tokens from database
      await deleteTokens(payload.email);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Google access successfully revoked' 
      });
    } catch (revokeError) {
      console.error('Error revoking token with Google:', revokeError);
      
      // Even if the revocation fails with Google, still delete tokens from our database
      await deleteTokens(payload.email);
      
      return NextResponse.json({ 
        success: true, 
        warning: 'Token may not have been properly revoked with Google, but removed from our database' 
      });
    }
    
  } catch (error) {
    console.error('Error in revoke process:', error);
    return NextResponse.json({ 
      error: 'Failed to revoke Google access' 
    }, { status: 500 });
  }
} 