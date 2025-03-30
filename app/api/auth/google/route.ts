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
const ALLOWED_ORIGINS = [
    'chrome-extension://pofgfedjebidalhfhhfdbajjihnfamen'
];

export async function POST(request: Request) {
    console.log("Received request on /api/auth/google");

    // Handle CORS
    const origin = request.headers.get('origin') || '';
    const isAllowedOrigin = ALLOWED_ORIGINS.includes(origin);
    
    // Default headers
    const headers: Record<string, string> = {
        'Access-Control-Allow-Credentials': 'true',
        'Content-Type': 'application/json',
    };
    
    // Add CORS headers if origin is allowed
    if (isAllowedOrigin) {
        headers['Access-Control-Allow-Origin'] = origin;
    }

    if (!process.env.GOOGLE_CLIENT_ID || !JWT_SECRET || !ADMIN_EMAIL) {
        console.error("Server Configuration Error: Missing GOOGLE_CLIENT_ID, JWT_SECRET, or ADMIN_EMAIL");
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500, headers });
    }

    try {
        const { token: googleToken } = await request.json(); // Expecting { "token": "GOOGLE_ID_TOKEN" }

        if (!googleToken) {
            return NextResponse.json({ error: 'Missing Google ID token' }, { status: 400, headers });
        }

        // Verify the Google ID token
        const ticket = await client.verifyIdToken({
            idToken: googleToken,
            audience: process.env.GOOGLE_CLIENT_ID, // Specify the CLIENT_ID of the app that accesses the backend
        });
        const payload = ticket.getPayload();

        if (!payload || !payload.email) {
            console.error("Google token verification failed: No payload or email.");
            return NextResponse.json({ error: 'Invalid Google token' }, { status: 401, headers });
        }

        const userEmail = payload.email;
        console.log(`Google token verified for email: ${userEmail}`);

        // --- Authorization Check ---
        // Ensure the authenticated user is the designated admin
        if (userEmail !== ADMIN_EMAIL) {
            console.warn(`Authorization Failed: User ${userEmail} is not the designated admin.`);
            return NextResponse.json({ error: 'Unauthorized user' }, { status: 403, headers }); // Forbidden
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
        return NextResponse.json({ jwt: appJwt }, { status: 200, headers });

    } catch (error) {
        console.error("Error during Google token verification or JWT generation:", error);
        return NextResponse.json({ error: 'Authentication failed' }, { status: 500, headers });
    }
}

// Handle preflight OPTIONS request
export async function OPTIONS(request: Request) {
    const origin = request.headers.get('origin') || '';
    const isAllowedOrigin = ALLOWED_ORIGINS.includes(origin);
    
    // Default headers for OPTIONS
    const headers: Record<string, string> = {
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400', // 24 hours
    };
    
    // Add CORS origin if allowed
    if (isAllowedOrigin) {
        headers['Access-Control-Allow-Origin'] = origin;
    }
    
    return new NextResponse(null, { status: 204, headers });
} 