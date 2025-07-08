/**
 * ELYTE PLATFORM - MAIN JAVASCRIPT
 * Ghana's Premier Ride-Sharing Platform
 * 
 * This file contains core functionality used across the platform
 */

// =============================================================================
// GLOBAL CONSTANTS AND CONFIGURATION
// =============================================================================

const ELYTE_CONFIG = {
    API_BASE_URL: '/api',
    USSD_CODE: '*920*123#',
    MOBILE_MONEY_PROVIDERS: ['MTN', 'Vodafone', 'AirtelTigo'],
    GHANA_CITIES: [
        'Accra', 'Kumasi', 'Tamale', 'Cape Coast', 'Sekondi-Takoradi',
        'Sunyani', 'Koforidua', 'Ho', 'Bolgatanga', 'Wa'
    ],
    PHONE_REGEX: /^(\+233|0)[0-9]{9}$/,
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Utility functions for common operations
 */
const Utils = {
    /**
     * Format phone number to Ghana standard
     * @param {string} phone - Phone number to format
     * @returns {string} Formatted phone number
     */
    formatGhanaPhone(phone) {
        if (!phone) return '';
        
        // Remove all non-digits
        const cleaned = phone.replace(/\D/g, '');
        
        // Handle different formats
        if (cleaned.startsWith('233')) {
            return '+' + cleaned;
        } else if (cleaned.startsWith('0') && cleaned.length === 10) {
            return '+233' + cleaned.substring(1);
        } else if (cleaned.length === 9) {
            return '+233' + cleaned;
        }
        
        return phone; // Return original if can't format
    },

    /**
     * Validate Ghana phone number
     * @param {string} phone - Phone number to validate
     * @returns {boolean} True if valid
     */
    isValidGhanaPhone(phone) {
        return ELYTE_CONFIG.PHONE_REGEX.test(phone);
    },

    /**
     * Validate email address
     * @param {string} email - Email to validate
     * @returns {boolean} True if valid
     */
    isValidEmail(email) {
        return ELYTE_CONFIG.EMAIL_REGEX.test(email);
    },

    /**
     * Format currency in Ghana Cedis
     * @param {number} amount - Amount to format
     * @returns {string} Formatted currency
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-GH', {
            style: 'currency',
            currency: 'GHS',
            minimumFractionDigits: 2
        }).format(amount);
    },

    /**
     * Get current Ghana time
     * @returns {string} Formatted time string
     */
    getGhanaTime() {
        return new Date().toLocaleString('en-GB', {
            timeZone: 'GMT',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    /**
     * Generate unique ID
     * @returns {string} Unique identifier
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    /**
     * Debounce function calls
     * @param {Function} func - Function to debounce
     * @param {number} delay - Delay in milliseconds
     * @returns {Function} Debounced function
     */
    debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    },

    /**
     * Throttle function calls
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in milliseconds
     * @returns {Function} Throttled function
     */
    throttle(func, limit) {
        let inThrottle;
        return function (...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

// =============================================================================
// TOAST NOTIFICATION SYSTEM
// =============================================================================

/**
 * Toast notification system for user feedback
 */
const Toast = {
    /**
     * Show a toast notification
     * @param {string} message - Message to display
     * @param {string} type - Type of toast (success, error, warning, info)
     * @param {number} duration - Duration in milliseconds
     */
    show(message, type = 'info', duration = 5000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">${this.getIcon(type)}</span>
                <span class="toast-message">${message}</span>
                <button class="toast-close" aria-label="Close">×</button>
            </div>
        `;

        document.body.appendChild(toast);

        // Show the toast
        setTimeout(() => toast.classList.remove('hidden'), 100);

        // Auto-hide after duration
        const autoHide = setTimeout(() => this.hide(toast), duration);

        // Manual close
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            clearTimeout(autoHide);
            this.hide(toast);
        });

        return toast;
    },

    /**
     * Hide a toast notification
     * @param {HTMLElement} toast - Toast element to hide
     */
    hide(toast) {
        toast.classList.add('hidden');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    },

    /**
     * Get icon for toast type
     * @param {string} type - Toast type
     * @returns {string} Icon character
     */
    getIcon(type) {
        const icons = {
            success: '✅',
            error: '⚠️',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    },

    // Convenience methods
    success(message, duration) {
        return this.show(message, 'success', duration);
    },

    error(message, duration) {
        return this.show(message, 'error', duration);
    },

    warning(message, duration) {
        return this.show(message, 'warning', duration);
    },

    info(message, duration) {
        return this.show(message, 'info', duration);
    }
};

// =============================================================================
// LOADING SYSTEM
// =============================================================================

/**
 * Loading overlay system
 */
const Loading = {
    overlay: null,

    /**
     * Show loading overlay
     * @param {string} message - Loading message
     */
    show(message = 'Loading...') {
        if (this.overlay) return; // Already showing

        this.overlay = document.createElement('div');
        this.overlay.id = 'loading-overlay';
        this.overlay.className = 'loading-overlay';
        this.overlay.innerHTML = `
            <div class="spinner"></div>
            <p>${message}</p>
        `;

        document.body.appendChild(this.overlay);
        document.body.style.overflow = 'hidden';
    },

    /**
     * Hide loading overlay
     */
    hide() {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
            document.body.style.overflow = '';
        }
    },

    /**
     * Show loading for a specific duration
     * @param {string} message - Loading message
     * @param {number} duration - Duration in milliseconds
     */
    showFor(message, duration) {
        this.show(message);
        setTimeout(() => this.hide(), duration);
    }
};

// =============================================================================
// MOBILE MENU FUNCTIONALITY
// =============================================================================

/**
 * Mobile navigation menu
 */
const MobileMenu = {
    isOpen: false,
    toggle: null,
    menu: null,

    /**
     * Initialize mobile menu
     */
    init() {
        this.toggle = document.querySelector('.mobile-menu-toggle');
        this.menu = document.querySelector('.nav-menu');

        if (this.toggle) {
            this.toggle.addEventListener('click', () => this.toggleMenu());
        }

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isOpen && !this.toggle.contains(e.target) && !this.menu.contains(e.target)) {
                this.closeMenu();
            }
        });

        // Close menu on window resize if larger than mobile
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && this.isOpen) {
                this.closeMenu();
            }
        });
    },

    /**
     * Toggle mobile menu
     */
    toggleMenu() {
        if (this.isOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    },

    /**
     * Open mobile menu
     */
    openMenu() {
        this.menu.classList.add('mobile-open');
        this.toggle.classList.add('open');
        document.body.style.overflow = 'hidden';
        this.isOpen = true;
    },

    /**
     * Close mobile menu
     */
    closeMenu() {
        this.menu.classList.remove('mobile-open');
        this.toggle.classList.remove('open');
        document.body.style.overflow = '';
        this.isOpen = false;
    }
};

// =============================================================================
// SMOOTH SCROLLING FOR ANCHOR LINKS
// =============================================================================

/**
 * Smooth scrolling functionality
 */
const SmoothScroll = {
    /**
     * Initialize smooth scrolling
     */
    init() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = anchor.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);

                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });

                    // Close mobile menu if open
                    if (MobileMenu.isOpen) {
                        MobileMenu.closeMenu();
                    }
                }
            });
        });
    }
};

// =============================================================================
// FORM VALIDATION UTILITIES
// =============================================================================

/**
 * Form validation utilities
 */
const FormValidator = {
    /**
     * Validate a form field
     * @param {HTMLElement} field - Form field to validate
     * @returns {boolean} True if valid
     */
    validateField(field) {
        const value = field.value.trim();
        const type = field.type;
        const name = field.name;
        let isValid = true;
        let errorMessage = '';

        // Check required fields
        if (field.required && !value) {
            isValid = false;
            errorMessage = 'This field is required';
        }
        // Email validation
        else if (type === 'email' && value && !Utils.isValidEmail(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid email address';
        }
        // Phone validation for Ghana
        else if ((type === 'tel' || name === 'phone') && value && !Utils.isValidGhanaPhone(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid Ghana phone number';
        }
        // Password strength (if it's a password field)
        else if (type === 'password' && value && value.length < 6) {
            isValid = false;
            errorMessage = 'Password must be at least 6 characters long';
        }

        this.showFieldValidation(field, isValid, errorMessage);
        return isValid;
    },

    /**
     * Show field validation status
     * @param {HTMLElement} field - Form field
     * @param {boolean} isValid - Validation status
     * @param {string} message - Error message
     */
    showFieldValidation(field, isValid, message) {
        const fieldGroup = field.closest('.form-group');
        if (!fieldGroup) return;

        // Remove existing validation
        const existingError = fieldGroup.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }

        fieldGroup.classList.remove('field-valid', 'field-invalid');

        if (!isValid && message) {
            fieldGroup.classList.add('field-invalid');
            const errorDiv = document.createElement('div');
            errorDiv.className = 'field-error';
            errorDiv.textContent = message;
            fieldGroup.appendChild(errorDiv);
        } else if (isValid && field.value.trim()) {
            fieldGroup.classList.add('field-valid');
        }
    },

    /**
     * Validate entire form
     * @param {HTMLFormElement} form - Form to validate
     * @returns {boolean} True if form is valid
     */
    validateForm(form) {
        const fields = form.querySelectorAll('input, textarea, select');
        let isFormValid = true;

        fields.forEach(field => {
            if (!this.validateField(field)) {
                isFormValid = false;
            }
        });

        return isFormValid;
    }
};

// =============================================================================
// API COMMUNICATION
// =============================================================================

/**
 * API communication utilities
 */
const API = {
    /**
     * Make an API request
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Request options
     * @returns {Promise} API response
     */
    async request(endpoint, options = {}) {
        const url = `${ELYTE_CONFIG.API_BASE_URL}${endpoint}`;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const mergedOptions = { ...defaultOptions, ...options };

        try {
            const response = await fetch(url, mergedOptions);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'API request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    /**
     * GET request
     * @param {string} endpoint - API endpoint
     * @returns {Promise} API response
     */
    get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },

    /**
     * POST request
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request data
     * @returns {Promise} API response
     */
    post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /**
     * PUT request
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request data
     * @returns {Promise} API response
     */
    put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    /**
     * DELETE request
     * @param {string} endpoint - API endpoint
     * @returns {Promise} API response
     */
    delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
};

// =============================================================================
// LOCAL STORAGE UTILITIES
// =============================================================================

/**
 * Local storage utilities
 */
const Storage = {
    /**
     * Set item in localStorage
     * @param {string} key - Storage key
     * @param {any} value - Value to store
     */
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('Storage set error:', error);
        }
    },

    /**
     * Get item from localStorage
     * @param {string} key - Storage key
     * @param {any} defaultValue - Default value if not found
     * @returns {any} Stored value or default
     */
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Storage get error:', error);
            return defaultValue;
        }
    },

    /**
     * Remove item from localStorage
     * @param {string} key - Storage key
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Storage remove error:', error);
        }
    },

    /**
     * Clear all localStorage
     */
    clear() {
        try {
            localStorage.clear();
        } catch (error) {
            console.error('Storage clear error:', error);
        }
    }
};

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initialize the application
 */
function initializeApp() {
    // Initialize mobile menu
    MobileMenu.init();
    
    // Initialize smooth scrolling
    SmoothScroll.init();
    
    // Initialize form validation
    initializeFormValidation();
    
    // Initialize method toggle (for how-it-works section)
    initializeMethodToggle();
    
    // Initialize password toggles
    initializePasswordToggles();
    
    console.log('Elyte Platform initialized successfully');
}

/**
 * Initialize form validation for all forms
 */
function initializeFormValidation() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        const fields = form.querySelectorAll('input, textarea, select');
        
        fields.forEach(field => {
            // Validate on blur
            field.addEventListener('blur', () => {
                FormValidator.validateField(field);
            });
            
            // Clear validation on input
            field.addEventListener('input', () => {
                const fieldGroup = field.closest('.form-group');
                if (fieldGroup) {
                    fieldGroup.classList.remove('field-valid', 'field-invalid');
                    const existingError = fieldGroup.querySelector('.field-error');
                    if (existingError) {
                        existingError.remove();
                    }
                }
            });
        });
        
        // Validate on submit
        form.addEventListener('submit', (e) => {
            if (!FormValidator.validateForm(form)) {
                e.preventDefault();
                Toast.error('Please correct the errors in the form');
            }
        });
    });
}

/**
 * Initialize method toggle for how-it-works section
 */
function initializeMethodToggle() {
    const toggleButtons = document.querySelectorAll('.method-btn');
    const methodContents = document.querySelectorAll('.method-content');
    
    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const method = button.getAttribute('data-method');
            
            // Update active button
            toggleButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update active content
            methodContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${method}-method`) {
                    content.classList.add('active');
                }
            });
        });
    });
}

/**
 * Initialize password toggle functionality
 */
function initializePasswordToggles() {
    const passwordToggles = document.querySelectorAll('.password-toggle');
    
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const passwordInput = toggle.previousElementSibling;
            const isPassword = passwordInput.type === 'password';
            
            passwordInput.type = isPassword ? 'text' : 'password';
            toggle.textContent = isPassword ? '🙈' : '👁️';
        });
    });
}

// =============================================================================
// EVENT LISTENERS
// =============================================================================

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('Page hidden');
    } else {
        console.log('Page visible');
    }
});

// Handle online/offline status
window.addEventListener('online', () => {
    Toast.success('Connection restored');
});

window.addEventListener('offline', () => {
    Toast.warning('You are offline. Some features may not be available.');
});

// =============================================================================
// GLOBAL EXPORTS
// =============================================================================

// Make utilities available globally
window.ElyteUtils = Utils;
window.ElyteToast = Toast;
window.ElyteLoading = Loading;
window.ElyteAPI = API;
window.ElyteStorage = Storage;
window.ElyteFormValidator = FormValidator;

// Export configuration
window.ELYTE_CONFIG = ELYTE_CONFIG;