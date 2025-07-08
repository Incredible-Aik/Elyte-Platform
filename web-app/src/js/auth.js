// Authentication functionality for Elyte Platform

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    // Handle login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const phone = formData.get('phone');
            const password = formData.get('password');
            
            // Validate inputs
            if (!ElyteApp.validateGhanaianPhone(phone)) {
                ElyteApp.showError(this.querySelector('#phone'), 'Please enter a valid Ghanaian phone number');
                return;
            }
            
            if (password.length < 6) {
                ElyteApp.showError(this.querySelector('#password'), 'Password must be at least 6 characters');
                return;
            }
            
            const submitButton = this.querySelector('button[type="submit"]');
            const hideLoading = ElyteApp.showLoading(submitButton);
            
            try {
                const response = await ElyteApp.api.post('/auth/login', {
                    phone: phone,
                    password: password
                });
                
                if (response.success) {
                    // Store auth token
                    ElyteApp.storage.set('authToken', response.token);
                    ElyteApp.storage.set('user', response.user);
                    
                    ElyteApp.showNotification('Login successful! Redirecting...', 'success');
                    
                    // Redirect based on user type
                    setTimeout(() => {
                        if (response.user.type === 'driver') {
                            window.location.href = 'driver-dashboard.html';
                        } else {
                            window.location.href = 'passenger-dashboard.html';
                        }
                    }, 1500);
                } else {
                    ElyteApp.showNotification(response.message || 'Login failed', 'error');
                }
            } catch (error) {
                console.error('Login error:', error);
                ElyteApp.showNotification('Login failed. Please try again.', 'error');
            } finally {
                hideLoading();
            }
        });
    }
    
    // Handle registration form submission
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const userData = {
                name: formData.get('name'),
                phone: formData.get('phone'),
                email: formData.get('email'),
                password: formData.get('password'),
                confirmPassword: formData.get('confirmPassword'),
                userType: formData.get('userType') || 'passenger'
            };
            
            // Validate inputs
            if (!userData.name || userData.name.length < 2) {
                ElyteApp.showError(this.querySelector('#name'), 'Name must be at least 2 characters');
                return;
            }
            
            if (!ElyteApp.validateGhanaianPhone(userData.phone)) {
                ElyteApp.showError(this.querySelector('#phone'), 'Please enter a valid Ghanaian phone number');
                return;
            }
            
            if (userData.email && !ElyteApp.validateEmail(userData.email)) {
                ElyteApp.showError(this.querySelector('#email'), 'Please enter a valid email address');
                return;
            }
            
            if (userData.password.length < 6) {
                ElyteApp.showError(this.querySelector('#password'), 'Password must be at least 6 characters');
                return;
            }
            
            if (userData.password !== userData.confirmPassword) {
                ElyteApp.showError(this.querySelector('#confirmPassword'), 'Passwords do not match');
                return;
            }
            
            const submitButton = this.querySelector('button[type="submit"]');
            const hideLoading = ElyteApp.showLoading(submitButton);
            
            try {
                const response = await ElyteApp.api.post('/auth/register', userData);
                
                if (response.success) {
                    ElyteApp.showNotification('Registration successful! Please check your phone for verification.', 'success');
                    
                    // Clear form
                    this.reset();
                    
                    // Redirect to verification page or login
                    setTimeout(() => {
                        if (response.requiresVerification) {
                            window.location.href = `verify-phone.html?phone=${encodeURIComponent(userData.phone)}`;
                        } else {
                            window.location.href = 'passenger-login.html';
                        }
                    }, 2000);
                } else {
                    ElyteApp.showNotification(response.message || 'Registration failed', 'error');
                }
            } catch (error) {
                console.error('Registration error:', error);
                ElyteApp.showNotification('Registration failed. Please try again.', 'error');
            } finally {
                hideLoading();
            }
        });
    }
    
    // Handle forgot password form
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const phone = formData.get('phone');
            
            if (!ElyteApp.validateGhanaianPhone(phone)) {
                ElyteApp.showError(this.querySelector('#phone'), 'Please enter a valid Ghanaian phone number');
                return;
            }
            
            const submitButton = this.querySelector('button[type="submit"]');
            const hideLoading = ElyteApp.showLoading(submitButton);
            
            try {
                const response = await ElyteApp.api.post('/auth/forgot-password', { phone });
                
                if (response.success) {
                    ElyteApp.showNotification('Password reset instructions sent to your phone!', 'success');
                    this.reset();
                } else {
                    ElyteApp.showNotification(response.message || 'Failed to send reset instructions', 'error');
                }
            } catch (error) {
                console.error('Forgot password error:', error);
                ElyteApp.showNotification('Failed to send reset instructions. Please try again.', 'error');
            } finally {
                hideLoading();
            }
        });
    }
    
    // Handle phone verification
    const verifyPhoneForm = document.getElementById('verifyPhoneForm');
    if (verifyPhoneForm) {
        verifyPhoneForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const code = formData.get('code');
            const phone = new URLSearchParams(window.location.search).get('phone');
            
            if (!code || code.length !== 6) {
                ElyteApp.showError(this.querySelector('#code'), 'Please enter a valid 6-digit code');
                return;
            }
            
            const submitButton = this.querySelector('button[type="submit"]');
            const hideLoading = ElyteApp.showLoading(submitButton);
            
            try {
                const response = await ElyteApp.api.post('/auth/verify-phone', { 
                    phone, 
                    code 
                });
                
                if (response.success) {
                    ElyteApp.showNotification('Phone verified successfully!', 'success');
                    
                    // Store auth token if provided
                    if (response.token) {
                        ElyteApp.storage.set('authToken', response.token);
                        ElyteApp.storage.set('user', response.user);
                    }
                    
                    setTimeout(() => {
                        window.location.href = 'passenger-login.html';
                    }, 1500);
                } else {
                    ElyteApp.showNotification(response.message || 'Verification failed', 'error');
                }
            } catch (error) {
                console.error('Verification error:', error);
                ElyteApp.showNotification('Verification failed. Please try again.', 'error');
            } finally {
                hideLoading();
            }
        });
        
        // Handle resend code
        const resendButton = document.getElementById('resendCode');
        if (resendButton) {
            resendButton.addEventListener('click', async function() {
                const phone = new URLSearchParams(window.location.search).get('phone');
                
                if (!phone) {
                    ElyteApp.showNotification('Phone number not found', 'error');
                    return;
                }
                
                const hideLoading = ElyteApp.showLoading(this);
                
                try {
                    const response = await ElyteApp.api.post('/auth/resend-code', { phone });
                    
                    if (response.success) {
                        ElyteApp.showNotification('New verification code sent!', 'success');
                        startResendTimer();
                    } else {
                        ElyteApp.showNotification(response.message || 'Failed to resend code', 'error');
                    }
                } catch (error) {
                    console.error('Resend error:', error);
                    ElyteApp.showNotification('Failed to resend code. Please try again.', 'error');
                } finally {
                    hideLoading();
                }
            });
        }
    }
    
    // Resend timer functionality
    function startResendTimer() {
        const resendButton = document.getElementById('resendCode');
        if (!resendButton) return;
        
        let timeLeft = 60;
        resendButton.disabled = true;
        
        const timer = setInterval(() => {
            resendButton.textContent = `Resend in ${timeLeft}s`;
            timeLeft--;
            
            if (timeLeft < 0) {
                clearInterval(timer);
                resendButton.disabled = false;
                resendButton.textContent = 'Resend Code';
            }
        }, 1000);
    }
    
    // Check authentication status
    function checkAuthStatus() {
        const token = ElyteApp.storage.get('authToken');
        const user = ElyteApp.storage.get('user');
        
        if (token && user) {
            // User is logged in, check if they're on the right page
            const currentPage = window.location.pathname;
            const isAuthPage = currentPage.includes('login') || currentPage.includes('register');
            
            if (isAuthPage) {
                // Redirect to appropriate dashboard
                if (user.type === 'driver') {
                    window.location.href = 'driver-dashboard.html';
                } else {
                    window.location.href = 'passenger-dashboard.html';
                }
            }
        }
    }
    
    // Check auth status on page load
    checkAuthStatus();
    
    // Auto-focus on first input
    const firstInput = document.querySelector('input');
    if (firstInput) {
        firstInput.focus();
    }
});

// Logout functionality
function logout() {
    ElyteApp.storage.remove('authToken');
    ElyteApp.storage.remove('user');
    ElyteApp.showNotification('Logged out successfully', 'success');
    
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

// Export logout function
window.logout = logout;