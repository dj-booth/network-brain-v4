/// <reference types="chrome"/>

console.log("Popup script loaded.");

const loginButton = document.getElementById('loginButton') as HTMLButtonElement;
const logoutButton = document.getElementById('logoutButton') as HTMLButtonElement;
const statusDiv = document.getElementById('status') as HTMLDivElement;

// Check initial auth status when popup opens
async function checkStatus() {
    try {
        statusDiv.textContent = "Checking authentication status...";
        const response = await chrome.runtime.sendMessage({ action: "getJwt" });
        if (chrome.runtime.lastError) {
             throw new Error(chrome.runtime.lastError.message);
        }
        if (response?.jwt) {
            console.log("User is authenticated.");
            statusDiv.textContent = "Status: Logged In";
            loginButton.style.display = 'none';
            logoutButton.style.display = 'block';
        } else {
            console.log("User is not authenticated.");
            statusDiv.textContent = "Status: Logged Out";
            loginButton.style.display = 'block';
            logoutButton.style.display = 'none';
        }
    } catch (error) {
        console.error("Error checking auth status:", error);
        let errorMessage = "Failed to check status.";
        if (error instanceof Error) errorMessage = error.message;
        else if (typeof error === 'string') errorMessage = error;
        statusDiv.textContent = `Error: ${errorMessage}`;
        loginButton.style.display = 'block';
        logoutButton.style.display = 'none';
    }
}

// Add listeners
loginButton.addEventListener('click', async () => {
    statusDiv.textContent = "Initiating Google Login...";
    loginButton.disabled = true;
    try {
        const response = await chrome.runtime.sendMessage({ action: "authenticate" });
         if (chrome.runtime.lastError) {
             throw new Error(chrome.runtime.lastError.message);
        }
        if (response?.success) {
            console.log("Authentication successful.");
            statusDiv.textContent = "Login Successful!";
            await checkStatus(); // Re-check status to update UI
        } else {
             throw new Error(response?.error || "Authentication failed.");
        }
    } catch (error) {
        console.error("Login failed:", error);
        let errorMessage = "Login failed.";
        if (error instanceof Error) errorMessage = error.message;
        else if (typeof error === 'string') errorMessage = error;
        statusDiv.textContent = `Login Failed: ${errorMessage}`;
    } finally {
         loginButton.disabled = false;
    }
});

logoutButton.addEventListener('click', async () => {
    statusDiv.textContent = "Logging out...";
    logoutButton.disabled = true;
     try {
        const response = await chrome.runtime.sendMessage({ action: "logout" });
         if (chrome.runtime.lastError) {
             throw new Error(chrome.runtime.lastError.message);
        }
        if (response?.success) {
            console.log("Logout successful.");
            statusDiv.textContent = "Logout Successful!";
            await checkStatus(); // Re-check status to update UI
        } else {
             throw new Error(response?.error || "Logout failed.");
        }
    } catch (error) {
        console.error("Logout failed:", error);
        let errorMessage = "Logout failed.";
        if (error instanceof Error) errorMessage = error.message;
        else if (typeof error === 'string') errorMessage = error;
        statusDiv.textContent = `Logout Failed: ${errorMessage}`;
    } finally {
         logoutButton.disabled = false;
    }
});

// Initial check
checkStatus(); 