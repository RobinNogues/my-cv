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
        this.sectionData = [];

        if (this.navLinks.length > 0 && this.sections.length > 0 && this.header) {
            this.calculateSectionPositions();
            this.addEventListeners();
            this.updateActiveLink();
        }
    }

    addEventListeners() {
        window.addEventListener('scroll', () => {
            if (!this.isTicking) {
                window.requestAnimationFrame(() => {
                    this.updateActiveLink();
                    this.isTicking = false;
                });
                this.isTicking = true;
            }
        });

        // Recalculate positions on resize, as section dimensions might change.
        window.addEventListener('resize', () => this.calculateSectionPositions());
    }

    calculateSectionPositions() {
        const headerOffset = this.header.offsetHeight + 20; // 20px buffer
        this.sectionData = Array.from(this.sections).map(section => {
            const top = section.offsetTop - headerOffset;
            return {
                id: section.id,
                top: top,
                bottom: top + section.offsetHeight
            };
        });
    }

    updateActiveLink() {
        let currentActiveId = null;
        const scrollY = window.scrollY;
        for (const section of this.sectionData) {
            if (scrollY >= section.top && scrollY < section.bottom) {
                currentActiveId = section.id;
                break; // Found the active section, no need to check further
            }
        }

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
    constructor(toggleId, onToggle = () => {}) {
        this.onToggle = onToggle;
        this.toggleButton = document.getElementById(toggleId);
        this.sunIcon = this.toggleButton?.querySelector('.sun-icon');
        this.moonIcon = this.toggleButton?.querySelector('.moon-icon');

        if (!this.toggleButton || !this.sunIcon || !this.moonIcon) {
            console.error('Theme toggler elements not found.');
            return;
        }

        this.isAnimating = false;
        this.toggleButton.addEventListener('click', () => this.toggle());
    }

    setInitialTheme(theme) {
        this.currentTheme = theme;
        this._updateIcons(false);
    }

    _updateIcons(animate = true) {
        // Temporarily disable transitions to set initial state instantly
        this.toggleButton.style.pointerEvents = 'none';
        this.sunIcon.style.transition = 'none';
        this.moonIcon.style.transition = 'none';

        // Ensure both icons are display: block so animations work
        this.sunIcon.style.display = 'block';
        this.moonIcon.style.display = 'block';

        if (this.currentTheme === 'dark') {
            this.sunIcon.classList.add('is-exiting');
            this.moonIcon.classList.add('is-visible');
        } else {
            this.sunIcon.classList.add('is-visible');
            this.moonIcon.classList.add('is-entering');
        }

        if (!animate) {
            // Use requestAnimationFrame to ensure the browser has painted the style changes
            // before we re-enable transitions. This is more reliable than a fixed setTimeout.
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    this.sunIcon.style.transition = '';
                    this.moonIcon.style.transition = '';
                    this.toggleButton.style.pointerEvents = 'auto';
                });
            });
        }
    }

    toggle() {
        if (this.isAnimating) return;
        this.isAnimating = true;

        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        const exitingIcon = this.currentTheme === 'light' ? this.sunIcon : this.moonIcon;
        const enteringIcon = newTheme === 'light' ? this.sunIcon : this.moonIcon;

        enteringIcon.classList.remove('is-visible', 'is-exiting');
        enteringIcon.classList.add('is-entering');
        
        exitingIcon.classList.remove('is-visible');
        exitingIcon.classList.add('is-exiting');

        enteringIcon.addEventListener('transitionend', () => {
            this.isAnimating = false;
        }, { once: true });

        enteringIcon.classList.remove('is-entering');
        enteringIcon.classList.add('is-visible');
        
        this.currentTheme = newTheme;

        this.onToggle(this.currentTheme);
    }
}

class CourseToggler {
    constructor(containerSelector = 'body') {
        this.container = document.querySelector(containerSelector);
        if (this.container) {
            this.container.addEventListener('click', this.handleToggle.bind(this));
        }
    }

    handleToggle(e) {
        const toggleLink = e.target.closest('.course-toggle-link');
        if (!toggleLink) return;

        const targetId = toggleLink.getAttribute('aria-controls');
        const targetElement = document.getElementById(targetId);
        const toggleArrow = toggleLink.querySelector('.toggle-arrow');
        const toggleText = toggleLink.querySelector('.course-toggle-text');

        if (targetElement && toggleArrow && toggleText) {
            const isOpening = targetElement.classList.toggle('open');
            toggleLink.setAttribute('aria-expanded', isOpening);
            toggleText.textContent = isOpening ? 'Hide courses' : 'Show courses';
            toggleArrow.style.transform = isOpening ? 'rotate(180deg)' : 'rotate(0deg)';
            // The following two lines are redundant if using transform, but kept for compatibility.
            toggleArrow.classList.toggle('fa-chevron-down', !isOpening);
            toggleArrow.classList.toggle('fa-chevron-up', isOpening);
        }
    }
}
class App {
    constructor() {
        this.mobileMenu = new MobileMenu(); // Tailwind's md breakpoint is 768px
        new BackToTopButton('back-to-top');
        new NavLinkHighlighter('.nav-link', 'section[id]');
        new ContactFormHandler('contact-form', 'form-status-message');
        
        new CourseToggler('#certifications');
        this.themeToggler = new ThemeToggler('theme-toggle', (newTheme) => this.setTheme(newTheme));
        this.initializeTheme();

        this.addEventListeners();
    }

    initializeTheme() {
        const initialTheme = document.documentElement.getAttribute('data-theme') || 'light';
        this.themeToggler.setInitialTheme(initialTheme);

        // Clean up pre-JS classes now that JS has hydrated the component.
        document.documentElement.classList.remove('light-theme-active', 'dark-theme-active');

    }

    setTheme(theme, save = true) {
        document.documentElement.setAttribute('data-theme', theme);
        if (save) {
            localStorage.setItem('theme', theme);
        }
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
}

document.addEventListener('DOMContentLoaded', () => new App());
