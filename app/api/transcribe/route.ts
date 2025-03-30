import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import jwt from 'jsonwebtoken'; // Import jsonwebtoken

// --- IMPORTANT ---
// Ensure you have OPENAI_API_KEY and JWT_SECRET set in your environment variables
// You will also need to install the openai package: npm install openai
// and a JWT library like jsonwebtoken: npm install jsonwebtoken @types/jsonwebtoken

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const JWT_SECRET = process.env.JWT_SECRET;

// Allow specific Chrome extension origin
const ALLOWED_ORIGINS = [
  'chrome-extension://pofgfedjebidalhfhhfdbajjihnfamen'
];

export async function POST(request: Request) {
  console.log("Received request on /api/transcribe");

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
    console.log("JWT Decoded for transcribe:", decoded);

    // Optional: Perform necessary checks on decoded payload (e.g., check email against ADMIN_EMAIL if needed here too)
    // if (decoded.email !== process.env.ADMIN_EMAIL) { ... }

    // console.log("Simulating JWT verification for transcribe token:", token); // Placeholder removed

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

  // 2. Parse FormData and Extract Audio File
  let audioFile: File | null = null;
  try {
    const formData = await request.formData();
    const fileEntry = formData.get('file'); // Matches the key used in modal.ts

    if (!fileEntry || !(fileEntry instanceof File)) {
      console.error("Bad Request: 'file' field missing or not a File in FormData.");
      return NextResponse.json({ error: "Bad Request: Missing audio file" }, { status: 400, headers });
    }
    audioFile = fileEntry;
    console.log(`Received audio file: ${audioFile.name}, size: ${audioFile.size}, type: ${audioFile.type}`);

  } catch (error) {
    console.error("Error parsing FormData:", error);
    return NextResponse.json({ error: 'Bad Request: Invalid FormData' }, { status: 400, headers });
  }

  // 3. Transcribe using OpenAI Whisper API
  if (!openai.apiKey) {
     console.error("Server Configuration Error: OPENAI_API_KEY is not set.");
     return NextResponse.json({ error: 'Server configuration error' }, { status: 500, headers });
  }

  try {
    console.log("Sending audio to OpenAI Whisper API...");
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile, // Pass the File object directly
      model: 'whisper-1',
      // language: 'en', // Optional: Specify language if needed
      // response_format: 'json' // Default is json
    });

    console.log("Transcription successful:", transcription);

    // Return only the text part of the transcription
    return NextResponse.json({ text: transcription.text }, { status: 200, headers });

  } catch (error: any) {
    console.error("Error calling OpenAI Whisper API:", error);
    const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
    return NextResponse.json({ error: `OpenAI API Error: ${errorMessage}` }, { status: 500, headers });
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