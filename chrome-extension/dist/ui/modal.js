"use strict";
/// <reference types="chrome"/>
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
console.log("Network Brain Modal Script Loaded");
const recordButton = document.getElementById('record-button');
const stopButton = document.getElementById('stop-button');
const submitButton = document.getElementById('submit-context');
const cancelButton = document.getElementById('cancel-context');
const contextNotesTextArea = document.getElementById('context-notes');
const recordingStatusSpan = document.getElementById('recording-status');
let mediaRecorder = null;
let audioChunks = [];
let recordedAudioBlob = null;
let receivedProfileData = null; // Variable to store received data
// --- Recording Logic ---
function startRecording() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const stream = yield navigator.mediaDevices.getUserMedia({ audio: true });
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
        }
        catch (err) {
            console.error("Error accessing microphone:", err);
            updateRecordingStatus('Mic access denied');
            alert("Microphone access denied. Please allow microphone access in your browser settings.");
        }
    });
}
function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
    }
}
function updateRecordingStatus(status) {
    recordingStatusSpan.textContent = status;
}
// --- Transcription Logic ---
function transcribeAudio(audioBlob) {
    return __awaiter(this, void 0, void 0, function* () {
        updateRecordingStatus('Uploading & Transcribing...');
        // --- Get JWT from Background Script ---
        let token = null;
        try {
            const response = yield chrome.runtime.sendMessage({ action: "getJwt" });
            if (response === null || response === void 0 ? void 0 : response.error) {
                throw new Error(response.error);
            }
            token = response === null || response === void 0 ? void 0 : response.jwt;
            console.log("Retrieved JWT from background script.");
        }
        catch (error) {
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
            const response = yield fetch(backendApiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            if (!response.ok) {
                const errorData = yield response.json();
                throw new Error(`Transcription failed: ${errorData.error || response.statusText}`);
            }
            const data = yield response.json();
            if (data.text) {
                const existingText = contextNotesTextArea.value.trim();
                contextNotesTextArea.value = existingText + (existingText ? '\n\n' : '') + data.text;
                updateRecordingStatus('Transcription complete.');
            }
            else {
                updateRecordingStatus('Transcription failed (empty response).');
            }
        }
        catch (error) {
            console.error("Transcription error:", error);
            let errorMessage = 'An unknown error occurred during transcription.';
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            else if (typeof error === 'string') {
                errorMessage = error;
            }
            updateRecordingStatus(`Error: ${errorMessage}`);
            alert(`Failed to transcribe audio: ${errorMessage}`);
        }
    });
}
// --- Message Listener (from Content Script) ---
function handleContentScriptMessage(event) {
    // IMPORTANT: Add origin check for security if needed, though communication
    // is between extension contexts (content script -> iframe)
    // Should be relatively safe, but consider if the iframe source could be spoofed.
    var _a;
    if (((_a = event.data) === null || _a === void 0 ? void 0 : _a.type) === 'NETWORK_BRAIN_PROFILE_DATA') {
        console.log("Modal received profile data:", event.data.data);
        receivedProfileData = event.data.data;
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
submitButton.addEventListener('click', () => __awaiter(void 0, void 0, void 0, function* () {
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
        context: {
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
        chrome.runtime.sendMessage({ action: "submitProfileContext", payload: finalPayload }, (response) => {
            if (chrome.runtime.lastError) {
                console.error("Error sending submission to background:", chrome.runtime.lastError.message);
                alert(`Network Brain Error: Failed to send context for submission. ${chrome.runtime.lastError.message}`);
            }
            else if (response && response.success) {
                console.log("Background script confirmed submission success.");
                window.parent.postMessage({ type: 'NETWORK_BRAIN_CLOSE_MODAL' }, '*');
            }
            else {
                console.error("Background script reported submission error:", response === null || response === void 0 ? void 0 : response.error);
                alert(`Network Brain Error: Failed to submit context. ${(response === null || response === void 0 ? void 0 : response.error) || 'Unknown error.'}`);
            }
        });
    }
    catch (error) {
        console.error("Error sending submission message to background script:", error);
        let errorMessage = "Failed to initiate context submission.";
        if (error instanceof Error)
            errorMessage = error.message;
        alert(errorMessage);
    }
}));
// Initial state
updateRecordingStatus('');
//# sourceMappingURL=modal.js.map