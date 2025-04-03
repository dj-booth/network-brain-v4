/// <reference types="chrome"/>

console.log("Network Brain Content Script Loaded");

interface ProfileData {
    name: string | null;
    jobTitle: string | null;
    location: string | null;
    website: string | null; // May not always be present
    about: string | null;
    profilePictureUrl: string | null;
    latestEducation: string | null;
    latestExperience: string | null;
    latestExperienceUrl: string | null; // May not always be present
    linkedinProfileUrl: string | null;
}

// --- DOM Selectors (Based on Research - Still Verify!) ---
const SELECTORS = {
    // --- Core Info Selectors --- 
    // Top card container (might need adjustment)
    topCardSection: 'section.pv-top-card', 
    // Name within the top card
    name: 'section.pv-top-card h1.top-card-layout__title', 
    // Headline/Job Title within the top card
    jobTitle: 'section.pv-top-card h2.top-card-layout__headline', 
    // Location: Often a span near the headline - **NEEDS VERIFICATION**
    location: 'section.pv-top-card span.text-body-small.inline.break-words', // Tentative guess
    // Profile Picture within the top card - **NEEDS VERIFICATION**
    profilePicture: 'section.pv-top-card img[alt*="profile picture"], section.pv-top-card img.pv-top-card-profile-picture__image', // Try alt text or class

    // --- Other Sections --- 
    // About Section: Find section, then get text - **NEEDS VERIFICATION**
    aboutSection: 'section.about-section div.inline-show-more-text, section[data-section="about"] div.inline-show-more-text', // Try class or data attribute
    // Experience Section Items - **NEEDS VERIFICATION**
    experienceSectionItem: 'section.experience li.experience-item, section[data-section="experience"] ul > li',
    // Education Section Items - **NEEDS VERIFICATION**
    educationSectionItem: 'section.education li.education-item, section[data-section="education"] ul > li', 

    // --- Button Injection Target --- 
    // **CRITICAL - NEEDS USER VERIFICATION** Where Connect/Message buttons are.
    buttonInjectionTarget: '.pv-top-card-v2-ctas', // Keeping old placeholder - MUST BE UPDATED 

    // --- Contact Info (Less Critical for now) ---
    contactInfoLink: '#top-card-text-details-contact-info',
    contactInfoModal: '.artdeco-modal--layer-default',
    websiteLinkInModal: '.ci-websites .pv-contact-info__contact-link',
};

// --- Data Extraction Functions ---

function getTextContent(selector: string, parent: ParentNode = document): string | null {
    const element = parent.querySelector(selector);
    // Handle cases where text might be split across spans (e.g., in about section)
    if (element) {
        const clone = element.cloneNode(true) as HTMLElement;
        // Remove visually hidden elements that might interfere
        clone.querySelectorAll('.visually-hidden, .read-more, .see-more').forEach(el => el.remove());
        return clone.textContent?.trim() || null;
    }
    return null;
}

function getAttribute(selector: string, attribute: string, parent: ParentNode = document): string | null {
    const element = parent.querySelector(selector) as Element | null;
    return element?.getAttribute(attribute)?.trim() || null;
}

function extractProfileData(): ProfileData {
    const profileUrl = window.location.href;
    const profileData: ProfileData = {
        name: getTextContent(SELECTORS.name),
        jobTitle: getTextContent(SELECTORS.jobTitle),
        location: getTextContent(SELECTORS.location),
        website: null, 
        about: getTextContent(SELECTORS.aboutSection),
        profilePictureUrl: getAttribute(SELECTORS.profilePicture, 'src'),
        latestEducation: null,
        latestExperience: null,
        latestExperienceUrl: null,
        linkedinProfileUrl: profileUrl.includes('?') ? profileUrl.substring(0, profileUrl.indexOf('?')) : profileUrl, 
    };

    // Extract latest experience (more complex)
    const latestExpLi = document.querySelector(SELECTORS.experienceSectionItem); // Use updated item selector
    if (latestExpLi) {
        // **Selectors within the item need verification**
        profileData.latestExperience = getTextContent('span[aria-hidden="true"]', latestExpLi) || getTextContent('.mr1 .hoverable-link-text', latestExpLi); 
        profileData.latestExperienceUrl = getAttribute('a[data-field="experience_company_logo"]', 'href', latestExpLi);
    }

     // Extract latest education
    const latestEduLi = document.querySelector(SELECTORS.educationSectionItem); // Use updated item selector
    if (latestEduLi) {
         // **Selectors within the item need verification**
         profileData.latestEducation = getTextContent('span[aria-hidden="true"]', latestEduLi) || getTextContent('.mr1 .hoverable-link-text', latestEduLi);
    }

    console.log("Extracted Profile Data (using updated selectors):", profileData);
    // Basic Validation
    if (!profileData.name || !profileData.linkedinProfileUrl) {
        console.error("Extraction Error: Missing required fields (Name or Profile URL). Selectors may need update.");
        alert("Network Brain Error: Could not extract essential profile information (Name or URL). The LinkedIn page structure might have changed. Please check selectors.");
    }

    return profileData;
}

// --- Modal Handling ---
let modalIframe: HTMLIFrameElement | null = null;

function openModal(profileData: ProfileData) {
    if (modalIframe) {
        modalIframe.remove(); // Remove existing modal if any
    }

    modalIframe = document.createElement('iframe');
    modalIframe.id = 'network-brain-modal-iframe';
    modalIframe.style.position = 'fixed';
    modalIframe.style.top = '0';
    modalIframe.style.left = '0';
    modalIframe.style.width = '100%';
    modalIframe.style.height = '100%';
    modalIframe.style.border = 'none';
    modalIframe.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'; // Dim background
    modalIframe.style.zIndex = '99999'; // Ensure high z-index

    // Use chrome.runtime.getURL to get the correct path to the HTML file
    modalIframe.src = chrome.runtime.getURL('src/ui/modal.html');

    document.body.appendChild(modalIframe);

    // Send extracted data to the modal *after* it loads
    modalIframe.onload = () => {
        if (modalIframe?.contentWindow) {
            console.log("Sending profile data to modal iframe");
            modalIframe.contentWindow.postMessage({ type: "NETWORK_BRAIN_PROFILE_DATA", data: profileData }, '*');
        }
    };

    // Listen for messages from the modal (close, submit)
    window.addEventListener('message', handleModalMessage);
}

function closeModal() {
    if (modalIframe) {
        modalIframe.remove();
        modalIframe = null;
    }
    window.removeEventListener('message', handleModalMessage);
}

function handleModalMessage(event: MessageEvent) {
    // IMPORTANT: Add origin check for security in production
    // if (event.origin !== chrome.runtime.getURL('').slice(0, -1)) { // Check origin
    //     console.warn("Ignoring message from unexpected origin:", event.origin);
    //     return;
    // }

    if (event.data?.type === 'NETWORK_BRAIN_CLOSE_MODAL') {
        console.log("Received close request from modal.");
        closeModal();
    }

    if (event.data?.type === 'NETWORK_BRAIN_SUBMIT') {
        console.log("Received submit request from modal:", event.data.payload);
        // Send the final payload to the background script for API submission
        chrome.runtime.sendMessage({ action: "submitProfile", payload: event.data.payload }, (response) => {
             if (chrome.runtime.lastError) {
                console.error("Error sending submission to background:", chrome.runtime.lastError.message);
                alert(`Network Brain Error: Failed to send data for submission. ${chrome.runtime.lastError.message}`);
            } else if (response && response.success) {
                console.log("Background script confirmed submission (or start).");
                alert("Profile data sent to Network Brain!"); // Simple confirmation
                closeModal();
            } else {
                 console.error("Background script reported submission error:", response?.error);
                 alert(`Network Brain Error: Failed to submit data. ${response?.error || 'Unknown error.'}`);
                 // Keep modal open?
            }
        });
    }
}


// --- Button Injection ---

function injectButton(targetElement: HTMLElement): void {
    const existingButton = document.getElementById('network-brain-add-button');
    if (existingButton) {
        console.log('Network Brain button already injected.');
        return; // Avoid duplicate buttons
    }

    const button = document.createElement('button');
    button.id = 'network-brain-add-button';
    button.textContent = 'Add to Network Brain';
    // Simple styling - consider using a CSS class defined elsewhere
    button.style.marginLeft = '8px';
    button.style.padding = '6px 12px';
    button.style.border = '1px solid #0a66c2';
    button.style.backgroundColor = '#ffffff';
    button.style.color = '#0a66c2';
    button.style.borderRadius = '18px'; // Match LinkedIn style
    button.style.cursor = 'pointer';
    button.style.fontWeight = '600';
    button.style.lineHeight = '20px';
    button.style.verticalAlign = 'middle'; // Align with other buttons

    button.onclick = (e) => {
        e.stopPropagation(); // Prevent potential side effects
        console.log('"Add to Network Brain" clicked!');
        try {
            const profileData = extractProfileData();
            // Only open modal if essential data was extracted
             if (profileData.name && profileData.linkedinProfileUrl) {
                openModal(profileData);
             } else {
                 console.error("Cannot open modal due to missing essential data.");
                 // Alert was shown in extractProfileData
             }
        } catch (error) {
             console.error("Error during data extraction or modal opening:", error);
             alert("Network Brain Error: An unexpected error occurred while trying to add the profile.");
        }
    };

    // Insert the button - adjust insertion logic based on target element's children
    targetElement.appendChild(button); // Append as the last child in the actions container
    console.log('Network Brain button injected.');
}

// --- Main Execution & Observation ---

function findTargetElement(): HTMLElement | null {
    // Use the specific button injection target selector
    const actionContainer = document.querySelector(SELECTORS.buttonInjectionTarget);
    return actionContainer as HTMLElement | null;
}

// Use MutationObserver 
const observer = new MutationObserver((mutationsList) => {
    if (document.getElementById('network-brain-add-button')) return;

    for (const mutation of mutationsList) {
        if (mutation.type === 'childList' || mutation.type === 'attributes') {
             const targetElement = findTargetElement();
             if (targetElement) {
                 injectButton(targetElement);
                 // observer.disconnect(); // Optional: Disconnect after injection
                 return; 
             }
        }
    }
});

// Observe a container likely to hold the button target
const profileTopCard = document.querySelector(SELECTORS.topCardSection); // Observe the top card
if (profileTopCard) {
    observer.observe(profileTopCard, { childList: true, subtree: true, attributes: false }); // Observe changes within top card
     console.log("MutationObserver started on profile top card section.");
} else {
    // Fallback to observing body if top card not found immediately
    observer.observe(document.body, { childList: true, subtree: true });
    console.warn("Profile top card section not found immediately, observing document body.");
}

// Initial check 
const initialTarget = findTargetElement();
if (initialTarget) {
    injectButton(initialTarget);
} else {
    console.log("Initial button injection target not found, waiting for MutationObserver.");
}

// Also ensure modal is closed on page navigation/unload
window.addEventListener('beforeunload', () => {
    closeModal();
}); 