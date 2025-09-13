class MobileMenu {
    constructor(breakpoint = 768) {
        this.menuButton = document.getElementById('mobile-menu-button');
        this.closeButton = document.getElementById('mobile-menu-close-button');
        this.drawer = document.getElementById('mobile-menu-drawer');
        this.overlay = document.getElementById('mobile-menu-overlay');
        this.breakpoint = breakpoint;
        this.elements = [this.drawer, this.closeButton, this.overlay];
 
        if (this.menuButton && this.closeButton && this.drawer && this.overlay) {
            this.addEventListeners();
        }
    }

    addEventListeners() {
        this.menuButton.addEventListener('click', () => this.open());
        this.closeButton.addEventListener('click', () => this.close());
        this.overlay.addEventListener('click', () => this.close());

        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => this.handleResize(), 20);
        });
    }

    handleResize() {
        if (window.innerWidth >= this.breakpoint && this.isOpen()) {
            this.close();
        }
    }

    #toggleClasses(shouldOpen) {
        const action = shouldOpen ? 'add' : 'remove';
        this.elements.forEach(el => el.classList[action](el === this.drawer ? 'open' : 'visible'));
    }

    open() {
        this.#toggleClasses(true);
    }

    close() {
        this.#toggleClasses(false);
    }

    isOpen() {
        return this.drawer.classList.contains('open');
    }
}

class BackToTopButton {
    constructor(buttonId, visibilityThreshold = 300) {
        this.button = document.getElementById(buttonId);
        this.visibilityThreshold = visibilityThreshold;

        this.isTicking = false;

        if (this.button) {
            this.addEventListeners();
        }
    }

    addEventListeners() {
        window.addEventListener('scroll', () => {
            if (!this.isTicking) {
                window.requestAnimationFrame(() => {
                    this.toggleVisibility();
                    this.isTicking = false;
                });
                this.isTicking = true;
            }
        });
        this.button.addEventListener('click', () => this.scrollToTop());
    }

    toggleVisibility() {
        this.button.classList.toggle('visible', window.scrollY > this.visibilityThreshold);
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
        this.isTicking = false;

        if (this.navLinks.length > 0 && this.sections.length > 0 && this.header) {
            this.addEventListeners();
            this.update();
        }
    }

    addEventListeners() {
        const onScrollOrResize = () => {
            if (!this.isTicking) {
                window.requestAnimationFrame(() => {
                    this.update();
                    this.isTicking = false;
                });
                this.isTicking = true;
            }
        };
        window.addEventListener('scroll', onScrollOrResize);
        window.addEventListener('resize', onScrollOrResize);
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

    #displayStatus(message, type = 'info') {
        const classMap = {
            success: 'status-success',
            error: 'status-error',
            info: 'text-muted'
        };
        const className = classMap[type] || classMap.info;

        this.statusMessage.style.display = 'block';
        this.statusMessage.className = `mt-4 text-center font-medium ${className}`;
        this.statusMessage.textContent = message;
    }

    #handleHoneypot() {
        const honeypotField = this.form.querySelector('#address');
        if (honeypotField && honeypotField.value) {
            console.warn('Honeypot field filled. Likely a bot submission.');
            // We pretend it was successful to mislead the bot.
            this.#displayStatus('Message sent successfully!', 'success');
            this.form.reset();
            return true;
        }
        return false;
    }

    async handleSubmit(e) {
        e.preventDefault();
        const currentTime = Date.now();

        if (currentTime - this.lastSubmissionTime < this.cooldownPeriod) {
            this.#displayStatus('Please wait a moment before sending another message.', 'error');
            return;
        }

        if (this.#handleHoneypot()) {
            this.lastSubmissionTime = currentTime;
            return;
        }

        this.#displayStatus('Message being sent...', 'info');

        const formData = new FormData(this.form);
        const data = Object.fromEntries(formData.entries());
        delete data.address;

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                const result = await response.json();
                this.#displayStatus(result.message || 'Message sent successfully!', 'success');
                this.form.reset();
                this.lastSubmissionTime = currentTime;
            } else {
                this.#handleApiError(response);
            }
        } catch (error) {
            console.error('Network or API issue:', error);
            this.#displayStatus('An error occurred, please check your network and try again.', 'error');
        }
    }

    async #handleApiError(response) {
        let errorMessage = 'An error occurred, please try again later.';
        try {
            const errorData = await response.json();
            console.error('API Error:', errorData);

            if (response.status === 422 && Array.isArray(errorData.detail)) {
                const fieldErrors = errorData.detail.map(err => {
                    const field = err.loc && err.loc.length > 1 ? err.loc[1] : 'field';
                    return `${field}: ${err.msg}`;
                }).join('. ');
                errorMessage = `Validation error: ${fieldErrors}.`;
            } else if (typeof errorData.detail === 'string') {
                errorMessage = errorData.detail;
            }
        } catch (e) {
            console.error('Could not parse API error response', e);
        }
        this.#displayStatus(errorMessage, 'error');
    }
}

class ThemeToggler {
    constructor(toggleId) {
        this.toggleButton = document.getElementById(toggleId);
        this.sunIcon = document.querySelector('.sun-icon');
        this.moonIcon = document.querySelector('.moon-icon');

        if (!this.toggleButton || !this.sunIcon || !this.moonIcon) {
            console.error('Theme toggler elements not found.');
            return;
        }

        // Animation properties
        this.animationDuration = 500; // ms, matches the CSS transition
        this.centerTransform = 'translate(-50%, -50%) rotate(0deg)';
        this.exitTransform = 'translate(-70px, 70px) rotate(-45deg)';
        this.enterTransform = 'translate(70px, 70px) rotate(45deg)';

        this.isDark = false; // We just track the state for animation
        this.addEventListeners();
        this.applyInitialState();
    }

    applyInitialState() {
        // Set initial state without animation
        this.sunIcon.style.transition = 'none';
        this.moonIcon.style.transition = 'none';

        if (this.isDark) {
            this.sunIcon.style.transform = this.exitTransform;
            this.sunIcon.style.opacity = '0';
            this.moonIcon.style.transform = this.centerTransform;
            this.moonIcon.style.opacity = '1';
        } else {
            this.sunIcon.style.transform = this.centerTransform;
            this.sunIcon.style.opacity = '1';
            this.moonIcon.style.transform = this.enterTransform;
            this.moonIcon.style.opacity = '0';
        }
    }

    addEventListeners() {
        this.toggleButton.addEventListener('click', () => this.toggleTheme());
    }

    toggleTheme() {
        const exitingIcon = this.isDark ? this.moonIcon : this.sunIcon;
        const enteringIcon = this.isDark ? this.sunIcon : this.moonIcon;

        // Position the entering icon to its start point without transition
        enteringIcon.style.transition = 'none';
        enteringIcon.style.transform = this.enterTransform;
        enteringIcon.style.opacity = '0';

        // Use a timeout to ensure the initial state is rendered before starting the animation
        setTimeout(() => {
            exitingIcon.style.transition = ''; // Re-enable CSS transition
            exitingIcon.style.transform = this.exitTransform;

            enteringIcon.style.transition = ''; // Re-enable CSS transition
            enteringIcon.style.transform = this.centerTransform;
            enteringIcon.style.opacity = '1';

        }, 10);

        this.isDark = !this.isDark;
    }
}

class App {
    constructor() {
        this.mobileMenu = new MobileMenu(); // Tailwind's md breakpoint is 768px
        new BackToTopButton('back-to-top');
        new NavLinkHighlighter('.nav-link', 'section[id]');
        new ContactFormHandler('contact-form', 'form-status-message');
        new ThemeToggler('theme-toggle');
        this.addEventListeners();
    }

    addEventListeners() {
        document.body.addEventListener('click', this.#handleDelegatedClicks.bind(this));
    }

    #handleDelegatedClicks(e) {
        const anchor = e.target.closest('a[href^="#"]');
        if (anchor) {
            this.#handleLinkClick(e, anchor);
            return;
        }

        const toggleLink = e.target.closest('.course-toggle-link');
        if (toggleLink) {
            this.#handleCourseToggle(toggleLink);
        }
    }

    #handleLinkClick(e, anchor) {
        e.preventDefault();
        const targetId = anchor.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth' });
        }
        if (this.mobileMenu.isOpen()) {
            this.mobileMenu.close();
        }
    }

    #handleCourseToggle(toggleLink) {
        const targetId = toggleLink.getAttribute('aria-controls');
        const targetElement = document.getElementById(targetId);
        const toggleArrow = toggleLink.querySelector('.toggle-arrow');

        if (targetElement && toggleArrow) {
            const isOpening = targetElement.classList.toggle('open');
            toggleLink.setAttribute('aria-expanded', isOpening);
            toggleLink.firstChild.textContent = isOpening ? 'Hide courses ' : 'Show courses ';
            toggleArrow.style.transform = isOpening ? 'rotate(180deg)' : 'rotate(0deg)';
            toggleArrow.classList.toggle('fa-chevron-down', !isOpening);
            toggleArrow.classList.toggle('fa-chevron-up', isOpening);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => new App());
