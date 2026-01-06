/**
 * my-cv-frontend main script
 * Modularized for code quality and maintainability.
 */

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initMobileMenu();
    initScrollToTop();
    initScrollAnimations();
    initContactForm();
    initAccordion();
    initSkillFilters();
});

/**
 * 1. Theme Toggling
 * Handles switching between light and dark modes and syncing with system preferences.
 */
function initTheme() {
    const themeToggles = document.querySelectorAll('.theme-toggle');
    const html = document.documentElement;

    const setTheme = (theme) => {
        html.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    };

    themeToggles.forEach(btn => {
        btn.addEventListener('click', () => {
            const currentTheme = html.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            setTheme(newTheme);
        });
    });

    // System Preference Sync
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (!localStorage.getItem('theme')) {
            setTheme(e.matches ? 'dark' : 'light');
        }
    });
}

/**
 * 2. Mobile Menu
 * Handles opening/closing of the mobile navigation drawer.
 */
function initMobileMenu() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (!menuBtn || !mobileMenu) return;

    let isMenuOpen = false;

    const toggleMenu = (open) => {
        isMenuOpen = open;
        if (open) {
            mobileMenu.classList.add('open');
            menuBtn.innerHTML = '<i class="fas fa-times" aria-hidden="true"></i>';
            menuBtn.setAttribute('aria-expanded', 'true');
        } else {
            mobileMenu.classList.remove('open');
            menuBtn.innerHTML = '<i class="fas fa-bars" aria-hidden="true"></i>';
            menuBtn.setAttribute('aria-expanded', 'false');
        }
    };

    menuBtn.addEventListener('click', () => toggleMenu(!isMenuOpen));

    // Close menu when clicking a link
    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => toggleMenu(false));
    });

    // Close menu on resize if switching to desktop
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 1024 && isMenuOpen) {
            toggleMenu(false);
        }
    }, { passive: true });
}

/**
 * 3. Scroll to Top
 * Shows/hides the back-to-top button based on scroll position.
 */
function initScrollToTop() {
    const backToTop = document.getElementById('back-to-top');
    if (!backToTop) return;

    let isScrolling = false;

    window.addEventListener('scroll', () => {
        if (!isScrolling) {
            window.requestAnimationFrame(() => {
                const shouldShow = window.scrollY > 500;
                backToTop.classList.toggle('visible', shouldShow);
                isScrolling = false;
            });
            isScrolling = true;
        }
    }, { passive: true });

    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

/**
 * 4. Scroll Animations (Intersection Observer)
 * Reveals sections as they scroll into view.
 */
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -25px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('section:not(#hero)').forEach(section => {
        // Check if section is already possibly visible
        const rect = section.getBoundingClientRect();
        const alreadyVisible = rect.top < window.innerHeight;

        section.classList.add('reveal');

        if (alreadyVisible) {
            section.classList.add('visible');
        } else {
            observer.observe(section);
        }
    });
}

/**
 * 5. Contact Form Handling
 * Manages form submission to the backend API with Toast feedback.
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
            errorMessage = `Validation Error: ${fieldErrors}`;
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

/**
 * 6. Accordion Animation
 * Smoothly animates the verification details element.
 */
function initAccordion() {
    document.querySelectorAll('details').forEach((detail) => {
        const summary = detail.querySelector('summary');
        const content = detail.querySelector('.details-content-wrapper');

        if (!content) return;

        let isClosing = false;
        let animationFrameId; // keep track to cancel if spam-clicked

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

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update Active State
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.getAttribute('data-filter');

            // --- FLIP: FIRST ---
            const firstPositions = new Map();
            skillCards.forEach(card => {
                if (!card.classList.contains('hidden')) {
                    firstPositions.set(card, card.getBoundingClientRect());
                }
            });

            // Change State (DOM Layout Shift)
            skillCards.forEach(card => {
                const category = card.getAttribute('data-category');
                const shouldShow = filter === 'all' || category === filter;
                card.classList.toggle('hidden', !shouldShow);
            });

            // --- FLIP: LAST & INVERT ---
            skillCards.forEach(card => {
                if (!card.classList.contains('hidden')) {
                    const first = firstPositions.get(card);
                    const last = card.getBoundingClientRect();

                    if (first) {
                        // Existing Item: specific transform
                        const dx = first.left - last.left;
                        const dy = first.top - last.top;

                        card.style.transition = 'none';
                        card.style.transform = `translate(${dx}px, ${dy}px)`;
                    } else {
                        // New Item: Fade In
                        card.style.animation = 'none';
                        void card.offsetWidth; // Force Reflow
                        card.style.animation = 'fadeInCard 0.4s forwards';
                    }
                }
            });

            // --- FLIP: PLAY ---
            requestAnimationFrame(() => {
                skillCards.forEach(card => {
                    if (!card.classList.contains('hidden')) {
                        // Transition existing items back to 0
                        if (card.style.transform && card.style.transform !== 'none') {
                            card.style.transition = 'transform 0.4s cubic-bezier(0.2, 0, 0.2, 1)';
                            card.style.transform = '';
                        }
                    }
                });
            });

            // Cleanup
            setTimeout(() => {
                skillCards.forEach(card => {
                    card.style.transition = '';
                    card.style.transform = '';
                    card.style.animation = '';
                });
            }, 400);
        });
    });
}