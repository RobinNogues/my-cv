document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Theme Toggling ---
    const themeToggles = document.querySelectorAll('.theme-toggle');
    const html = document.documentElement;

    // Check local storage or system preference is already handled in head script, 
    // but we need to ensure icons are correct on load if we were using a class-based system.
    // Our CSS handles icon visibility based on [data-theme], so no extra JS needed for icon state on load.

    themeToggles.forEach(btn => {
        btn.addEventListener('click', () => {
            const currentTheme = html.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    });

    // --- 2. Mobile Menu ---
    const menuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    let isMenuOpen = false;

    if (menuBtn && mobileMenu) {
        const toggleMenu = (open) => {
            isMenuOpen = open;
            if (open) {
                mobileMenu.classList.add('open');
                menuBtn.innerHTML = '<i class="fas fa-times"></i>';
            } else {
                mobileMenu.classList.remove('open');
                menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
            }
        };

        menuBtn.addEventListener('click', () => {
            toggleMenu(!isMenuOpen);
        });

        // Close menu when clicking a link
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                toggleMenu(false);
            });
        });

        // Close menu on resize if switching to desktop
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 1024 && isMenuOpen) {
                toggleMenu(false);
            }
        });
    }

    // --- 3. Scroll to Top ---
    const backToTop = document.getElementById('back-to-top');
    if (backToTop) {
        let isScrolling = false;

        window.addEventListener('scroll', () => {
            if (!isScrolling) {
                window.requestAnimationFrame(() => {
                    if (window.scrollY > 500) {
                        backToTop.classList.add('visible');
                    } else {
                        backToTop.classList.remove('visible');
                    }
                    isScrolling = false;
                });
                isScrolling = true;
            }
        }, { passive: true });

        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // --- 4. Intersection Observer for Fade In ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

    document.querySelectorAll('section:not(#hero)').forEach(section => {
        section.classList.add('reveal');
        observer.observe(section);
    });

    // --- 5. Smooth Scroll for Anchor Links ---
    // Handled by CSS scroll-behavior: smooth


    // --- 6. Contact Form Handling (Real Backend) ---
    const form = document.getElementById('contact-form');
    const submitBtn = document.getElementById('submit-btn');
    const toast = document.getElementById('form-toast');
    const toastMsg = document.getElementById('toast-message');
    const toastIcon = document.getElementById('toast-icon');

    const showToast = (type, message) => {
        // Reset classes
        toast.className = 'toast';
        toast.classList.add(type === 'success' ? 'toast-success' : 'toast-error');

        toastIcon.className = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
        toastMsg.textContent = message;

        // Show
        requestAnimationFrame(() => {
            toast.classList.add('visible');
        });

        // Hide after 5s
        setTimeout(() => {
            toast.classList.remove('visible');
        }, 5000);
    };

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Honeypot check
            const honeypot = document.getElementById('address');
            if (honeypot && honeypot.value) {
                console.warn('Bot detected');
                return; // Silently fail
            }

            // Loading state
            const originalBtnContent = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Sending...';
            submitBtn.disabled = true;

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            delete data.address; // Remove honeypot from data sent to API

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
                    let errorMessage = 'Failed to send message.';

                    if (errorData.detail) {
                        if (typeof errorData.detail === 'string') {
                            errorMessage = errorData.detail;
                        } else if (Array.isArray(errorData.detail)) {
                            // Handle FastAPI validation errors (array of objects)
                            const fieldErrors = errorData.detail.map(err => {
                                const field = err.loc && err.loc.length > 1 ? err.loc[1] : 'Field';
                                return `${field}: ${err.msg}`;
                            }).join('. ');
                            errorMessage = `Validation Error: ${fieldErrors}`;
                        }
                    }
                    showToast('error', errorMessage);
                }
            } catch (error) {
                console.error('Network error:', error);
                showToast('error', 'Network error. Please try again later.');
            } finally {
                // Reset button
                submitBtn.innerHTML = originalBtnContent;
                submitBtn.disabled = false;
            }
        });
    }
    // --- 7. Accordion Animation ---
    document.querySelectorAll('details').forEach((detail) => {
        const summary = detail.querySelector('summary');
        const content = detail.querySelector('.details-content-wrapper');

        if (!content) return;

        let isClosing = false;
        let animationFrameId;
        let onEnd;

        summary.addEventListener('click', (e) => {
            e.preventDefault();

            // Clear any pending validation/cleanup
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            if (onEnd) {
                content.removeEventListener('transitionend', onEnd);
                onEnd = null;
            }

            if (detail.open && !isClosing) {
                // Close
                isClosing = true;
                const startHeight = content.offsetHeight;

                // Set fixed height to start transition from
                content.style.height = `${startHeight}px`;
                content.style.opacity = '1';

                // Force reflow and animate to 0
                animationFrameId = requestAnimationFrame(() => {
                    content.style.height = '0px';
                    content.style.opacity = '0';
                });

                onEnd = () => {
                    detail.removeAttribute('open');
                    isClosing = false;
                    content.style.height = '';
                    content.style.opacity = '';
                    onEnd = null;
                };
                content.addEventListener('transitionend', onEnd, { once: true });

            } else {
                // Open
                isClosing = false;
                detail.setAttribute('open', '');

                // If we are reopening from a closing state, height is already set to something (e.g. 50px)
                // If we are opening new, height is auto (but effectively 0 hidden?)
                // Actually, if we just added open, height is auto.
                // We need to set it to 0 immediately if valid.

                const targetHeight = content.scrollHeight;

                // If completely closed, start from 0
                if (content.style.height === '' || content.style.height === '0px') {
                    content.style.height = '0px';
                    content.style.opacity = '0';
                } else {
                    // We were closing, so style.height matches current computed height approximately
                    // Do nothing, let it animate from there
                }

                animationFrameId = requestAnimationFrame(() => {
                    content.style.height = `${targetHeight}px`;
                    content.style.opacity = '1';
                });

                onEnd = () => {
                    content.style.height = ''; // Auto
                    content.style.opacity = '';
                    onEnd = null;
                };
                content.addEventListener('transitionend', onEnd, { once: true });
            }
        });
    });

});