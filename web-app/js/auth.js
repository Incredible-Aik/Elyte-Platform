// Authentication JavaScript - Handle login, signup, and user management

// Wait for DOM to be loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeAuth();
    console.log('Authentication system initialized');
});

// Initialize authentication system
function initializeAuth() {
    // Check for existing session
    checkAuthStatus();
    
    // Initialize login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        initializeLoginForm(loginForm);
    }
    
    // Initialize signup forms
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        initializeSignupForm(signupForm);
    }
    
    // Initialize forgot password
    initializeForgotPassword();
    
    // Initialize password toggle
    initializePasswordToggle();
    
    // Initialize file uploads
    initializeFileUploads();
}

// Check authentication status
function checkAuthStatus() {
    const userData = localStorage.getItem('elyte_user');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            // Check if session is still valid
            if (user.expires && Date.now() < user.expires) {
                // User is logged in, redirect to dashboard if on auth pages
                if (window.location.pathname.includes('login.html') || 
                    window.location.pathname.includes('signup-')) {
                    redirectToDashboard(user.type);
                }
            } else {
                // Session expired, clear storage
                localStorage.removeItem('elyte_user');
                localStorage.removeItem('elyte_session');
            }
        } catch (error) {
            console.error('Error checking auth status:', error);
            localStorage.removeItem('elyte_user');
            localStorage.removeItem('elyte_session');
        }
    }
}

// Initialize login form
function initializeLoginForm(form) {
    const passwordToggle = form.querySelector('.password-toggle');
    const passwordInput = form.querySelector('#password');
    const forgotPasswordLink = form.querySelector('.forgot-password-link');
    
    // Password toggle functionality
    if (passwordToggle && passwordInput) {
        passwordToggle.addEventListener('click', function() {
            togglePasswordVisibility(passwordInput, this);
        });
    }
    
    // Forgot password modal
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            showForgotPasswordModal();
        });
    }
    
    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        handleLogin(this);
    });
    
    // User type selection enhancement
    const userTypeSelect = form.querySelector('#userType');
    if (userTypeSelect) {
        userTypeSelect.addEventListener('change', function() {
            updateLoginFormForUserType(this.value);
        });
    }
}

// Initialize signup form
function initializeSignupForm(form) {
    const passwordInputs = form.querySelectorAll('input[type="password"]');
    const passwordToggles = form.querySelectorAll('.password-toggle');
    
    // Password toggle functionality
    passwordToggles.forEach((toggle, index) => {
        const passwordInput = passwordInputs[index];
        if (passwordInput) {
            toggle.addEventListener('click', function() {
                togglePasswordVisibility(passwordInput, this);
            });
        }
    });
    
    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        handleSignup(this);
    });
    
    // Real-time password validation
    const passwordField = form.querySelector('#password');
    const confirmPasswordField = form.querySelector('#confirmPassword');
    
    if (passwordField) {
        passwordField.addEventListener('input', function() {
            validatePasswordStrength(this);
        });
    }
    
    if (confirmPasswordField) {
        confirmPasswordField.addEventListener('input', function() {
            validatePasswordMatch(passwordField, this);
        });
    }
    
    // Phone number formatting
    const phoneInputs = form.querySelectorAll('input[type="tel"]');
    phoneInputs.forEach(input => {
        input.addEventListener('input', function() {
            formatGhanaPhoneNumber(this);
        });
    });
}

// Initialize forgot password functionality
function initializeForgotPassword() {
    const modal = document.getElementById('forgotPasswordModal');
    const closeButton = modal?.querySelector('.modal-close');
    const form = modal?.querySelector('#forgotPasswordForm');
    
    if (closeButton) {
        closeButton.addEventListener('click', function() {
            hideForgotPasswordModal();
        });
    }
    
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                hideForgotPasswordModal();
            }
        });
    }
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            handleForgotPassword(this);
        });
    }
}

// Initialize password toggle
function initializePasswordToggle() {
    const passwordToggles = document.querySelectorAll('.password-toggle');
    
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const passwordInput = this.parentElement.querySelector('input[type="password"], input[type="text"]');
            if (passwordInput) {
                togglePasswordVisibility(passwordInput, this);
            }
        });
    });
}

// Initialize file uploads
function initializeFileUploads() {
    const fileInputs = document.querySelectorAll('.file-upload-input');
    
    fileInputs.forEach(input => {
        const button = input.parentElement.querySelector('.file-upload-button');
        const textElement = button?.querySelector('.file-upload-text');
        
        if (button) {
            button.addEventListener('click', function() {
                input.click();
            });
        }
        
        input.addEventListener('change', function() {
            const file = this.files[0];
            if (file && textElement) {
                textElement.textContent = file.name;
                button.classList.add('has-file');
            } else if (textElement) {
                textElement.textContent = 'Click to upload or drag and drop';
                button.classList.remove('has-file');
            }
        });
        
        // Drag and drop functionality
        if (button) {
            button.addEventListener('dragover', function(e) {
                e.preventDefault();
                this.classList.add('dragover');
            });
            
            button.addEventListener('dragleave', function(e) {
                e.preventDefault();
                this.classList.remove('dragover');
            });
            
            button.addEventListener('drop', function(e) {
                e.preventDefault();
                this.classList.remove('dragover');
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    input.files = files;
                    const changeEvent = new Event('change');
                    input.dispatchEvent(changeEvent);
                }
            });
        }
    });
}

// Handle login
function handleLogin(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Validate form
    if (!validateLoginForm(form)) {
        return;
    }
    
    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Signing In...';
    submitButton.disabled = true;
    submitButton.classList.add('loading');
    
    // Simulate API call (replace with actual API integration)
    setTimeout(() => {
        // Mock successful login
        const userData = {
            id: generateUserId(),
            email: data.email,
            type: data.userType,
            name: generateUserName(data.email),
            expires: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
            loginTime: Date.now(),
            rememberMe: data.rememberMe === 'on'
        };
        
        // Store user data
        localStorage.setItem('elyte_user', JSON.stringify(userData));
        localStorage.setItem('elyte_session', JSON.stringify({
            sessionId: generateSessionId(),
            loginTime: userData.loginTime,
            expires: userData.expires
        }));
        
        // Show success message
        showNotification('Login successful! Redirecting to dashboard...', 'success');
        
        // Redirect to dashboard
        setTimeout(() => {
            redirectToDashboard(userData.type);
        }, 1500);
        
    }, 2000);
}

// Handle signup
function handleSignup(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Validate form
    if (!validateSignupForm(form)) {
        return;
    }
    
    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Creating Account...';
    submitButton.disabled = true;
    submitButton.classList.add('loading');
    
    // Simulate API call (replace with actual API integration)
    setTimeout(() => {
        // Mock successful signup
        const userData = {
            id: generateUserId(),
            email: data.email,
            type: getUserTypeFromPath(),
            name: `${data.firstName} ${data.lastName}` || data.fullName,
            expires: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
            loginTime: Date.now(),
            isNewUser: true
        };
        
        // Store user data
        localStorage.setItem('elyte_user', JSON.stringify(userData));
        localStorage.setItem('elyte_session', JSON.stringify({
            sessionId: generateSessionId(),
            loginTime: userData.loginTime,
            expires: userData.expires
        }));
        
        // Show success message
        showNotification('Account created successfully! Redirecting to dashboard...', 'success');
        
        // Redirect to dashboard
        setTimeout(() => {
            redirectToDashboard(userData.type);
        }, 1500);
        
    }, 3000);
}

// Handle forgot password
function handleForgotPassword(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Validate form
    if (!validateForgotPasswordForm(form)) {
        return;
    }
    
    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Sending...';
    submitButton.disabled = true;
    submitButton.classList.add('loading');
    
    // Simulate API call
    setTimeout(() => {
        // Reset button
        submitButton.textContent = originalText;
        submitButton.disabled = false;
        submitButton.classList.remove('loading');
        
        // Show success message
        showNotification('Password reset link sent to your email!', 'success');
        
        // Close modal
        hideForgotPasswordModal();
        
        // Reset form
        form.reset();
    }, 2000);
}

// Toggle password visibility
function togglePasswordVisibility(input, button) {
    const icon = button.querySelector('.password-toggle-icon');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.textContent = '🙈';
        button.setAttribute('aria-label', 'Hide password');
    } else {
        input.type = 'password';
        icon.textContent = '👁️';
        button.setAttribute('aria-label', 'Show password');
    }
}

// Show forgot password modal
function showForgotPasswordModal() {
    const modal = document.getElementById('forgotPasswordModal');
    if (modal) {
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
        
        // Focus on first input
        const firstInput = modal.querySelector('input');
        if (firstInput) {
            firstInput.focus();
        }
    }
}

// Hide forgot password modal
function hideForgotPasswordModal() {
    const modal = document.getElementById('forgotPasswordModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
}

// Validate login form
function validateLoginForm(form) {
    const userType = form.querySelector('#userType').value;
    const email = form.querySelector('#email').value;
    const password = form.querySelector('#password').value;
    
    let isValid = true;
    
    if (!userType) {
        showFieldError(form.querySelector('#userType'), 'Please select your role');
        isValid = false;
    }
    
    if (!email || !window.ElyteApp.isValidEmail(email)) {
        showFieldError(form.querySelector('#email'), 'Please enter a valid email address');
        isValid = false;
    }
    
    if (!password) {
        showFieldError(form.querySelector('#password'), 'Please enter your password');
        isValid = false;
    }
    
    return isValid;
}

// Validate signup form
function validateSignupForm(form) {
    const inputs = form.querySelectorAll('input[required], select[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!window.ElyteApp.validateField(input)) {
            isValid = false;
        }
    });
    
    return isValid;
}

// Validate forgot password form
function validateForgotPasswordForm(form) {
    const email = form.querySelector('#resetEmail').value;
    const userType = form.querySelector('#resetUserType').value;
    
    let isValid = true;
    
    if (!email || !window.ElyteApp.isValidEmail(email)) {
        showFieldError(form.querySelector('#resetEmail'), 'Please enter a valid email address');
        isValid = false;
    }
    
    if (!userType) {
        showFieldError(form.querySelector('#resetUserType'), 'Please select your account type');
        isValid = false;
    }
    
    return isValid;
}

// Validate password strength
function validatePasswordStrength(input) {
    const password = input.value;
    const strengthIndicator = input.parentElement.querySelector('.password-strength');
    
    let strength = 0;
    let feedback = [];
    
    if (password.length >= 8) strength++;
    else feedback.push('At least 8 characters');
    
    if (/[A-Z]/.test(password)) strength++;
    else feedback.push('One uppercase letter');
    
    if (/[a-z]/.test(password)) strength++;
    else feedback.push('One lowercase letter');
    
    if (/\d/.test(password)) strength++;
    else feedback.push('One number');
    
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
    else feedback.push('One special character');
    
    // Create or update strength indicator
    if (!strengthIndicator) {
        const indicator = document.createElement('div');
        indicator.className = 'password-strength';
        input.parentElement.appendChild(indicator);
    }
    
    const indicator = input.parentElement.querySelector('.password-strength');
    const strengthLevels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    const strengthColors = ['#ff4757', '#ff6b7a', '#ffa502', '#2ed573', '#20bf6b'];
    
    indicator.innerHTML = `
        <div class="strength-bar">
            <div class="strength-fill" style="width: ${(strength / 5) * 100}%; background-color: ${strengthColors[strength - 1] || '#ddd'}"></div>
        </div>
        <div class="strength-text">${strengthLevels[strength - 1] || 'Very Weak'}</div>
        ${feedback.length > 0 ? `<div class="strength-feedback">Missing: ${feedback.join(', ')}</div>` : ''}
    `;
}

// Validate password match
function validatePasswordMatch(passwordField, confirmField) {
    const password = passwordField.value;
    const confirmPassword = confirmField.value;
    
    if (confirmPassword && password !== confirmPassword) {
        showFieldError(confirmField, 'Passwords do not match');
        return false;
    } else {
        clearFieldError(confirmField);
        return true;
    }
}

// Format Ghana phone number
function formatGhanaPhoneNumber(input) {
    let value = input.value.replace(/\D/g, '');
    
    // Add Ghana country code if not present
    if (value.length === 9 && !value.startsWith('233')) {
        value = '233' + value;
    }
    
    // Remove leading zero if present after country code
    if (value.startsWith('2330')) {
        value = '233' + value.substring(4);
    }
    
    // Format the number
    if (value.length >= 3) {
        if (value.startsWith('233')) {
            value = '+233 ' + value.substring(3);
        } else if (value.startsWith('0')) {
            value = value.substring(1);
            value = '+233 ' + value;
        }
    }
    
    input.value = value;
}

// Update login form for user type
function updateLoginFormForUserType(userType) {
    const form = document.querySelector('#loginForm');
    if (!form) return;
    
    // You can customize the form based on user type
    // For example, show different fields or validation rules
    
    // Add user type specific styling
    form.className = `login-form login-form-${userType}`;
}

// Utility functions
function generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function generateUserName(email) {
    return email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
}

function getUserTypeFromPath() {
    const path = window.location.pathname;
    if (path.includes('passenger')) return 'passenger';
    if (path.includes('driver')) return 'driver';
    if (path.includes('admin')) return 'admin';
    return 'passenger';
}

function redirectToDashboard(userType) {
    const dashboardUrls = {
        passenger: 'dashboard-passenger.html',
        driver: 'dashboard-driver.html',
        admin: 'dashboard-admin.html'
    };
    
    const url = dashboardUrls[userType] || 'dashboard-passenger.html';
    window.location.href = url;
}

function showFieldError(field, message) {
    // Clear existing error
    clearFieldError(field);
    
    // Add error class
    field.classList.add('error');
    
    // Create error message
    const errorElement = document.createElement('div');
    errorElement.className = 'form-error';
    errorElement.textContent = message;
    
    // Insert error message
    field.parentElement.appendChild(errorElement);
}

function clearFieldError(field) {
    field.classList.remove('error');
    const errorElement = field.parentElement.querySelector('.form-error');
    if (errorElement) {
        errorElement.remove();
    }
}

function showNotification(message, type) {
    if (window.ElyteApp && window.ElyteApp.showNotification) {
        window.ElyteApp.showNotification(message, type);
    }
}

// Logout function
function logout() {
    localStorage.removeItem('elyte_user');
    localStorage.removeItem('elyte_session');
    showNotification('Logged out successfully', 'success');
    window.location.href = 'index.html';
}

// Check if user is authenticated
function isAuthenticated() {
    const userData = localStorage.getItem('elyte_user');
    if (!userData) return false;
    
    try {
        const user = JSON.parse(userData);
        return user.expires && Date.now() < user.expires;
    } catch (error) {
        return false;
    }
}

// Get current user
function getCurrentUser() {
    const userData = localStorage.getItem('elyte_user');
    if (!userData) return null;
    
    try {
        const user = JSON.parse(userData);
        if (user.expires && Date.now() < user.expires) {
            return user;
        }
    } catch (error) {
        console.error('Error getting current user:', error);
    }
    
    return null;
}

// Export functions for global use
window.ElyteAuth = {
    logout,
    isAuthenticated,
    getCurrentUser,
    redirectToDashboard
};