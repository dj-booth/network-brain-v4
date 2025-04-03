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
console.log("Popup script loaded.");
const loginButton = document.getElementById('loginButton');
const logoutButton = document.getElementById('logoutButton');
const statusDiv = document.getElementById('status');
// Check initial auth status when popup opens
function checkStatus() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            statusDiv.textContent = "Checking authentication status...";
            const response = yield chrome.runtime.sendMessage({ action: "getJwt" });
            if (chrome.runtime.lastError) {
                throw new Error(chrome.runtime.lastError.message);
            }
            if (response === null || response === void 0 ? void 0 : response.jwt) {
                console.log("User is authenticated.");
                statusDiv.textContent = "Status: Logged In";
                loginButton.style.display = 'none';
                logoutButton.style.display = 'block';
            }
            else {
                console.log("User is not authenticated.");
                statusDiv.textContent = "Status: Logged Out";
                loginButton.style.display = 'block';
                logoutButton.style.display = 'none';
            }
        }
        catch (error) {
            console.error("Error checking auth status:", error);
            let errorMessage = "Failed to check status.";
            if (error instanceof Error)
                errorMessage = error.message;
            else if (typeof error === 'string')
                errorMessage = error;
            statusDiv.textContent = `Error: ${errorMessage}`;
            loginButton.style.display = 'block';
            logoutButton.style.display = 'none';
        }
    });
}
// Add listeners
loginButton.addEventListener('click', () => __awaiter(void 0, void 0, void 0, function* () {
    statusDiv.textContent = "Initiating Google Login...";
    loginButton.disabled = true;
    try {
        const response = yield chrome.runtime.sendMessage({ action: "authenticate" });
        if (chrome.runtime.lastError) {
            throw new Error(chrome.runtime.lastError.message);
        }
        if (response === null || response === void 0 ? void 0 : response.success) {
            console.log("Authentication successful.");
            statusDiv.textContent = "Login Successful!";
            yield checkStatus(); // Re-check status to update UI
        }
        else {
            throw new Error((response === null || response === void 0 ? void 0 : response.error) || "Authentication failed.");
        }
    }
    catch (error) {
        console.error("Login failed:", error);
        let errorMessage = "Login failed.";
        if (error instanceof Error)
            errorMessage = error.message;
        else if (typeof error === 'string')
            errorMessage = error;
        statusDiv.textContent = `Login Failed: ${errorMessage}`;
    }
    finally {
        loginButton.disabled = false;
    }
}));
logoutButton.addEventListener('click', () => __awaiter(void 0, void 0, void 0, function* () {
    statusDiv.textContent = "Logging out...";
    logoutButton.disabled = true;
    try {
        const response = yield chrome.runtime.sendMessage({ action: "logout" });
        if (chrome.runtime.lastError) {
            throw new Error(chrome.runtime.lastError.message);
        }
        if (response === null || response === void 0 ? void 0 : response.success) {
            console.log("Logout successful.");
            statusDiv.textContent = "Logout Successful!";
            yield checkStatus(); // Re-check status to update UI
        }
        else {
            throw new Error((response === null || response === void 0 ? void 0 : response.error) || "Logout failed.");
        }
    }
    catch (error) {
        console.error("Logout failed:", error);
        let errorMessage = "Logout failed.";
        if (error instanceof Error)
            errorMessage = error.message;
        else if (typeof error === 'string')
            errorMessage = error;
        statusDiv.textContent = `Logout Failed: ${errorMessage}`;
    }
    finally {
        logoutButton.disabled = false;
    }
}));
// Initial check
checkStatus();
//# sourceMappingURL=popup.js.map