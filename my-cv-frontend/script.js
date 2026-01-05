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
        menuBtn.addEventListener('click', () => {
            isMenuOpen = !isMenuOpen;
            if(isMenuOpen) {
                mobileMenu.classList.add('open');
                menuBtn.innerHTML = '<i class="fas fa-times"></i>';
            } else {
                mobileMenu.classList.remove('open');
                menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
            }
        });

        // Close menu when clicking a link
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                isMenuOpen = false;
                mobileMenu.classList.remove('open');
                menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
            });
        });
    }

    // --- 3. Scroll to Top ---
    const backToTop = document.getElementById('back-to-top');
    if (backToTop) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 500) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        });

        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // --- 4. Intersection Observer for Fade In ---
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
                entry.target.style.opacity = "1"; 
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('section').forEach(section => {
        // Hero is already animated via class in HTML
        if (section.id !== 'hero') {
            section.style.opacity = "0"; // Initial state
            observer.observe(section);
        }
    });

    // --- 5. Smooth Scroll for Anchor Links ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start' 
                });
                
                // If mobile menu is open, close it (handled by other listener, but safe to keep logic clean)
                if (isMenuOpen && mobileMenu) {
                    isMenuOpen = false;
                    mobileMenu.classList.remove('open');
                    if (menuBtn) menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
                }
            }
        });
    });


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
});