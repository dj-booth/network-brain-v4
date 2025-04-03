import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

// JWT Secret for verifying session tokens
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
// Admin email that is allowed to access protected routes
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'david@booth.vc';

export interface SessionUser {
  email: string;
  name?: string;
  picture?: string;
  sub: string;
}

// Verify JWT token from cookie
export function verifyToken(token: string): SessionUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded as SessionUser;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// Get the authenticated user from the request
export function getAuthenticatedUser(request: NextRequest | Request): SessionUser | null {
  const cookieStore = cookies();
  const token = cookieStore.get('nb_session')?.value;
  
  if (!token) {
    return null;
  }
  
  return verifyToken(token);
}

// Middleware to protect routes that require authentication
export function withAuth(handler: (req: NextRequest, user: SessionUser) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const user = getAuthenticatedUser(request);
    
    if (!user) {
      // Redirect to login page if not authenticated
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // Check if user is authorized (admin only for now)
    if (user.email !== ADMIN_EMAIL) {
      // Redirect to unauthorized page if not admin
      return NextResponse.redirect(
        new URL(`/login?error=You are not authorized to access this resource`, request.url)
      );
    }
    
    // Call the handler with the authenticated user
    return handler(request, user);
  };
} 