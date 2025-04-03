import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getTokens } from '@/app/lib/googleTokenStorage';

// JWT Secret for verifying session tokens
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';

// Define a type for our JWT payload
type JWTPayload = {
  email: string;
  sub: string;
  name?: string;
  picture?: string;
};

export async function GET() {
  try {
    // Check if user is authenticated by looking for their session cookie
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('nb_session')?.value;
    
    if (!sessionCookie) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    
    // Verify the JWT token
    const payload = jwt.verify(sessionCookie, JWT_SECRET) as JWTPayload;
    
    if (!payload || !payload.email) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    
    // Check if we have Google tokens for the user
    const tokenData = await getTokens(payload.email);
    
    if (!tokenData) {
      return NextResponse.json({ 
        authenticated: true,
        user: { email: payload.email },
        google_connected: false
      });
    }
    
    // Determine which scopes are granted
    const scopes = tokenData.scope ? tokenData.scope.split(' ') : [];
    
    return NextResponse.json({
      authenticated: true,
      google_connected: true,
      user: { 
        email: payload.email,
        name: payload.name,
        picture: payload.picture
      },
      scopes: scopes,
      // Include token expiry info to determine if refresh is needed
      token_expires_at: tokenData.expiry_date
    });
    
  } catch (error) {
    console.error('Error verifying authentication:', error);
    return NextResponse.json({ authenticated: false, error: 'Authentication verification failed' }, { status: 500 });
  }
} 