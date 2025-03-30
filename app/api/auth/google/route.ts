import { NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';

// --- IMPORTANT ---
// Ensure GOOGLE_CLIENT_ID (matching the one used in the extension's background script),
// JWT_SECRET (must be the same across all backend endpoints), 
// and ADMIN_EMAIL (the specific authorized user) are set in your Next.js environment variables.
// Install necessary packages: npm install google-auth-library jsonwebtoken @types/jsonwebtoken

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL; // The specific email allowed to use the extension

// Allow specific Chrome extension origin
const ALLOWED_ORIGIN = 'chrome-extension://pofgfedjebidalhfhhfdbajjihnfamen'; // Use single value

// Helper to add CORS headers
function addCorsHeaders(response: NextResponse, requestOrigin: string | null) {
  if (requestOrigin === ALLOWED_ORIGIN) {
    response.headers.set('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin');
    response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
  }
  return response;
}

export async function POST(request: Request) {
    console.log("Received POST request on /api/auth/google");
    const origin = request.headers.get('origin');

    if (!process.env.GOOGLE_CLIENT_ID || !JWT_SECRET || !ADMIN_EMAIL) {
        console.error("Server Configuration Error: Missing GOOGLE_CLIENT_ID, JWT_SECRET, or ADMIN_EMAIL");
        const response = NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        return addCorsHeaders(response, origin);
    }

    try {
        const { token: googleToken } = await request.json(); // Expecting { "token": "GOOGLE_ID_TOKEN" }

        if (!googleToken) {
            const response = NextResponse.json({ error: 'Missing Google ID token' }, { status: 400 });
             return addCorsHeaders(response, origin);
        }

        // Verify the Google ID token
        const ticket = await client.verifyIdToken({
            idToken: googleToken,
            audience: process.env.GOOGLE_CLIENT_ID, // Specify the CLIENT_ID of the app that accesses the backend
        });
        const payload = ticket.getPayload();

        if (!payload || !payload.email) {
            console.error("Google token verification failed: No payload or email.");
            const response = NextResponse.json({ error: 'Invalid Google token' }, { status: 401 });
            return addCorsHeaders(response, origin);
        }

        const userEmail = payload.email;
        console.log(`Google token verified for email: ${userEmail}`);

        // --- Authorization Check ---
        // Ensure the authenticated user is the designated admin
        if (userEmail !== ADMIN_EMAIL) {
            console.warn(`Authorization Failed: User ${userEmail} is not the designated admin.`);
            const response = NextResponse.json({ error: 'Unauthorized user' }, { status: 403 }); // Forbidden
             return addCorsHeaders(response, origin);
        }

        // --- JWT Generation ---
        // User is authenticated and authorized, issue our JWT
        const appJwtPayload = {
            email: userEmail,
            sub: payload.sub, // Google User ID
            // Add any other relevant claims
        };

        const appJwt = jwt.sign(appJwtPayload, JWT_SECRET, { expiresIn: '1d' }); // Token valid for 1 day

        console.log(`JWT generated successfully for ${userEmail}`);
        const response = NextResponse.json({ jwt: appJwt }, { status: 200 });
         return addCorsHeaders(response, origin);

    } catch (error) {
        console.error("Error during Google token verification or JWT generation:", error);
        const response = NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
         return addCorsHeaders(response, origin);
    }
}

// Handle preflight OPTIONS request
export async function OPTIONS(request: Request) {
    console.log("Received OPTIONS request on /api/auth/google");
    const origin = request.headers.get('origin');
    const response = new NextResponse(null, { status: 204 });
    return addCorsHeaders(response, origin);
} 