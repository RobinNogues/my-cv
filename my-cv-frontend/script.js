// Function to initialize smooth scrolling for navigation links
function initializeSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') {
                // Scroll to top if href is just '#'
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            } else {
                // Scroll to the target element
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            }
            // Close mobile menu if it's open after a link is clicked
            closeMobileMenu();
        });
    });
}

// Mobile Menu Elements
const mobileMenuButton = document.getElementById('mobile-menu-button');
const mobileMenuCloseButton = document.getElementById('mobile-menu-close-button');
const mobileMenuDrawer = document.getElementById('mobile-menu-drawer');
const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');

// Function to open the mobile menu
function openMobileMenu() {
    mobileMenuDrawer.classList.add('open');
    mobileMenuOverlay.style.display = 'block';
}

// Function to close the mobile menu
function closeMobileMenu() {
    mobileMenuDrawer.classList.remove('open');
    mobileMenuOverlay.style.display = 'none';
}

// Function to initialize mobile menu functionality
function initializeMobileMenu() {
    mobileMenuButton.addEventListener('click', openMobileMenu);
    mobileMenuCloseButton.addEventListener('click', closeMobileMenu);
    mobileMenuOverlay.addEventListener('click', closeMobileMenu); // Close on overlay click
}

// Back to Top Button Element
const backToTopButton = document.getElementById('back-to-top');

// Function to initialize back-to-top button functionality
function initializeBackToTopButton() {
    // Show/hide button based on scroll position
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTopButton.classList.add('visible');
        } else {
            backToTopButton.classList.remove('visible');
        }
    });

    // Scroll to top when the button is clicked
    backToTopButton.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Navigation links and sections for active highlighting
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');

/**
 * Updates the active navigation link based on which section is currently in the viewport.
 * Adjusts sectionTop to account for the fixed header height for accurate highlighting.
 */
function updateActiveNavLink() {
    let currentActive = null;
    const headerOffset = document.querySelector('header').offsetHeight;

    sections.forEach(section => {
        const sectionTop = section.offsetTop - headerOffset - 20; // Adjusted for header and some padding
        const sectionBottom = sectionTop + section.offsetHeight;

        if (window.scrollY >= sectionTop && window.scrollY < sectionBottom) {
            currentActive = section.id;
        }
    });

    // Remove 'active' class from all links and then add it to the current active link
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').substring(1) === currentActive) {
            link.classList.add('active');
        }
    });
}

// Function to initialize active navigation link highlighting
function initializeNavLinkHighlighting() {
    window.addEventListener('scroll', updateActiveNavLink);
    window.addEventListener('load', updateActiveNavLink);
}

// Contact Form Elements
const contactForm = document.getElementById('contact-form');
const formStatusMessage = document.getElementById('form-status-message');

// Simple client-side rate limiting for form submission
let lastSubmissionTime = 0;
const COOLDOWN_PERIOD_MS = 5000; // 5 seconds cooldown

// Function to handle contact form submission
async function handleContactFormSubmission(e) {
    e.preventDefault();

    const currentTime = Date.now();
    // Check for rate limiting
    if (currentTime - lastSubmissionTime < COOLDOWN_PERIOD_MS) {
        displayFormStatus('Please wait a moment before sending another message.', 'text-red-600');
        return;
    }

    // Honeypot check for bots
    const honeypotField = document.getElementById('address');
    if (honeypotField && honeypotField.value) {
        console.warn('Honeypot field filled. Likely a bot submission.');
        // Deceive the bot with a success message
        displayFormStatus('Message sent successfully!', 'text-green-600');
        contactForm.reset();
        lastSubmissionTime = currentTime; // Update cooldown for bots too
        return;
    }

    displayFormStatus('Message being sent...', 'text-gray-600');

    const formData = new FormData(contactForm);
    const data = Object.fromEntries(formData.entries());

    // Remove the honeypot field from the data sent to the backend
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
            displayFormStatus(result.message || 'Message sent successfully!', 'text-green-600');
            contactForm.reset();
            lastSubmissionTime = currentTime; // Update last submission time on success
        } else {
            // Handle API errors (HTTP status 400-599)
            const errorData = await response.json();
            let errorMessage = errorData.detail || 'An error occurred, please try again later.';

            // Improved error message display for FastAPI validation errors (status 422)
            if (response.status === 422 && Array.isArray(errorData.detail)) {
                const fieldErrors = errorData.detail.map(err => {
                    const field = err.loc && err.loc.length > 1 ? err.loc[1] : 'unknown field';
                    return `${field}: ${err.msg}`;
                }).join('. ');
                errorMessage = `Validation error: ${fieldErrors}.`;
            }
            displayFormStatus(errorMessage, 'text-red-600');
            console.error('API Error:', errorData);
            // Do not update lastSubmissionTime on error to allow retries sooner
        }
    } catch (error) {
        // Handle network errors or other issues during fetch call
        console.error('Network or API issue:', error);
        displayFormStatus('An error occurred, please check your network and try again.', 'text-red-600');
    }
}

/**
 * Displays a status message for the contact form.
 * @param {string} message - The message to display.
 * @param {string} className - Tailwind CSS classes for styling the message (e.g., 'text-green-600', 'text-red-600').
 */
function displayFormStatus(message, className) {
    formStatusMessage.style.display = 'block';
    formStatusMessage.className = `mt-4 text-center text-sm font-medium ${className}`;
    formStatusMessage.textContent = message;
}

// Function to initialize contact form functionality
function initializeContactForm() {
    contactForm.addEventListener('submit', handleContactFormSubmission);
}

// Initialize all functionalities when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeSmoothScrolling();
    initializeMobileMenu();
    initializeBackToTopButton();
    initializeNavLinkHighlighting();
    initializeContactForm();
});
