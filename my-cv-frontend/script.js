// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth'
            });
        }
        // Closes mobile menu if it's open after a link is clicked
        if (mobileMenuDrawer.classList.contains('open')) {
            mobileMenuDrawer.classList.remove('open');
            mobileMenuOverlay.style.display = 'none';
        }
    });
});

// Mobile Menu Functionality
const mobileMenuButton = document.getElementById('mobile-menu-button');
const mobileMenuCloseButton = document.getElementById('mobile-menu-close-button');
const mobileMenuDrawer = document.getElementById('mobile-menu-drawer');
const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');

// Event listener to open the mobile menu
mobileMenuButton.addEventListener('click', () => { // Add 'open' class to slide in the drawer
    mobileMenuDrawer.classList.add('open');
    mobileMenuOverlay.style.display = 'block';
});

// Event listener to close the mobile menu from the close button
mobileMenuCloseButton.addEventListener('click', () => { // Remove 'open' class to slide out the drawer
    mobileMenuDrawer.classList.remove('open');
    mobileMenuOverlay.style.display = 'none';
});

// Event listener to close the mobile menu when clicking outside (on the overlay)
mobileMenuOverlay.addEventListener('click', () => { // Back to Top Button Functionality
    mobileMenuDrawer.classList.remove('open');
    mobileMenuOverlay.style.display = 'none';
});

// Back to Top Button Functionality
const backToTopButton = document.getElementById('back-to-top');

// Show/hide back-to-top button based on scroll position // Scroll to top when the button is clicked
window.addEventListener('scroll', () => { // Smooth scroll to the top
    if (window.scrollY > 300) { // Active navigation link highlighting based on scroll position
        backToTopButton.classList.add('visible');
    } else {
        backToTopButton.classList.remove('visible');
    }
});

// Scroll to top when the button is clicked // Get all sections with an ID
backToTopButton.addEventListener('click', () => { // Get all navigation links
    window.scrollTo({
        top: 0, // Updates the active navigation link based on which section is currently in the viewport.
        behavior: 'smooth'
    });
});

// Active navigation link highlighting based on scroll position
const sections = document.querySelectorAll('section[id]'); // Get all sections with an ID
const navLinks = document.querySelectorAll('.nav-link'); // Get all navigation links

/**
 * Updates the active navigation link based on which section is currently in the viewport.
 */ // Iterate through each section to determine which one is currently visible
const updateActiveLink = () => { // Adjust sectionTop to account for the fixed header height for accurate highlighting
    let currentActive = null;
    sections.forEach(section => {
        const headerOffset = document.querySelector('header').offsetHeight;
        const sectionTop = section.offsetTop - headerOffset - 20;
        const sectionBottom = sectionTop + section.offsetHeight;

        // Check if the current scroll position is within the bounds of the section
        if (window.scrollY >= sectionTop && window.scrollY < sectionBottom) {
            currentActive = section.id;
        }
    });

    // Remove 'active' class from all links and then add it to the current active link // Add event listeners for scroll and load to update the active link
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').substring(1) === currentActive) {
            link.classList.add('active');
        }
    });
}; // Set active link on initial load

// Add event listeners for scroll and load to update the active link
window.addEventListener('scroll', updateActiveLink);
window.addEventListener('load', updateActiveLink); // Set active link on initial load

// Contact Form Submission
const contactForm = document.getElementById('contact-form');
const formStatusMessage = document.getElementById('form-status-message');

// Simple client-side rate limiting
let lastSubmissionTime = 0;
const COOLDOWN_PERIOD_MS = 5000;

contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const currentTime = Date.now();
    if (currentTime - lastSubmissionTime < COOLDOWN_PERIOD_MS) {
        formStatusMessage.style.display = 'block';
        formStatusMessage.className = 'mt-4 text-center text-sm font-medium text-red-600';
        formStatusMessage.textContent = 'Please wait a moment before sending another message.';
        return;
    }

    const honeypotField = document.getElementById('address');
    if (honeypotField && honeypotField.value) {
        console.warn('Honeypot field filled. Likely a bot submission.');
        formStatusMessage.style.display = 'block';
        formStatusMessage.className = 'mt-4 text-center text-sm font-medium text-green-600'; // Show success to bots
        formStatusMessage.textContent = 'Message sent successfully!'; // Deceive the bot
        contactForm.reset(); // Update last submission time even for bots to enforce cooldown
        lastSubmissionTime = currentTime;
        return;
    }

    formStatusMessage.style.display = 'block';
    formStatusMessage.className = 'mt-4 text-center text-sm font-medium text-gray-600';
    formStatusMessage.textContent = 'Message being sent...';

    const formData = new FormData(contactForm);
    const data = Object.fromEntries(formData.entries());
    
    // Remove the honeypot field from the data sent to the backend // HTTP status 200-299
    delete data.address;

    try {
        const response = await fetch('/api/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (response.ok) {
            const result = await response.json();
            formStatusMessage.className = 'mt-4 text-center text-sm font-medium text-green-600';
            formStatusMessage.textContent = result.message || 'Message sent successfully!';
            contactForm.reset(); // Update last submission time on success
            lastSubmissionTime = currentTime;
        } else {
            // Response is not OK, API error
            const errorData = await response.json();
            formStatusMessage.className = 'mt-4 text-center text-sm font-medium text-red-600';
            
            // Improved error message display for FastAPI validation errors
            if (response.status === 422 && errorData.detail && Array.isArray(errorData.detail)) {
                const errorMessages = errorData.detail.map(err => {
                    const field = err.loc && err.loc.length > 1 ? err.loc[1] : 'unknown field'; return `${field}: ${err.msg}`; }).join('');
                formStatusMessage.textContent = `Validation error : ${errorMessages}.`;
            } else {
                formStatusMessage.textContent = errorData.detail || 'An error occurred, please try again later.';
            }
            console.error('API Error:', errorData);
            // Do not update lastSubmissionTime on error to allow retries sooner
        }
    } catch (error) { // Network error or other issue during fetch call
        console.error('Network or API issue:', error);
        formStatusMessage.className = 'mt-4 text-center text-sm font-medium text-red-600';
        formStatusMessage.textContent = 'An error occurred, please try again later.';
    }
});