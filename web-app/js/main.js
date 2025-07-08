// Main JavaScript - Core functionality for Elyte Platform

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initializeHeader();
    initializeScrollToTop();
    initializeAnimations();
    initializeAccessibility();
    initializeForms();
    initializeLocalStorage();
    initializeOfflineSupport();
    
    console.log('Elyte Platform initialized successfully');
});

// Header functionality
function initializeHeader() {
    const header = document.querySelector('.main-header');
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mainNav = document.querySelector('.main-nav');
    const authButtons = document.querySelector('.auth-buttons');
    
    // Mobile menu toggle
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function(e) {
            e.preventDefault();
            mainNav.classList.toggle('active');
            authButtons.classList.toggle('active');
            
            // Toggle hamburger icon
            this.classList.toggle('active');
            
            // Update aria attributes
            const isOpen = mainNav.classList.contains('active');
            this.setAttribute('aria-expanded', isOpen);
        });
    }
    
    // Header scroll behavior
    let lastScrollY = window.scrollY;
    
    window.addEventListener('scroll', function() {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        // Hide header when scrolling down, show when scrolling up
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
            header.style.transform = 'translateY(-100%)';
        } else {
            header.style.transform = 'translateY(0)';
        }
        
        lastScrollY = currentScrollY;
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!header.contains(e.target)) {
            mainNav.classList.remove('active');
            authButtons.classList.remove('active');
            if (mobileMenuToggle) {
                mobileMenuToggle.classList.remove('active');
                mobileMenuToggle.setAttribute('aria-expanded', false);
            }
        }
    });
    
    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const offsetTop = targetElement.offsetTop - 80; // Account for fixed header
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
                
                // Close mobile menu after clicking
                mainNav.classList.remove('active');
                authButtons.classList.remove('active');
                if (mobileMenuToggle) {
                    mobileMenuToggle.classList.remove('active');
                    mobileMenuToggle.setAttribute('aria-expanded', false);
                }
            }
        });
    });
}

// Scroll to top button
function initializeScrollToTop() {
    // Create scroll to top button
    const scrollToTopButton = document.createElement('button');
    scrollToTopButton.className = 'scroll-to-top';
    scrollToTopButton.innerHTML = '↑';
    scrollToTopButton.setAttribute('aria-label', 'Scroll to top');
    scrollToTopButton.setAttribute('title', 'Scroll to top');
    document.body.appendChild(scrollToTopButton);
    
    // Show/hide scroll to top button
    window.addEventListener('scroll', function() {
        if (window.scrollY > 500) {
            scrollToTopButton.classList.add('visible');
        } else {
            scrollToTopButton.classList.remove('visible');
        }
    });
    
    // Scroll to top functionality
    scrollToTopButton.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Initialize animations
function initializeAnimations() {
    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-in-up');
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animateElements = document.querySelectorAll('.feature-card, .step-item, .ghana-feature, .cta-option');
    animateElements.forEach(element => {
        observer.observe(element);
    });
}

// Accessibility enhancements
function initializeAccessibility() {
    // Skip to main content link
    const skipLink = document.createElement('a');
    skipLink.href = '#main';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'skip-link';
    document.body.insertBefore(skipLink, document.body.firstChild);
    
    // Add main ID to main element
    const mainElement = document.querySelector('main');
    if (mainElement) {
        mainElement.id = 'main';
    }
    
    // Keyboard navigation for interactive elements
    const interactiveElements = document.querySelectorAll('button, a, input, select, textarea');
    interactiveElements.forEach(element => {
        element.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                if (element.tagName === 'A' || element.tagName === 'BUTTON') {
                    element.click();
                }
            }
        });
    });
    
    // Focus management
    let focusedElementBeforeModal = null;
    
    window.addEventListener('beforeunload', function() {
        // Save focus state
        focusedElementBeforeModal = document.activeElement;
    });
    
    // Announce dynamic content changes to screen readers
    function announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }
    
    // Make announcement function globally available
    window.announceToScreenReader = announceToScreenReader;
}

// Form handling
function initializeForms() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        // Real-time validation
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                validateField(this);
            });
            
            input.addEventListener('input', function() {
                clearFieldError(this);
            });
        });
        
        // Form submission
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (validateForm(this)) {
                handleFormSubmission(this);
            }
        });
    });
}

// Field validation
function validateField(field) {
    const fieldName = field.name || field.id;
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';
    
    // Remove existing errors
    clearFieldError(field);
    
    // Required field validation
    if (field.hasAttribute('required') && !value) {
        isValid = false;
        errorMessage = `${getFieldLabel(field)} is required`;
    }
    
    // Email validation
    if (field.type === 'email' && value && !isValidEmail(value)) {
        isValid = false;
        errorMessage = 'Please enter a valid email address';
    }
    
    // Phone validation (Ghana format)
    if (field.type === 'tel' && value && !isValidGhanaPhone(value)) {
        isValid = false;
        errorMessage = 'Please enter a valid Ghana phone number';
    }
    
    // Password validation
    if (field.type === 'password' && value && !isValidPassword(value)) {
        isValid = false;
        errorMessage = 'Password must be at least 8 characters with uppercase, lowercase, number, and special character';
    }
    
    // Confirm password validation
    if (field.name === 'confirm_password' || field.id === 'confirm_password') {
        const passwordField = document.querySelector('input[name="password"], input[id="password"]');
        if (passwordField && value !== passwordField.value) {
            isValid = false;
            errorMessage = 'Passwords do not match';
        }
    }
    
    if (!isValid) {
        showFieldError(field, errorMessage);
    }
    
    return isValid;
}

// Form validation
function validateForm(form) {
    const inputs = form.querySelectorAll('input, select, textarea');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!validateField(input)) {
            isValid = false;
        }
    });
    
    return isValid;
}

// Utility functions
function getFieldLabel(field) {
    const label = document.querySelector(`label[for="${field.id}"]`);
    return label ? label.textContent.replace('*', '').trim() : field.name || field.id;
}

function clearFieldError(field) {
    const errorElement = field.parentNode.querySelector('.form-error');
    if (errorElement) {
        errorElement.remove();
    }
    field.classList.remove('error');
}

function showFieldError(field, message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'form-error';
    errorElement.textContent = message;
    field.parentNode.appendChild(errorElement);
    field.classList.add('error');
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidGhanaPhone(phone) {
    // Ghana phone number formats: +233XXXXXXXXX, 0XXXXXXXXX, XXXXXXXXX
    const cleanPhone = phone.replace(/\s+/g, '');
    const ghanaPhoneRegex = /^(\+233|0)?[2-9]\d{8}$/;
    return ghanaPhoneRegex.test(cleanPhone);
}

function isValidPassword(password) {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
}

// Form submission handler
function handleFormSubmission(form) {
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    
    // Show loading state
    submitButton.textContent = 'Submitting...';
    submitButton.disabled = true;
    submitButton.classList.add('loading');
    
    // Simulate API call (replace with actual API integration)
    setTimeout(() => {
        // Reset button
        submitButton.textContent = originalText;
        submitButton.disabled = false;
        submitButton.classList.remove('loading');
        
        // Show success message
        showNotification('Form submitted successfully!', 'success');
        
        // Save form data to localStorage for offline support
        saveFormData(form);
    }, 2000);
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Remove notification after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 5000);
    
    // Announce to screen readers
    if (window.announceToScreenReader) {
        window.announceToScreenReader(message);
    }
}

// Local storage management
function initializeLocalStorage() {
    // Check if localStorage is available
    if (typeof Storage !== 'undefined') {
        // Load user preferences
        loadUserPreferences();
        
        // Save preferences on page unload
        window.addEventListener('beforeunload', function() {
            saveUserPreferences();
        });
    }
}

function loadUserPreferences() {
    const preferences = localStorage.getItem('elyte_preferences');
    if (preferences) {
        try {
            const prefs = JSON.parse(preferences);
            // Apply preferences
            if (prefs.language) {
                document.documentElement.lang = prefs.language;
            }
            if (prefs.theme) {
                document.documentElement.setAttribute('data-theme', prefs.theme);
            }
        } catch (error) {
            console.error('Error loading preferences:', error);
        }
    }
}

function saveUserPreferences() {
    const preferences = {
        language: document.documentElement.lang,
        theme: document.documentElement.getAttribute('data-theme'),
        timestamp: Date.now()
    };
    
    localStorage.setItem('elyte_preferences', JSON.stringify(preferences));
}

function saveFormData(form) {
    const formData = new FormData(form);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    const savedForms = JSON.parse(localStorage.getItem('elyte_saved_forms') || '[]');
    savedForms.push({
        form: form.id || form.className,
        data: data,
        timestamp: Date.now()
    });
    
    // Keep only last 10 saved forms
    if (savedForms.length > 10) {
        savedForms.shift();
    }
    
    localStorage.setItem('elyte_saved_forms', JSON.stringify(savedForms));
}

// Offline support
function initializeOfflineSupport() {
    // Check online status
    function updateOnlineStatus() {
        const isOnline = navigator.onLine;
        const statusElement = document.querySelector('.online-status');
        
        if (isOnline) {
            document.body.classList.remove('offline');
            showNotification('You are back online!', 'success');
            // Sync offline data
            syncOfflineData();
        } else {
            document.body.classList.add('offline');
            showNotification('You are offline. Some features may be limited.', 'warning');
        }
    }
    
    // Listen for online/offline events
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    // Initial check
    updateOnlineStatus();
}

function syncOfflineData() {
    // Sync saved forms when online
    const savedForms = JSON.parse(localStorage.getItem('elyte_saved_forms') || '[]');
    
    if (savedForms.length > 0) {
        console.log('Syncing offline data...', savedForms);
        // Here you would send the data to your API
        // For now, we'll just clear the saved forms
        localStorage.removeItem('elyte_saved_forms');
    }
}

// Error handling
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    showNotification('An error occurred. Please try again.', 'error');
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
    showNotification('An error occurred. Please try again.', 'error');
});

// Export functions for use in other modules
window.ElyteApp = {
    showNotification,
    validateField,
    validateForm,
    isValidEmail,
    isValidGhanaPhone,
    isValidPassword,
    saveFormData,
    loadUserPreferences,
    saveUserPreferences
};