import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import jwt from 'jsonwebtoken'; // Import jsonwebtoken

// --- IMPORTANT ---
// Ensure you have OPENAI_API_KEY and JWT_SECRET set in your environment variables
// You will also need to install the openai package: npm install openai
// and a JWT library like jsonwebtoken: npm install jsonwebtoken @types/jsonwebtoken

// Initialize OpenAI client only when API is actually called, not during build
let openai: OpenAI | null = null;

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

export async function POST(request: Request) {
  console.log("Received POST request on /api/transcribe");
  const origin = request.headers.get('origin');

  // Initialize OpenAI client only when needed
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

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
    console.log("JWT Decoded for transcribe:", decoded);

    // Optional: Perform necessary checks on decoded payload (e.g., check email against ADMIN_EMAIL if needed here too)
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

  // 2. Parse FormData and Extract Audio File
  let audioFile: File | null = null;
  try {
    const formData = await request.formData();
    const fileEntry = formData.get('file'); // Matches the key used in modal.ts

    if (!fileEntry || !(fileEntry instanceof File)) {
      console.error("Bad Request: 'file' field missing or not a File in FormData.");
      const response = NextResponse.json({ error: "Bad Request: Missing audio file" }, { status: 400 });
      return addCorsHeaders(response, origin);
    }
    audioFile = fileEntry;
    console.log(`Received audio file: ${audioFile.name}, size: ${audioFile.size}, type: ${audioFile.type}`);

  } catch (error) {
    console.error("Error parsing FormData:", error);
    const response = NextResponse.json({ error: 'Bad Request: Invalid FormData' }, { status: 400 });
    return addCorsHeaders(response, origin);
  }

  // 3. Transcribe using OpenAI Whisper API
  if (!openai) {
     console.error("Server Configuration Error: OPENAI_API_KEY is not set.");
     const response = NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
     return addCorsHeaders(response, origin);
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
    const response = NextResponse.json({ text: transcription.text }, { status: 200 });
    return addCorsHeaders(response, origin);

  } catch (error: any) {
    console.error("Error calling OpenAI Whisper API:", error);
    const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
    const response = NextResponse.json({ error: `OpenAI API Error: ${errorMessage}` }, { status: 500 });
    return addCorsHeaders(response, origin);
  }
}

// Handle preflight OPTIONS request
export async function OPTIONS(request: Request) {
  console.log("Received OPTIONS request on /api/transcribe");
  const origin = request.headers.get('origin');
  const response = new NextResponse(null, { status: 204 });
  return addCorsHeaders(response, origin);
} 