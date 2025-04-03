import { NextResponse } from 'next/server';
import { getTokens, getUserInfo } from '@/app/lib/googleAuth';
import { saveTokens } from '@/app/lib/googleTokenStorage';
import jwt from 'jsonwebtoken';

// JWT Secret for creating session tokens
const JWT_SECRET = process.env.JWT_SECRET;
// Admin email that is allowed to connect
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'david@booth.vc';

export async function GET(request: Request) {
  // Get the authorization code from the URL query parameters
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  
  if (!code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL || ''}/login?error=No authorization code provided`
    );
  }

  try {
    // Exchange the code for tokens
    const tokens = await getTokens(code);
    
    // Set up the OAuth client with the tokens
    const oauth2Client = getAuthenticatedClient(tokens);
    
    // Get user info to confirm it's the admin
    const userInfo = await getUserInfo(oauth2Client);
    
    if (!userInfo.email) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL || ''}/login?error=Could not retrieve user email`
      );
    }
    
    // Check if the user is authorized
    if (userInfo.email !== ADMIN_EMAIL) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL || ''}/login?error=Unauthorized user`
      );
    }
    
    // Save tokens to database
    await saveTokens(userInfo.email, tokens);
    
    // Create a JWT for the session
    const sessionToken = jwt.sign(
      {
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        sub: userInfo.id,
      },
      JWT_SECRET || 'default-secret',
      { expiresIn: '1d' }
    );
    
    // Set the JWT in a cookie
    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL || ''}/dashboard`
    );
    
    response.cookies.set({
      name: 'nb_session',
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });
    
    return response;
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL || ''}/login?error=Authentication failed`
    );
  }
}

// Import this at the top of the file
import { getAuthenticatedClient } from '@/app/lib/googleAuth'; 