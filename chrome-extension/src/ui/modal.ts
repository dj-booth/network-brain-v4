/// <reference types="chrome"/>

console.log("Network Brain Modal Script Loaded");

// Define the expected structure of profile data (should match content.ts)
interface ProfileData {
    name: string | null;
    jobTitle: string | null;
    location: string | null;
    website: string | null;
    about: string | null;
    profilePictureUrl: string | null;
    latestEducation: string | null;
    latestExperience: string | null;
    latestExperienceUrl: string | null;
    linkedinProfileUrl: string | null;
}

const recordButton = document.getElementById('record-button') as HTMLButtonElement;
const stopButton = document.getElementById('stop-button') as HTMLButtonElement;
const submitButton = document.getElementById('submit-context') as HTMLButtonElement;
const cancelButton = document.getElementById('cancel-context') as HTMLButtonElement;
const contextNotesTextArea = document.getElementById('context-notes') as HTMLTextAreaElement;
const recordingStatusSpan = document.getElementById('recording-status') as HTMLSpanElement;

let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];
let recordedAudioBlob: Blob | null = null;
let receivedProfileData: ProfileData | null = null; // Variable to store received data

// --- Recording Logic ---

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      recordedAudioBlob = new Blob(audioChunks, { type: 'audio/webm' }); // Adjust type if needed
      audioChunks = []; // Reset chunks
      updateRecordingStatus('Processing...');
      recordButton.disabled = false;
      stopButton.disabled = true;
      transcribeAudio(recordedAudioBlob);
      // Stop microphone tracks
      stream.getTracks().forEach(track => track.stop());
    };

    mediaRecorder.start();
    updateRecordingStatus('Recording...');
    recordButton.disabled = true;
    stopButton.disabled = false;

  } catch (err) {
    console.error("Error accessing microphone:", err);
    updateRecordingStatus('Mic access denied');
    alert("Microphone access denied. Please allow microphone access in your browser settings.");
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
  }
}

function updateRecordingStatus(status: string) {
    recordingStatusSpan.textContent = status;
}

// --- Transcription Logic ---

async function transcribeAudio(audioBlob: Blob) {
  updateRecordingStatus('Uploading & Transcribing...');

  // --- Get JWT from Background Script ---
  let token: string | null = null;
  try {
    const response = await chrome.runtime.sendMessage({ action: "getJwt" });
    if (response?.error) {
      throw new Error(response.error);
    }
    token = response?.jwt;
    console.log("Retrieved JWT from background script.");
  } catch (error) {
    console.error("Error retrieving JWT:", error);
    updateRecordingStatus('Error: Could not get authentication token.');
    alert('Authentication error. Please ensure you are logged in via the extension popup.');
    return;
  }

  if (!token) {
      updateRecordingStatus('Error: Not authenticated.');
      alert('Authentication error. Please ensure you are logged in via the extension popup.');
      return;
  }

  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.webm');

  try {
    const backendApiUrl = '/api/transcribe'; // Adjust if needed

    console.log(`Sending audio to backend: ${backendApiUrl}`);

    const response = await fetch(backendApiUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
         throw new Error(`Transcription failed: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();

    if (data.text) {
      const existingText = contextNotesTextArea.value.trim();
      contextNotesTextArea.value = existingText + (existingText ? '\n\n' : '') + data.text;
      updateRecordingStatus('Transcription complete.');
    } else {
      updateRecordingStatus('Transcription failed (empty response).');
    }


  } catch (error) {
    console.error("Transcription error:", error);
      let errorMessage = 'An unknown error occurred during transcription.';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      updateRecordingStatus(`Error: ${errorMessage}`);
      alert(`Failed to transcribe audio: ${errorMessage}`);
    }
}


// --- Message Listener (from Content Script) ---
function handleContentScriptMessage(event: MessageEvent) {
    // IMPORTANT: Add origin check for security if needed, though communication
    // is between extension contexts (content script -> iframe)
    // Should be relatively safe, but consider if the iframe source could be spoofed.

    if (event.data?.type === 'NETWORK_BRAIN_PROFILE_DATA') {
        console.log("Modal received profile data:", event.data.data);
        receivedProfileData = event.data.data as ProfileData;
        // Optionally pre-fill parts of the notes if desired?
        // contextNotesTextArea.value = `Notes for ${receivedProfileData.name}:\n\n`;
    }
    // Add handlers for other message types if necessary
}

window.addEventListener('message', handleContentScriptMessage);


// --- Button Event Listeners ---

recordButton.addEventListener('click', startRecording);
stopButton.addEventListener('click', stopRecording);

cancelButton.addEventListener('click', () => {
  console.log("Cancel clicked - sending close request to parent.");
  window.parent.postMessage({ type: 'NETWORK_BRAIN_CLOSE_MODAL' }, '*');
});

submitButton.addEventListener('click', async () => {
  const contextText = contextNotesTextArea.value.trim();
  console.log("Submit Context clicked. Context:", contextText);

  if (!receivedProfileData) {
      console.error("Submission failed: Profile data not received from content script.");
      alert("Error: Could not submit context because initial profile data is missing. Please try reopening the modal.");
      return;
  }

  // --- Assemble the New Payload Structure --- 
   const finalPayload = {
      profileData: receivedProfileData, // The original data scraped from LinkedIn
      context: { // New structure for the context/comment
          text: contextText, // The text from the textarea
          source: 'chrome_extension_linkedin' // Define the source
          // Backend will add user and timestamp based on JWT/server time
      }
   };

   // Ensure essential profile fields are still present before sending
    if (!finalPayload.profileData.name || !finalPayload.profileData.linkedinProfileUrl) {
        console.error("Submission failed: Essential profile fields missing in final payload.", finalPayload);
        alert("Error: Cannot submit because essential profile information (Name or URL) is missing.");
        return;
    }

  // Send message to the background script to perform the final API call
  try {
     console.log("Sending final payload (profile + context) to background script for submission:", finalPayload);
     chrome.runtime.sendMessage({ action: "submitProfileContext", payload: finalPayload }, (response) => { // Renamed action slightly for clarity
        if (chrome.runtime.lastError) {
            console.error("Error sending submission to background:", chrome.runtime.lastError.message);
            alert(`Network Brain Error: Failed to send context for submission. ${chrome.runtime.lastError.message}`);
        } else if (response && response.success) {
             console.log("Background script confirmed submission success.");
             window.parent.postMessage({ type: 'NETWORK_BRAIN_CLOSE_MODAL' }, '*');
        } else {
             console.error("Background script reported submission error:", response?.error);
             alert(`Network Brain Error: Failed to submit context. ${response?.error || 'Unknown error.'}`);
        }
     });

  } catch (error) {
      console.error("Error sending submission message to background script:", error);
      let errorMessage = "Failed to initiate context submission.";
      if (error instanceof Error) errorMessage = error.message;
      alert(errorMessage);
  }
});

// Initial state
updateRecordingStatus(''); 