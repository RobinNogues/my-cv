class MobileMenu {
    constructor(breakpoint = 768) {
        this.menuButton = document.getElementById('mobile-menu-button');
        this.closeButton = document.getElementById('mobile-menu-close-button');
        this.drawer = document.getElementById('mobile-menu-drawer');
        this.overlay = document.getElementById('mobile-menu-overlay');
        this.breakpoint = breakpoint;
 
        if (this.menuButton && this.closeButton && this.drawer && this.overlay) {
            this.addEventListeners();
        }
    }

    addEventListeners() {
        this.menuButton.addEventListener('click', () => this.open());
        this.closeButton.addEventListener('click', () => this.close());
        this.overlay.addEventListener('click', () => this.close());
        window.addEventListener('resize', () => this.handleResize());
    }

    handleResize() {
        if (window.innerWidth >= this.breakpoint && this.isOpen()) {
            this.close();
        }
    }

    open() {
        this.drawer.classList.add('open');
        this.closeButton.classList.add('visible');
        this.overlay.classList.add('visible');
    }

    close() {
        this.drawer.classList.remove('open');
        this.closeButton.classList.remove('visible');
        this.overlay.classList.remove('visible');
    }

    isOpen() {
        return this.drawer.classList.contains('open');
    }
}

class BackToTopButton {
    constructor(buttonId, visibilityThreshold = 300) {
        this.button = document.getElementById(buttonId);
        this.visibilityThreshold = visibilityThreshold;

        if (this.button) {
            this.addEventListeners();
        }
    }

    addEventListeners() {
        window.addEventListener('scroll', () => this.toggleVisibility());
        this.button.addEventListener('click', () => this.scrollToTop());
    }

    toggleVisibility() {
        if (window.scrollY > this.visibilityThreshold) {
            this.button.classList.add('visible');
        } else {
            this.button.classList.remove('visible');
        }
    }

    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
}

class NavLinkHighlighter {
    constructor(navLinkSelector, sectionSelector) {
        this.navLinks = document.querySelectorAll(navLinkSelector);
        this.sections = document.querySelectorAll(sectionSelector);
        this.header = document.querySelector('header');

        if (this.navLinks.length > 0 && this.sections.length > 0 && this.header) {
            this.addEventListeners();
            this.update(); // Initial update on load
        }
    }

    addEventListeners() {
        window.addEventListener('scroll', () => this.update());
        window.addEventListener('resize', () => this.update()); // Also update on resize
    }

    update() {
        let currentActiveId = null;
        const headerOffset = this.header.offsetHeight + 20; // 20px buffer

        this.sections.forEach(section => {
            const sectionTop = section.offsetTop - headerOffset;
            const sectionBottom = sectionTop + section.offsetHeight;

            if (window.scrollY >= sectionTop && window.scrollY < sectionBottom) {
                currentActiveId = section.id;
            }
        });

        this.navLinks.forEach(link => {
            link.classList.remove('active');
            // Check if the link's href corresponds to the current active section
            if (link.getAttribute('href') === `#${currentActiveId}`) {
                link.classList.add('active');
            }
        });
    }
}

class ContactFormHandler {
    constructor(formId, statusId, cooldown = 5000) {
        this.form = document.getElementById(formId);
        this.statusMessage = document.getElementById(statusId);
        this.cooldownPeriod = cooldown;
        this.lastSubmissionTime = 0;

        if (this.form && this.statusMessage) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
    }

    displayStatus(message, className) {
        this.statusMessage.style.display = 'block';
        this.statusMessage.className = `mt-4 text-center text-sm font-medium ${className}`;
        this.statusMessage.textContent = message;
    }

    handleHoneypot() {
        const honeypotField = this.form.querySelector('#address');
        if (honeypotField && honeypotField.value) {
            console.warn('Honeypot field filled. Likely a bot submission.');
            this.displayStatus('Message sent successfully!', 'text-green-600');
            this.form.reset();
            return true;
        }
        return false;
    }

    async handleSubmit(e) {
        e.preventDefault();
        const currentTime = Date.now();

        if (currentTime - this.lastSubmissionTime < this.cooldownPeriod) {
            this.displayStatus('Please wait a moment before sending another message.', 'text-red-600');
            return;
        }

        if (this.handleHoneypot()) {
            this.lastSubmissionTime = currentTime;
            return;
        }

        this.displayStatus('Message being sent...', 'text-gray-600');

        const formData = new FormData(this.form);
        const data = Object.fromEntries(formData.entries());
        delete data.address; // Remove honeypot field

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                const result = await response.json();
                this.displayStatus(result.message || 'Message sent successfully!', 'text-green-600');
                this.form.reset();
                this.lastSubmissionTime = currentTime;
            } else {
                this.handleApiError(response);
            }
        } catch (error) {
            console.error('Network or API issue:', error);
            this.displayStatus('An error occurred, please check your network and try again.', 'text-red-600');
        }
    }

    async handleApiError(response) {
        const errorData = await response.json();
        let errorMessage = errorData.detail || 'An error occurred, please try again later.';

        if (response.status === 422 && Array.isArray(errorData.detail)) {
            const fieldErrors = errorData.detail.map(err => {
                const field = err.loc && err.loc.length > 1 ? err.loc[1] : 'field';
                return `${field}: ${err.msg}`;
            }).join('. ');
            errorMessage = `Validation error: ${fieldErrors}.`;
        }

        this.displayStatus(errorMessage, 'text-red-600');
        console.error('API Error:', errorData);
    }
}

class App {
    constructor() {
        this.mobileMenu = new MobileMenu(); // Tailwind's md breakpoint is 768px
        new BackToTopButton('back-to-top');
        new NavLinkHighlighter('.nav-link', 'section[id]');
        new ContactFormHandler('contact-form', 'form-status-message');
        this.initializeSmoothScrolling();
        this.initializeCourseToggle();
    }

    initializeSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = anchor.getAttribute('href');
                if (targetId === '#') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                    const targetElement = document.querySelector(targetId);
                    if (targetElement) {
                        targetElement.scrollIntoView({ behavior: 'smooth' });
                    }
                }
                if (this.mobileMenu.isOpen()) {
                    this.mobileMenu.close();
                }
            });
        });
    }

    initializeCourseToggle() {
        document.querySelectorAll('[data-toggle="scala-courses"]').forEach(toggleLink => {
            toggleLink.addEventListener('click', function() {
                const targetId = this.dataset.toggle;
                const toggleArrow = this.querySelector('.toggle-arrow');
                const targetElement = document.getElementById(targetId);

                if (targetElement) {
                    const isOpening = !targetElement.classList.contains('open');
                    targetElement.classList.toggle('open');
                    this.setAttribute('aria-expanded', isOpening);

                    this.firstChild.textContent = isOpening ? 'Hide courses ' : 'Show courses ';
                    toggleArrow.style.transform = isOpening ? 'rotate(180deg)' : 'rotate(0deg)';
                    toggleArrow.className = isOpening
                        ? 'fas fa-chevron-up toggle-arrow'
                        : 'fas fa-chevron-down toggle-arrow';
                }
            });
        });
    }
}

document.addEventListener('DOMContentLoaded', () => new App());
