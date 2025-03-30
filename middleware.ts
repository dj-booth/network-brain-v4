import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  console.log(`[Middleware] Request received for path: ${pathname}, Method: ${request.method}`);

  // Get the origin from the request headers
  const origin = request.headers.get('origin') || '';
  console.log(`[Middleware] Request origin: ${origin}`);
  
  // Get allowed origins from environment variable, default to empty array if not set
  const allowedOriginsStr = process.env.CORS_ALLOWED_ORIGINS || '';
  console.log(`[Middleware] Raw CORS_ALLOWED_ORIGINS env var: "${allowedOriginsStr}"`);
  const allowedOrigins = allowedOriginsStr.split(/\s+/).filter(Boolean);
  console.log(`[Middleware] Parsed allowed origins:`, allowedOrigins);
  
  // Check if the origin is allowed
  const isAllowedOrigin = allowedOrigins.includes(origin);
  console.log(`[Middleware] Is origin "${origin}" allowed? ${isAllowedOrigin}`);
  
  // For preflight OPTIONS requests
  if (request.method === 'OPTIONS') {
    console.log(`[Middleware] Handling OPTIONS preflight request for origin: ${origin}`);
    const response = new NextResponse(null, { status: 204 });
    
    if (isAllowedOrigin) {
      console.log(`[Middleware] Setting OPTIONS headers for allowed origin: ${origin}`);
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin'); // Ensure Origin is allowed here if needed by the browser
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
    } else {
      console.log(`[Middleware] OPTIONS request from disallowed origin: ${origin}`);
      // Optionally, you could return a 403 Forbidden here, but often just returning 204 without CORS headers is sufficient for browsers to block.
    }
    
    return response;
  }
  
  // For actual requests (GET, POST, etc.)
  console.log(`[Middleware] Handling ${request.method} request for origin: ${origin}`);
  const response = NextResponse.next();
  
  // Add CORS headers if origin is allowed
  if (isAllowedOrigin) {
    console.log(`[Middleware] Setting CORS headers for allowed origin: ${origin}`);
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  } else {
     console.log(`[Middleware] Request from disallowed origin: ${origin}. Not setting CORS headers.`);
  }
  
  return response;
}

// Apply this middleware only to API routes
export const config = {
  matcher: '/api/:path*',
}; 