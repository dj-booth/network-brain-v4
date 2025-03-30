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
const ALLOWED_ORIGINS = [
  'chrome-extension://pofgfedjebidalhfhhfdbajjihnfamen'
];

// TODO: Define expected request body structure using Zod or interfaces
// interface IngestPayload { ... }

export async function POST(request: Request) {
  console.log("Received request on /api/profiles/ingest");

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

  // 1. Authentication: Verify JWT token
  if (!JWT_SECRET) {
    console.error("Server Configuration Error: JWT_SECRET is not set.");
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500, headers });
  }
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error("Authentication error: No Bearer token provided.");
    return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401, headers });
  }
  const token = authHeader.split(' ')[1];

  try {
     // --- Actual JWT Verification ---
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    console.log("JWT Decoded for ingest:", decoded);

    // Optional: Perform necessary checks on decoded payload 
    // if (decoded.email !== process.env.ADMIN_EMAIL) { ... }

    // console.log("Simulating JWT verification for token:", token); // Placeholder removed

  } catch (error) {
    console.error("Authentication error: Invalid token", error);
    // Handle specific JWT errors (e.g., TokenExpiredError)
    if (error instanceof jwt.TokenExpiredError) {
        return NextResponse.json({ error: 'Unauthorized: Token expired' }, { status: 401, headers });
    }
    if (error instanceof jwt.JsonWebTokenError) {
         return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401, headers });
    }
    // Generic fallback
    return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401, headers });
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
        return NextResponse.json({ error: 'Bad Request: Missing required fields' }, { status: 400, headers });
    }
    
    // TODO: More robust validation using Zod against the Supabase schema

  } catch (error) {
    console.error("Error parsing request body:", error);
    return NextResponse.json({ error: 'Bad Request: Invalid JSON' }, { status: 400, headers });
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
    // return NextResponse.json({ success: true, profileId: data ? data[0].id : null }, { status: 201 });

    console.log("Simulating Supabase insert."); // Placeholder
    return NextResponse.json({ success: true, profileId: 'dummy-uuid-' + Date.now() }, { status: 201, headers }); // Placeholder response

  } catch (error) {
    console.error("Error ingesting data into Supabase:", error);
    // Differentiate between validation errors and server errors if needed
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers });
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