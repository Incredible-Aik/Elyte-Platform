/**
 * AUTHENTICATION JAVASCRIPT
 * Handles login, registration, and authentication flows
 */

// =============================================================================
// AUTHENTICATION UTILITIES
// =============================================================================

class AuthService {
    constructor() {
        this.token = ElyteStorage.get('auth_token');
        this.user = ElyteStorage.get('current_user');
        this.baseURL = ELYTE_CONFIG.API_BASE_URL;
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!this.token && !!this.user;
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        return this.user;
    }

    /**
     * Login user
     */
    async login(credentials) {
        try {
            ElyteLoading.show('Signing you in...');
            
            const response = await ElyteAPI.post('/auth/login', credentials);
            
            if (response.token && response.user) {
                this.token = response.token;
                this.user = response.user;
                
                // Store in localStorage
                ElyteStorage.set('auth_token', this.token);
                ElyteStorage.set('current_user', this.user);
                
                // Set API authorization header
                this.setAuthHeader();
                
                ElyteLoading.hide();
                ElyteToast.success('Login successful!');
                
                // Redirect based on user type
                this.redirectAfterLogin(this.user.userType, this.user.isVerified);
                
                return response;
            }
            
        } catch (error) {
            ElyteLoading.hide();
            ElyteToast.error(error.message || 'Login failed');
            throw error;
        }
    }

    /**
     * Register new user
     */
    async register(userData) {
        try {
            ElyteLoading.show('Creating your account...');
            
            const response = await ElyteAPI.post('/auth/register', userData);
            
            if (response.token && response.user) {
                this.token = response.token;
                this.user = response.user;
                
                // Store in localStorage
                ElyteStorage.set('auth_token', this.token);
                ElyteStorage.set('current_user', this.user);
                
                // Set API authorization header
                this.setAuthHeader();
                
                ElyteLoading.hide();
                ElyteToast.success('Account created successfully!');
                
                // Redirect to verification if needed
                if (!this.user.isVerified) {
                    this.redirectToVerification();
                } else {
                    this.redirectAfterLogin(this.user.userType, true);
                }
                
                return response;
            }
            
        } catch (error) {
            ElyteLoading.hide();
            ElyteToast.error(error.message || 'Registration failed');
            throw error;
        }
    }

    /**
     * Verify OTP
     */
    async verifyOTP(phone, otp, userType = 'passenger') {
        try {
            ElyteLoading.show('Verifying your account...');
            
            const response = await ElyteAPI.post('/auth/verify-otp', {
                phone: ElyteUtils.formatGhanaPhone(phone),
                otp,
                userType
            });
            
            if (response.token && response.user) {
                this.token = response.token;
                this.user = response.user;
                
                // Update stored data
                ElyteStorage.set('auth_token', this.token);
                ElyteStorage.set('current_user', this.user);
                
                ElyteLoading.hide();
                ElyteToast.success('Account verified successfully!');
                
                // Redirect to appropriate dashboard
                this.redirectAfterLogin(this.user.userType, true);
                
                return response;
            }
            
        } catch (error) {
            ElyteLoading.hide();
            ElyteToast.error(error.message || 'Verification failed');
            throw error;
        }
    }

    /**
     * Resend OTP
     */
    async resendOTP(phone, userType = 'passenger') {
        try {
            const response = await ElyteAPI.post('/auth/resend-otp', {
                phone: ElyteUtils.formatGhanaPhone(phone),
                userType
            });
            
            ElyteToast.success('Verification code sent to your phone');
            return response;
            
        } catch (error) {
            ElyteToast.error(error.message || 'Failed to send verification code');
            throw error;
        }
    }

    /**
     * Logout user
     */
    async logout() {
        try {
            // Call logout endpoint if available
            if (this.token) {
                await ElyteAPI.post('/auth/logout');
            }
        } catch (error) {
            console.warn('Logout API call failed:', error);
        } finally {
            // Clear local data
            this.token = null;
            this.user = null;
            ElyteStorage.remove('auth_token');
            ElyteStorage.remove('current_user');
            
            // Redirect to login
            window.location.href = '/login.html';
        }
    }

    /**
     * Set authorization header for API requests
     */
    setAuthHeader() {
        if (this.token) {
            // This would typically be done in your API utility
            // For now, we'll store it for manual inclusion
            ElyteStorage.set('api_auth_header', `Bearer ${this.token}`);
        }
    }

    /**
     * Redirect after successful login
     */
    redirectAfterLogin(userType, isVerified) {
        if (!isVerified) {
            this.redirectToVerification();
            return;
        }

        const dashboardUrls = {
            passenger: '/dashboard-passenger.html',
            driver: '/dashboard-driver.html',
            admin: '/dashboard-admin.html'
        };

        const dashboardUrl = dashboardUrls[userType] || '/dashboard-passenger.html';
        window.location.href = dashboardUrl;
    }

    /**
     * Redirect to verification page
     */
    redirectToVerification() {
        // For now, we'll show a verification modal or redirect to a verification page
        // In a full implementation, you'd have a dedicated verification page
        this.showVerificationModal();
    }

    /**
     * Show verification modal
     */
    showVerificationModal() {
        const modal = document.createElement('div');
        modal.className = 'verification-modal';
        modal.innerHTML = `
            <div class="modal-backdrop">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Verify Your Account</h3>
                        <p>Enter the verification code sent to your phone</p>
                    </div>
                    <form id="verification-form">
                        <div class="form-group">
                            <label for="otp-input">Verification Code</label>
                            <input type="text" id="otp-input" maxlength="6" placeholder="Enter 6-digit code">
                        </div>
                        <div class="form-actions">
                            <button type="button" id="resend-otp">Resend Code</button>
                            <button type="submit">Verify</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Handle verification form
        const form = modal.querySelector('#verification-form');
        const otpInput = modal.querySelector('#otp-input');
        const resendBtn = modal.querySelector('#resend-otp');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const otp = otpInput.value.trim();
            if (otp.length === 6) {
                try {
                    await this.verifyOTP(this.user.phone, otp, this.user.userType);
                    modal.remove();
                } catch (error) {
                    // Error handled in verifyOTP method
                }
            } else {
                ElyteToast.error('Please enter a valid 6-digit code');
            }
        });

        resendBtn.addEventListener('click', async () => {
            try {
                await this.resendOTP(this.user.phone, this.user.userType);
            } catch (error) {
                // Error handled in resendOTP method
            }
        });

        // Focus on input
        otpInput.focus();
    }
}

// Create global auth service instance
const AuthManager = new AuthService();

// =============================================================================
// LOGIN FUNCTIONALITY
// =============================================================================

function initializeLogin() {
    const loginForm = document.getElementById('login-form');
    const ussdLoginBtn = document.getElementById('ussd-login');
    const phoneLoginBtn = document.getElementById('phone-login');
    const forgotPasswordLink = document.getElementById('forgot-password-link');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (ussdLoginBtn) {
        ussdLoginBtn.addEventListener('click', showUSSDInstructions);
    }

    if (phoneLoginBtn) {
        phoneLoginBtn.addEventListener('click', showPhoneLogin);
    }

    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', showForgotPassword);
    }
}

async function handleLogin(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const credentials = {
        emailOrPhone: formData.get('email'),
        password: formData.get('password'),
        userType: detectUserType(formData.get('email'))
    };

    try {
        await AuthManager.login(credentials);
    } catch (error) {
        console.error('Login error:', error);
    }
}

function detectUserType(emailOrPhone) {
    // Simple detection based on common patterns
    // In production, you might want to make this more sophisticated
    if (emailOrPhone.includes('@')) {
        if (emailOrPhone.includes('driver') || emailOrPhone.includes('cabbie')) {
            return 'driver';
        }
        if (emailOrPhone.includes('admin') || emailOrPhone.includes('operator')) {
            return 'admin';
        }
    }
    return 'passenger'; // Default to passenger
}

function showUSSDInstructions() {
    const ussdInfo = document.getElementById('ussd-instructions');
    const hideBtn = document.getElementById('hide-ussd');

    if (ussdInfo) {
        ussdInfo.classList.remove('hidden');
        
        if (hideBtn) {
            hideBtn.addEventListener('click', () => {
                ussdInfo.classList.add('hidden');
            });
        }
    }
}

function showPhoneLogin() {
    // Implementation for SMS-based login
    ElyteToast.info('SMS login feature coming soon!');
}

function showForgotPassword() {
    // Implementation for forgot password
    const modal = document.createElement('div');
    modal.className = 'forgot-password-modal';
    modal.innerHTML = `
        <div class="modal-backdrop">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Reset Password</h3>
                    <p>Enter your email or phone number to receive a reset code</p>
                </div>
                <form id="forgot-password-form">
                    <div class="form-group">
                        <label for="reset-email">Email or Phone Number</label>
                        <input type="text" id="reset-email" placeholder="Enter email or phone" required>
                    </div>
                    <div class="form-actions">
                        <button type="button" id="cancel-reset">Cancel</button>
                        <button type="submit">Send Reset Code</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const form = modal.querySelector('#forgot-password-form');
    const cancelBtn = modal.querySelector('#cancel-reset');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailOrPhone = form.querySelector('#reset-email').value;
        
        try {
            ElyteLoading.show('Sending reset code...');
            await ElyteAPI.post('/auth/forgot-password', { emailOrPhone });
            ElyteLoading.hide();
            ElyteToast.success('Reset code sent to your email/phone');
            modal.remove();
        } catch (error) {
            ElyteLoading.hide();
            ElyteToast.error(error.message || 'Failed to send reset code');
        }
    });

    cancelBtn.addEventListener('click', () => {
        modal.remove();
    });
}

// =============================================================================
// SIGNUP FUNCTIONALITY
// =============================================================================

function initializePassengerSignup() {
    const signupForm = document.getElementById('passenger-signup-form');
    
    if (signupForm) {
        initializeMultiStepForm(signupForm);
        signupForm.addEventListener('submit', handlePassengerSignup);
    }

    // Initialize password strength checker
    initializePasswordStrength();
}

function initializeMultiStepForm(form) {
    const steps = form.querySelectorAll('.form-step');
    const progressSteps = document.querySelectorAll('.progress-indicator .step');
    const nextButtons = form.querySelectorAll('.next-step');
    const prevButtons = form.querySelectorAll('.prev-step');

    let currentStep = 1;

    nextButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (validateCurrentStep(form, currentStep)) {
                showStep(currentStep + 1);
            }
        });
    });

    prevButtons.forEach(button => {
        button.addEventListener('click', () => {
            showStep(currentStep - 1);
        });
    });

    function showStep(stepNumber) {
        if (stepNumber < 1 || stepNumber > steps.length) return;

        // Hide all steps
        steps.forEach(step => step.classList.remove('active'));
        progressSteps.forEach(step => step.classList.remove('active', 'completed'));

        // Show current step
        const currentStepElement = form.querySelector(`[data-step="${stepNumber}"]`);
        if (currentStepElement) {
            currentStepElement.classList.add('active');
        }

        // Update progress indicator
        progressSteps.forEach((step, index) => {
            if (index < stepNumber - 1) {
                step.classList.add('completed');
            } else if (index === stepNumber - 1) {
                step.classList.add('active');
            }
        });

        currentStep = stepNumber;
    }

    function validateCurrentStep(form, stepNumber) {
        const currentStepElement = form.querySelector(`[data-step="${stepNumber}"]`);
        if (!currentStepElement) return false;

        const fields = currentStepElement.querySelectorAll('input, select, textarea');
        let isValid = true;

        fields.forEach(field => {
            if (!ElyteFormValidator.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }
}

function initializePasswordStrength() {
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const strengthIndicator = document.getElementById('password-strength');

    if (passwordInput && strengthIndicator) {
        passwordInput.addEventListener('input', () => {
            const strength = calculatePasswordStrength(passwordInput.value);
            updatePasswordStrengthDisplay(strengthIndicator, strength);
        });
    }

    if (confirmPasswordInput && passwordInput) {
        confirmPasswordInput.addEventListener('input', () => {
            validatePasswordMatch(passwordInput.value, confirmPasswordInput.value);
        });
    }
}

function calculatePasswordStrength(password) {
    if (!password) return { score: 0, text: '' };

    let score = 0;
    let text = '';

    // Length check
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;

    // Character variety
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    // Determine strength
    if (score < 3) {
        text = 'Weak';
    } else if (score < 5) {
        text = 'Medium';
    } else {
        text = 'Strong';
    }

    return { score, text };
}

function updatePasswordStrengthDisplay(indicator, strength) {
    const strengthBar = indicator.querySelector('.password-strength-fill');
    const strengthText = indicator.querySelector('.password-strength-text');

    if (!strengthBar) {
        // Create strength indicator if it doesn't exist
        indicator.innerHTML = `
            <div class="password-strength-bar">
                <div class="password-strength-fill"></div>
            </div>
            <span class="password-strength-text"></span>
        `;
    }

    const bar = indicator.querySelector('.password-strength-fill');
    const text = indicator.querySelector('.password-strength-text');

    // Remove existing classes
    bar.classList.remove('weak', 'medium', 'strong');
    
    // Add appropriate class
    if (strength.text) {
        bar.classList.add(strength.text.toLowerCase());
        text.textContent = strength.text;
    }
}

function validatePasswordMatch(password, confirmPassword) {
    const confirmField = document.getElementById('confirmPassword');
    const fieldGroup = confirmField.closest('.form-group');

    if (password && confirmPassword && password !== confirmPassword) {
        ElyteFormValidator.showFieldValidation(confirmField, false, 'Passwords do not match');
    } else if (password && confirmPassword && password === confirmPassword) {
        ElyteFormValidator.showFieldValidation(confirmField, true, '');
    }
}

async function handlePassengerSignup(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const userData = {
        email: formData.get('email'),
        phone: ElyteUtils.formatGhanaPhone(formData.get('phone')),
        password: formData.get('password'),
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        dateOfBirth: formData.get('dateOfBirth'),
        gender: formData.get('gender'),
        city: formData.get('city'),
        address: formData.get('address'),
        mobileMoneyProvider: formData.get('mobileMoneyProvider'),
        userType: 'passenger'
    };

    // Validate password confirmation
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    
    if (password !== confirmPassword) {
        ElyteToast.error('Passwords do not match');
        return;
    }

    try {
        await AuthManager.register(userData);
    } catch (error) {
        console.error('Registration error:', error);
    }
}

// =============================================================================
// AUTO-INITIALIZATION
// =============================================================================

// Initialize authentication when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already authenticated
    if (AuthManager.isAuthenticated()) {
        const currentPage = window.location.pathname;
        const authPages = ['/login.html', '/signup-passenger.html', '/signup-driver.html', '/signup-admin.html'];
        
        if (authPages.some(page => currentPage.includes(page))) {
            // User is authenticated but on auth page, redirect to dashboard
            AuthManager.redirectAfterLogin(AuthManager.user.userType, AuthManager.user.isVerified);
        }
    }

    // Set auth header if token exists
    if (AuthManager.token) {
        AuthManager.setAuthHeader();
    }
});

// Export for global use
window.AuthManager = AuthManager;
window.initializeLogin = initializeLogin;
window.initializePassengerSignup = initializePassengerSignup;