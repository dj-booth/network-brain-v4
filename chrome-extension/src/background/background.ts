console.log("Network Brain Background Script Loaded");

const BACKEND_BASE_URL = 'https://network-brain-v4-git-linkedin-ch-2ed061-david-boothvcs-projects.vercel.app';
const AUTH_API_URL = `${BACKEND_BASE_URL}/api/auth/google`;
const JWT_STORAGE_KEY = 'networkBrainJwt';
const INGEST_API_URL = `${BACKEND_BASE_URL}/api/profiles/ingest`;
const TRANSCRIBE_API_URL = `${BACKEND_BASE_URL}/api/transcribe`;

// Function to exchange Google token for our JWT via backend
async function fetchJwt(googleToken: string): Promise<string | null> {
    try {
        console.log(`Sending Google token to backend: ${AUTH_API_URL}`);
        
        // Get extension origin for CORS headers
        const extensionId = chrome.runtime.id;
        const extensionOrigin = extensionId ? `chrome-extension://${extensionId}` : '';
        
        const response = await fetch(AUTH_API_URL, {
            method: 'POST',
            mode: 'cors',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Origin': extensionOrigin
            },
            body: JSON.stringify({ token: googleToken }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error(`JWT Fetch Error (${response.status}):`, errorData.error || response.statusText);
            throw new Error(`Failed to fetch JWT: ${errorData.error || response.statusText}`);
        }

        const data = await response.json();
        console.log("JWT received from backend.");
        return data.jwt;

    } catch (error) {
        console.error("Error fetching JWT:", error);
        return null;
    }
}

// Function to store JWT
async function storeJwt(jwt: string): Promise<void> {
    await chrome.storage.local.set({ [JWT_STORAGE_KEY]: jwt });
    console.log("JWT stored securely.");
}

// Function to retrieve JWT
async function getStoredJwt(): Promise<string | null> {
    const result = await chrome.storage.local.get([JWT_STORAGE_KEY]);
    return result[JWT_STORAGE_KEY] || null;
}

// Function to clear JWT (for logout)
async function clearJwt(): Promise<void> {
    await chrome.storage.local.remove(JWT_STORAGE_KEY);
    console.log("JWT cleared.");
}

// --- Main Authentication Flow Function ---
// This can be called by other parts of the extension via messaging
async function authenticateAndGetJwt(interactive: boolean): Promise<string | null> {
    try {
        // 1. Get Google Token
        // We need to get the *ID token*, not the access token from getAuthToken.
        // getAuthToken provides an access token. We need getProfileUserInfo OR
        // potentially use the access token with Google API to get profile info including email.
        // A simpler approach for extensions is often to use launchWebAuthFlow for the full ID token.

        // --- Using launchWebAuthFlow for ID Token ---
        console.log("Initiating Google Sign-In via launchWebAuthFlow...");
        const redirectUri = chrome.identity.getRedirectURL(); // e.g., https://<extension-id>.chromiumapp.org/
        const clientId = "927186761014-qvlrncaockfamh3td9ip9h5q4756on2e.apps.googleusercontent.com"; // Google Cloud Console Web Application Client ID
        const scopes = ["openid", "email", "profile"];
        let authUrl = `https://accounts.google.com/o/oauth2/v2/auth`;
        authUrl += `?client_id=${clientId}`;
        authUrl += `&response_type=id_token`; // Request ID token directly
        authUrl += `&redirect_uri=${encodeURIComponent(redirectUri)}`;
        authUrl += `&scope=${encodeURIComponent(scopes.join(" "))}`;
        authUrl += `&nonce=${Math.random().toString(36).substring(2)}`; // Add nonce for security

        const resultUrl = await new Promise<string>((resolve, reject) => {
             chrome.identity.launchWebAuthFlow({ url: authUrl, interactive }, (responseUrl) => {
                if (chrome.runtime.lastError || !responseUrl) {
                    reject(new Error(chrome.runtime.lastError?.message || "Authentication flow failed or was cancelled."));
                } else {
                    resolve(responseUrl);
                }
            });
        });

        console.log("Authentication flow successful.");
        // Extract the ID token from the result URL fragment
        const urlFragment = new URL(resultUrl).hash.substring(1); // Remove leading '#'
        const params = new URLSearchParams(urlFragment);
        const googleIdToken = params.get("id_token");

        if (!googleIdToken) {
            console.error("Could not extract Google ID token from response URL.");
            throw new Error("Failed to get Google ID token.");
        }
        console.log("Google ID Token received.");

        // 2. Exchange Google Token for our JWT
        const jwt = await fetchJwt(googleIdToken);

        // 3. Store JWT if successful
        if (jwt) {
            await storeJwt(jwt);
            return jwt;
        } else {
            await clearJwt(); // Clear any old JWT if fetch failed
            return null;
        }

    } catch (error) {
        console.error("Authentication process failed:", error);
        await clearJwt(); // Ensure no partial/invalid state
        return null;
    }
}


// --- Message Listener ---
// To allow other parts of the extension (popup, content script via modal) to trigger auth or get token
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Background script received message:", request);

  // --- Authentication Actions ---
  if (request.action === "authenticate") {
    authenticateAndGetJwt(true)
      .then(jwt => sendResponse({ success: !!jwt, jwt: jwt }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Indicates asynchronous response
  }
  if (request.action === "getJwt") {
    getStoredJwt()
      .then(jwt => sendResponse({ jwt: jwt }))
      .catch(error => sendResponse({ jwt: null, error: error.message }));
    return true; // Indicates asynchronous response
  }
   if (request.action === "logout") {
    clearJwt()
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Indicates asynchronous response
  }

  // --- Data Submission Action --- (Updated action name)
  if (request.action === "submitProfileContext") { 
    const payload = request.payload; // Expecting { profileData: {...}, context: {...} }
    console.log("Processing submitProfileContext action with payload:", payload);

    if (!payload || !payload.profileData || !payload.context) {
        console.error("Submission Error: Invalid payload structure received.");
        sendResponse({ success: false, error: "Invalid data structure received by background script." });
        return false; // Not async in this error case
    }

    // Use an async IIFE to handle the async operations
    (async () => {
        try {
            const jwt = await getStoredJwt();
            if (!jwt) {
                console.error("Submission Error: User not authenticated (no JWT).");
                throw new Error("Authentication required. Please log in.");
            }

            // Get extension origin for CORS headers
            const extensionId = chrome.runtime.id;
            const extensionOrigin = extensionId ? `chrome-extension://${extensionId}` : '';

            console.log(`Sending data (profile + context) to ingest API: ${INGEST_API_URL}`);
            const response = await fetch(INGEST_API_URL, {
                method: 'POST',
                mode: 'cors',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${jwt}`,
                    'Origin': extensionOrigin
                },
                // Send the entire payload containing profileData and context
                body: JSON.stringify(payload), 
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error(`Ingest API Error (${response.status}):`, errorData.error || response.statusText);
                throw new Error(`Failed to submit context: ${errorData.error || response.statusText}`);
            }

            const result = await response.json();
            console.log("Ingest API Success:", result);
            // Assuming backend still returns profileId or similar confirmation
            sendResponse({ success: true, profileId: result.profileId }); 

        } catch (error) {
            console.error("Error during context submission:", error);
            let errorMessage = "An unexpected error occurred during submission.";
            if (error instanceof Error) errorMessage = error.message;
            sendResponse({ success: false, error: errorMessage });
        }
    })();

    return true; // Indicates asynchronous response is expected
  }

  // --- Fallback for unhandled messages ---
  console.log("Unhandled message action:", request.action);
  return false; 
});

// Handle transcribe audio messages from modal.ts
async function handleTranscribeAudio(audioBlob: Blob): Promise<{ success: boolean, text?: string, error?: string }> {
  try {
    const jwt = await getStoredJwt();
    if (!jwt) {
      console.error("Transcription Error: User not authenticated (no JWT).");
      return { success: false, error: "Authentication required. Please log in." };
    }

    // Get extension origin for CORS headers
    const extensionId = chrome.runtime.id;
    const extensionOrigin = extensionId ? `chrome-extension://${extensionId}` : '';

    // Create a FormData object and append the audio blob
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.webm');

    console.log(`Sending audio for transcription to: ${TRANSCRIBE_API_URL}`);
    const response = await fetch(TRANSCRIBE_API_URL, {
      method: 'POST',
      mode: 'cors',
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Origin': extensionOrigin
        // Don't set Content-Type here; it will be automatically set with the boundary
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Transcription API Error (${response.status}):`, errorData.error || response.statusText);
      return { 
        success: false, 
        error: `Failed to transcribe audio: ${errorData.error || response.statusText}` 
      };
    }

    const result = await response.json();
    console.log("Transcription API Success:", result);
    return { success: true, text: result.text };

  } catch (error) {
    console.error("Error during transcription:", error);
    let errorMessage = "An unexpected error occurred during transcription.";
    if (error instanceof Error) errorMessage = error.message;
    return { success: false, error: errorMessage };
  }
}

// Add message handler for transcribeAudio action
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "transcribeAudio") {
    const audioBlob = request.audioBlob;
    
    if (!audioBlob) {
      console.error("Transcription Error: Missing audio blob");
      sendResponse({ success: false, error: "Missing audio data" });
      return false;
    }
    
    handleTranscribeAudio(audioBlob)
      .then(result => sendResponse(result))
      .catch(error => {
        console.error("Transcription error:", error);
        sendResponse({ 
          success: false, 
          error: error instanceof Error ? error.message : "Unknown transcription error" 
        });
      });
      
    return true; // Indicates asynchronous response is expected
  }
  
  return false; // Not handled by this listener
});

// Example: Trigger non-interactive check on startup?
// authenticateAndGetJwt(false).then(jwt => {
//     if (jwt) console.log("Background: Already authenticated.");
//     else console.log("Background: Not authenticated.");
// }); 