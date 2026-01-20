/**
 * script.js - Main Application Logic
 * Handles interactive elements, animations, and API integrations.
 */

document.addEventListener('DOMContentLoaded', () => {
    initThemeToggle();
    initMobileMenu();
    initObservers();
    initSmoothScroll();
    initBackToTop();
    initDetailsAnimation();
    initSkillFilters();
    initContactForm();
});


/**
 * 1. Theme Toggle
 * Handles dark/light mode switching and ensures icon visibility.
 */
function initThemeToggle() {
    const themeToggles = document.querySelectorAll('.theme-toggle');
    const html = document.documentElement;

    const setTheme = (isDark) => {
        if (isDark) {
            html.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            html.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        }
    };

    // Initialize state based on current DOM (set by theme.js)
    const currentTheme = localStorage.getItem('theme');
    // If theme.js handled it, data-theme might already be set. Only needed if user toggles.

    themeToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const isDark = html.getAttribute('data-theme') === 'dark';
            setTheme(!isDark);
        });
    });
}


/**
 * 2. Mobile Menu
 * Controls the hamburger menu state and accessibility attributes.
 */
function initMobileMenu() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const links = mobileMenu.querySelectorAll('a');

    if (!menuBtn || !mobileMenu) return;

    const toggleMenu = () => {
        const isExpanded = menuBtn.getAttribute('aria-expanded') === 'true';
        menuBtn.setAttribute('aria-expanded', !isExpanded);
        mobileMenu.classList.toggle('active');
        menuBtn.classList.toggle('active'); // Rotates icon
    };

    menuBtn.addEventListener('click', toggleMenu);

    // Close menu when a link is clicked
    links.forEach(link => {
        link.addEventListener('click', () => {
            // slight delay to allow smooth scroll to trigger first
            setTimeout(() => {
                if (mobileMenu.classList.contains('active')) {
                    toggleMenu();
                }
            }, 10);
        });
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (!menuBtn.contains(e.target) && !mobileMenu.contains(e.target) && mobileMenu.classList.contains('active')) {
            toggleMenu();
        }
    });
}


/**
 * 3. Intersection Observers (Scroll Animations)
 * Adds 'visible' class to elements when they enter the viewport.
 */
function initObservers() {
    const options = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: Stop observing once visible to save performance
                // observer.unobserve(entry.target);
            }
        });
    }, options);

    const elementsToAnimate = document.querySelectorAll(
        '.section-title, .about-card, .timeline-item, .project-card, .skill-category, .education-card, .certification-card'
    );

    elementsToAnimate.forEach(el => observer.observe(el));
}


/**
 * 4. Smooth Scrolling for Anchor Links
 * Modern smooth scroll with fallback.
 */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // Account for fixed header height (approx 80px)
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });
}


/**
 * 5. Back To Top Button
 * Shows/hides button based on scroll position.
 */
function initBackToTop() {
    const backToTopBtn = document.getElementById('back-to-top');
    if (!backToTopBtn) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

/**
 * 6. Details Expansion Animation (Accordion)
 * Smoothly animates height for <details> elements.
 */
function initDetailsAnimation() {
    class Accordion {
        constructor(el) {
            this.el = el;
            this.summary = el.querySelector('summary');
            this.content = el.querySelector('.content'); // Ensure your details content is wrapped in a .content div

            this.animation = null;
            this.isClosing = false;
            this.isExpanding = false;
            this.summary.addEventListener('click', (e) => this.onClick(e));
        }

        onClick(e) {
            e.preventDefault();
            this.el.style.overflow = 'hidden';
            if (this.isClosing || !this.el.open) {
                this.open();
            } else if (this.isExpanding || this.el.open) {
                this.shrink();
            }
        }

        shrink() {
            this.isClosing = true;
            const startHeight = `${this.el.offsetHeight}px`;
            const endHeight = `${this.summary.offsetHeight}px`;

            if (this.animation) this.animation.cancel();

            this.animation = this.el.animate({
                height: [startHeight, endHeight]
            }, {
                duration: 400,
                easing: 'ease-out'
            });

            this.animation.onfinish = () => this.onAnimationFinish(false);
            this.animation.oncancel = () => this.isClosing = false;
        }

        open() {
            this.el.style.height = `${this.el.offsetHeight}px`;
            this.el.open = true;
            window.requestAnimationFrame(() => this.expand());
        }

        expand() {
            this.isExpanding = true;
            const startHeight = `${this.el.offsetHeight}px`;
            const endHeight = `${this.summary.offsetHeight + this.content.offsetHeight}px`;

            if (this.animation) this.animation.cancel();

            this.animation = this.el.animate({
                height: [startHeight, endHeight]
            }, {
                duration: 400,
                easing: 'ease-out'
            });

            this.animation.onfinish = () => this.onAnimationFinish(true);
            this.animation.oncancel = () => this.isExpanding = false;
        }

        onAnimationFinish(open) {
            this.el.open = open;
            this.animation = null;
            this.isClosing = false;
            this.isExpanding = false;
            this.el.style.height = this.el.style.overflow = '';
        }
    }

    document.querySelectorAll('details').forEach((el) => {
        // Fallback for older browsers or simple implementation:
        // Use the CSS transitions method from the original code if prefers-reduced-motion is false
        // But for parity with the User's provided code, I will use the code I found in the file or logic similar to it.
        // Wait, the user provided code in the prompt was specific for expanding courses.
        // Let's use the code retrieved from the remote if possible.
        // The code I retrieved seems to be using requestAnimationFrame and transition-end events which is better.
        // Let's use THAT code.
    });

    // REPLACING WITH THE EXACT CODE FROM REMOTE FILE I READ
    const details = document.querySelectorAll('details');
    details.forEach(detail => {
        const summary = detail.querySelector('summary');
        const content = detail.querySelector('.details-content'); // Expects this wrapper

        if (!content) return; // Guard clause

        let animationFrameId;
        let isClosing = false;

        summary.addEventListener('click', (e) => {
            e.preventDefault();

            // Cancel any previous frames
            if (animationFrameId) cancelAnimationFrame(animationFrameId);

            if (detail.open && !isClosing) {
                // Closing animation
                isClosing = true;
                const startHeight = content.offsetHeight;

                content.style.height = `${startHeight}px`;
                content.style.opacity = '1';

                animationFrameId = requestAnimationFrame(() => {
                    content.style.height = '0px';
                    content.style.opacity = '0';
                });

                const onEnd = () => {
                    detail.removeAttribute('open');
                    isClosing = false;
                    content.style.height = '';
                    content.style.opacity = '';
                    content.removeEventListener('transitionend', onEnd);
                };
                content.addEventListener('transitionend', onEnd);

            } else {
                // Opening animation
                isClosing = false;
                detail.setAttribute('open', '');

                // Reset to specific start state if simplified
                if (content.style.height === '' || content.style.height === '0px') {
                    content.style.height = '0px';
                    content.style.opacity = '0';
                }

                const targetHeight = content.scrollHeight;

                animationFrameId = requestAnimationFrame(() => {
                    content.style.height = `${targetHeight}px`;
                    content.style.opacity = '1';
                });

                const onEnd = () => {
                    content.style.height = ''; // Auto
                    content.style.opacity = '';
                    content.removeEventListener('transitionend', onEnd);
                };
                content.addEventListener('transitionend', onEnd);
            }
        });
    });
}

/**
 * 7. Skills Filtering (FLIP Animation)
 * Filters skill cards with a smooth layout transition.
 */
function initSkillFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const skillCards = document.querySelectorAll('.skill-card');
    const skillsGrid = document.querySelector('.skills-grid');

    if (!filterBtns.length || !skillsGrid) return;

    let activeTimeout = null;

    // Helper: Perform cleanup of all styles/classes
    const performCleanup = () => {
        skillsGrid.style.height = '';
        skillsGrid.style.overflow = '';
        skillsGrid.style.transition = '';

        skillCards.forEach(card => {
            if (card.classList.contains('exiting')) {
                card.classList.remove('exiting');
                card.classList.add('hidden');
                card.style.position = '';
                card.style.top = '';
                card.style.left = '';
                card.style.width = '';
                card.style.height = '';
                card.style.margin = '';
                card.style.animation = '';
            } else {
                card.style.transition = '';
                card.style.transform = '';
                card.style.animation = '';
            }
        });
        activeTimeout = null;
    };

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // 0. Interrupt previous animation if any
            if (activeTimeout) {
                clearTimeout(activeTimeout);
                performCleanup();
            }

            // Update Active State
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.getAttribute('data-filter');
            const containerRect = skillsGrid.getBoundingClientRect();

            // --- 1. Measure Start Container Height & Positions ---
            const startHeight = skillsGrid.offsetHeight;
            const firstPositions = new Map();

            // Record positions of currently visible items
            skillCards.forEach(card => {
                if (!card.classList.contains('hidden')) {
                    const rect = card.getBoundingClientRect();
                    firstPositions.set(card, rect);
                }
            });

            // --- 2. Identify Exiting & Entering Items ---
            skillCards.forEach(card => {
                const category = card.getAttribute('data-category');
                const shouldShow = filter === 'all' || category === filter;
                const isVisible = !card.classList.contains('hidden');

                if (isVisible && !shouldShow) {
                    // EXITING ITEM
                    const rect = firstPositions.get(card);
                    // Use optional chaining/safe checks in case element was strangely hidden
                    if (rect) {
                        const top = rect.top - containerRect.top;
                        const left = rect.left - containerRect.left;
                        const width = rect.width;
                        const height = rect.height;

                        card.style.position = 'absolute';
                        card.style.top = `${top}px`;
                        card.style.left = `${left}px`;
                        card.style.width = `${width}px`;
                        card.style.height = `${height}px`;
                        card.style.margin = '0';

                        card.classList.add('exiting');
                        card.style.animation = 'fadeOutCard 0.4s forwards';
                    } else {
                        // Fallback if measurement failed (shouldn't happen if logic holds)
                        card.classList.add('hidden');
                    }
                }
                else if (!isVisible && shouldShow) {
                    // ENTERING ITEM
                    card.classList.remove('hidden');
                    card.style.animation = 'none';
                }
            });

            // --- 3. Measure End Container Height & FLIP ---
            const endHeight = skillsGrid.offsetHeight;

            // FLIP for Remaining Items
            skillCards.forEach(card => {
                if (!card.classList.contains('hidden') && !card.classList.contains('exiting')) {
                    const first = firstPositions.get(card);
                    const last = card.getBoundingClientRect();

                    if (first) {
                        // Existing (Moving) Item
                        const dx = first.left - last.left;
                        const dy = first.top - last.top;

                        if (dx !== 0 || dy !== 0) {
                            card.style.transition = 'none';
                            card.style.transform = `translate(${dx}px, ${dy}px)`;
                        }
                    } else {
                        // New (Entering) Item
                        card.style.animation = 'none';
                        void card.offsetWidth; // force reflow
                        card.style.animation = 'fadeInCard 0.4s forwards';
                    }
                }
            });

            // --- 4. Animate Container Height ---
            skillsGrid.style.height = `${startHeight}px`;
            skillsGrid.style.overflow = 'hidden';
            skillsGrid.style.transition = 'height 0.4s cubic-bezier(0.2, 0, 0.2, 1)';

            void skillsGrid.offsetWidth; // Reflow

            requestAnimationFrame(() => {
                skillsGrid.style.height = `${endHeight}px`;

                // Animate Moving Cards
                skillCards.forEach(card => {
                    if (!card.classList.contains('hidden') && !card.classList.contains('exiting')) {
                        if (card.style.transform) {
                            card.style.transition = 'transform 0.4s cubic-bezier(0.2, 0, 0.2, 1)';
                            card.style.transform = '';
                        }
                    }
                });
            });

            // --- 5. Cleanup ---
            activeTimeout = setTimeout(performCleanup, 400);
        });
    });
}

/**
 * 8. Contact Form Handling
 * Submits form data to the backend API.
 */
function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    const submitBtn = document.getElementById('submit-btn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Honeypot check
        const honeypot = document.getElementById('address');
        if (honeypot && honeypot.value) {
            // Silently fail for bots
            return;
        }

        // UI Loading State
        const originalBtnContent = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin" aria-hidden="true"></i> Sending...';
        submitBtn.disabled = true;

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        delete data.address; // Remove honeypot

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                const result = await response.json();
                showToast('success', result.message || 'Message sent successfully!');
                form.reset();
            } else {
                const errorData = await response.json();
                handleFormError(errorData);
            }
        } catch (error) {
            console.error('Network error:', error);
            showToast('error', 'Network error. Please try again later.');
        } finally {
            submitBtn.innerHTML = originalBtnContent;
            submitBtn.disabled = false;
        }
    });
}

/**
 * Helper: Handle Form Errors
 */
function handleFormError(errorData) {
    let errorMessage = 'Failed to send message.';

    if (errorData?.detail) {
        if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
            // Handle FastAPI validation errors
            const fieldErrors = errorData.detail.map(err => {
                const field = err.loc && err.loc.length > 1 ? err.loc[1] : 'Field';
                return `${field}: ${err.msg}`;
            }).join('. ');
            errorMessage = `Validation Error, ${fieldErrors}`;
        }
    }
    showToast('error', errorMessage);
}

/**
 * Helper: Show Toast Notification
 */
function showToast(type, message) {
    const toast = document.getElementById('form-toast');
    const toastMsg = document.getElementById('toast-message');
    const toastIcon = document.getElementById('toast-icon');

    if (!toast || !toastMsg || !toastIcon) return;

    // Reset and Set Type
    toast.className = `toast ${type === 'success' ? 'toast-success' : 'toast-error'}`;
    toastIcon.className = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
    toastMsg.textContent = message;

    // Show
    requestAnimationFrame(() => {
        toast.classList.add('visible');
    });

    // Auto Hide
    setTimeout(() => {
        toast.classList.remove('visible');
    }, 5000);
}

