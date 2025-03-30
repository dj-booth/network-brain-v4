import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the origin from the request headers
  const origin = request.headers.get('origin') || '';
  
  // Get allowed origins from environment variable, default to empty array if not set
  const allowedOriginsStr = process.env.CORS_ALLOWED_ORIGINS || '';
  const allowedOrigins = allowedOriginsStr.split(/\s+/).filter(Boolean);
  
  // Check if the origin is allowed
  const isAllowedOrigin = allowedOrigins.includes(origin);
  
  // For preflight OPTIONS requests
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });
    
    if (isAllowedOrigin) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin');
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
    }
    
    return response;
  }
  
  // For actual requests (GET, POST, etc.)
  const response = NextResponse.next();
  
  // Add CORS headers if origin is allowed
  if (isAllowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }
  
  return response;
}

// Apply this middleware only to API routes
export const config = {
  matcher: '/api/:path*',
}; 