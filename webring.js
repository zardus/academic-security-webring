let members = [];
let currentSite = null;
let currentIndex = -1;

// Get the site from referrer or URL parameter
function getCurrentSiteFromURL() {
    // First, try to detect from the parent page (referrer)
    if (document.referrer) {
        try {
            const referrerURL = new URL(document.referrer);
            // Return the origin + pathname (without query params or hash)
            // Normalization will handle protocol and trailing slashes
            return referrerURL.origin + referrerURL.pathname;
        } catch (e) {
            console.warn('Failed to parse referrer:', e);
        }
    }

    // Fall back to explicit site parameter
    const params = new URLSearchParams(window.location.search);
    return params.get('site');
}

// Normalize URLs for comparison (remove trailing slashes, protocol differences, etc.)
function normalizeURL(url) {
    if (!url) return '';
    try {
        const urlObj = new URL(url);
        // Remove protocol, trailing slash and convert to lowercase
        return urlObj.href.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
    } catch {
        return url.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
    }
}

// Load members and initialize
async function init() {
    try {
        const response = await fetch('members.json');
        const data = await response.json();
        members = data.members || data;

        currentSite = getCurrentSiteFromURL();

        if (!currentSite) {
            displayError('Could not detect site. Make sure the iframe is embedded on your page, or add ?site=YOUR_URL to the iframe src.');
            return;
        }

        // Find the current site in the members list
        const normalizedCurrent = normalizeURL(currentSite);
        currentIndex = members.findIndex(member =>
            normalizeURL(member.url) === normalizedCurrent
        );

        if (currentIndex === -1) {
            const editUrl = 'https://github.com/zardus/academic-security-webring/edit/main/members.json';
            displayError(`Site not found. <a href="${editUrl}" target="_blank">Add it here!</a>`);
            return;
        }

        displayWebring();
    } catch (error) {
        displayError('Failed to load webring data: ' + error.message);
    }
}

// Display error message
function displayError(message) {
    const container = document.getElementById('webring-container');
    container.innerHTML = `<div class="error">${message}</div>`;
}

// Display the webring navigation
function displayWebring() {
    const member = members[currentIndex];
    document.getElementById('site-name').textContent = member.name;

    // Set alt text for prev/next links
    const prevIndex = (currentIndex - 1 + members.length) % members.length;
    const nextIndex = (currentIndex + 1) % members.length;

    const prevLink = document.getElementById('prev-link');
    const nextLink = document.getElementById('next-link');

    if (prevLink) {
        const prevText = `Previous: ${members[prevIndex].name}`;
        prevLink.title = prevText;
        prevLink.setAttribute('aria-label', prevText);
    }

    if (nextLink) {
        const nextText = `Next: ${members[nextIndex].name}`;
        nextLink.title = nextText;
        nextLink.setAttribute('aria-label', nextText);
    }
}

// Navigation functions
function navigate(targetIndex) {
    if (targetIndex < 0 || targetIndex >= members.length) return;
    const targetURL = members[targetIndex].url;
    window.open(targetURL, '_blank');
}

function prev() {
    const targetIndex = (currentIndex - 1 + members.length) % members.length;
    navigate(targetIndex);
}

function next() {
    const targetIndex = (currentIndex + 1) % members.length;
    navigate(targetIndex);
}

function random() {
    let randomIndex;
    do {
        randomIndex = Math.floor(Math.random() * members.length);
    } while (randomIndex === currentIndex && members.length > 1);
    navigate(randomIndex);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
