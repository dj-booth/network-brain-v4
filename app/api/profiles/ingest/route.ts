import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js' // Assuming Supabase client is setup elsewhere or needs setup here
import jwt from 'jsonwebtoken'; // Import jsonwebtoken

// --- IMPORTANT ---
// Ensure JWT_SECRET (matching the one used for signing) is set.
// Ensure Supabase variables (e.g., NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY) are set 
// and the Supabase client is correctly initialized.

// TODO: Initialize Supabase client (use environment variables)
// const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!)
const JWT_SECRET = process.env.JWT_SECRET;

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

// TODO: Define expected request body structure using Zod or interfaces
// interface IngestPayload { ... }

export async function POST(request: Request) {
  console.log("Received POST request on /api/profiles/ingest");
  const origin = request.headers.get('origin');

  // 1. Authentication: Verify JWT token
  if (!JWT_SECRET) {
    console.error("Server Configuration Error: JWT_SECRET is not set.");
    const response = NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    return addCorsHeaders(response, origin);
  }
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error("Authentication error: No Bearer token provided.");
    const response = NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    return addCorsHeaders(response, origin);
  }
  const token = authHeader.split(' ')[1];

  try {
     // --- Actual JWT Verification ---
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    console.log("JWT Decoded for ingest:", decoded);

    // Optional: Perform necessary checks on decoded payload 
    // if (decoded.email !== process.env.ADMIN_EMAIL) { ... }

  } catch (error) {
    console.error("Authentication error: Invalid token", error);
    let errorResponse;
    if (error instanceof jwt.TokenExpiredError) {
        errorResponse = NextResponse.json({ error: 'Unauthorized: Token expired' }, { status: 401 });
    }
    else if (error instanceof jwt.JsonWebTokenError) {
         errorResponse = NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }
    else {
      // Generic fallback
       errorResponse = NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }
     return addCorsHeaders(errorResponse, origin);
  }

  // 2. Data Parsing and Validation
  let payload;
  try {
    payload = await request.json();
    console.log("Received Payload:", payload);

    // Basic validation (as per requirements)
    // Adjust field names based on actual payload
    if (!payload.name || !payload.linkedin_profile_url) { 
        console.error("Validation Error: Missing required fields (name or linkedin_profile_url)");
        const response = NextResponse.json({ error: 'Bad Request: Missing required fields' }, { status: 400 });
         return addCorsHeaders(response, origin);
    }
    
    // TODO: More robust validation using Zod against the Supabase schema

  } catch (error) {
    console.error("Error parsing request body:", error);
    const response = NextResponse.json({ error: 'Bad Request: Invalid JSON' }, { status: 400 });
     return addCorsHeaders(response, origin);
  }

  // 3. Data Ingestion into Supabase
  try {
    // TODO: Map payload fields to Supabase 'profiles' table columns
    const profileData = {
        full_name: payload.name,
        linkedin: payload.linkedin_profile_url,
        // ... map other fields like job title, location, bio, pic_url, education, experience
        introduction_notes: payload.introduction_notes, // Use the new single field
        source: 'chrome_extension' // Add a source field maybe?
    };

    console.log("Data prepared for Supabase:", profileData);

    // TODO: Insert data into Supabase
    // const { data, error } = await supabase
    //   .from('profiles') // Use your actual table name
    //   .insert([profileData])
    //   .select(); 

    // if (error) {
    //   console.error('Supabase Insert Error:', error);
    //   throw new Error(error.message);
    // }

    // console.log('Supabase Insert Success:', data);
    // const response = NextResponse.json({ success: true, profileId: data ? data[0].id : null }, { status: 201 });

    console.log("Simulating Supabase insert."); // Placeholder
    const response = NextResponse.json({ success: true, profileId: 'dummy-uuid-' + Date.now() }, { status: 201 }); // Placeholder response
    return addCorsHeaders(response, origin);

  } catch (error) {
    console.error("Error ingesting data into Supabase:", error);
    // Differentiate between validation errors and server errors if needed
    const response = NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
     return addCorsHeaders(response, origin);
  }
}

// Handle preflight OPTIONS request
export async function OPTIONS(request: Request) {
  console.log("Received OPTIONS request on /api/profiles/ingest");
  const origin = request.headers.get('origin');
  const response = new NextResponse(null, { status: 204 });
  return addCorsHeaders(response, origin);
} 