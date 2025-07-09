// Admin Signup Form JavaScript
class AdminSignupForm {
    constructor() {
        this.form = document.getElementById('adminSignupForm');
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupPasswordValidation();
        this.setupPhoneValidation();
        this.setupFileValidation();
        this.setupSecurityValidation();
        this.setupAccessPermissions();
    }

    setupEventListeners() {
        // Form submission
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Real-time validation
        const inputs = this.form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearError(input));
        });

        // Special validations
        document.getElementById('confirmPassword').addEventListener('input', () => this.validatePasswordMatch());
        document.getElementById('startDate').addEventListener('blur', () => this.validateStartDate());
        document.getElementById('managerEmail').addEventListener('blur', () => this.validateManagerEmail());
    }

    setupPasswordValidation() {
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirmPassword');

        passwordInput.addEventListener('input', () => {
            this.validatePasswordStrength();
            if (confirmPasswordInput.value) {
                this.validatePasswordMatch();
            }
        });

        confirmPasswordInput.addEventListener('input', () => {
            this.validatePasswordMatch();
        });
    }

    setupPhoneValidation() {
        const phoneInput = document.getElementById('phone');
        const managerPhoneInput = document.getElementById('managerPhone');
        const emergencyPhoneInput = document.getElementById('emergencyContactPhone');

        [phoneInput, managerPhoneInput, emergencyPhoneInput].forEach(input => {
            if (input) {
                input.addEventListener('input', (e) => {
                    // Allow only numbers and format Ghana phone numbers
                    let value = e.target.value.replace(/\D/g, '');
                    
                    if (value.startsWith('233')) {
                        value = value.substring(3);
                    }
                    
                    if (value.startsWith('0')) {
                        value = value.substring(1);
                    }
                    
                    // Format as XXX XXX XXX
                    if (value.length > 0) {
                        value = value.match(/.{1,3}/g).join(' ');
                        if (value.length > 11) {
                            value = value.substring(0, 11);
                        }
                    }
                    
                    e.target.value = value;
                });
            }
        });
    }

    setupFileValidation() {
        const fileInputs = this.form.querySelectorAll('input[type="file"]');
        fileInputs.forEach(input => {
            input.addEventListener('change', (e) => this.validateFile(e.target));
        });
    }

    setupSecurityValidation() {
        const securityQuestion1 = document.getElementById('securityQuestion1');
        const securityQuestion2 = document.getElementById('securityQuestion2');

        securityQuestion1.addEventListener('change', () => {
            this.validateSecurityQuestions();
        });

        securityQuestion2.addEventListener('change', () => {
            this.validateSecurityQuestions();
        });
    }

    setupAccessPermissions() {
        const roleSelect = document.getElementById('adminRole');
        const systemAccessCheckboxes = this.form.querySelectorAll('input[name="systemAccess"]');
        const dataAccessCheckboxes = this.form.querySelectorAll('input[name="dataAccess"]');

        roleSelect.addEventListener('change', () => {
            this.updateAccessBasedOnRole();
            this.validateAccessPermissions();
        });

        [...systemAccessCheckboxes, ...dataAccessCheckboxes].forEach(checkbox => {
            checkbox.addEventListener('change', () => this.validateAccessPermissions());
        });
    }

    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name;
        let isValid = true;
        let message = '';

        // Required field validation
        if (field.hasAttribute('required') && !value) {
            isValid = false;
            message = 'This field is required';
        }

        // Specific field validations
        switch (fieldName) {
            case 'email':
            case 'managerEmail':
                if (value && !this.isValidEmail(value)) {
                    isValid = false;
                    message = 'Please enter a valid email address';
                }
                break;

            case 'phone':
            case 'managerPhone':
            case 'emergencyContactPhone':
                if (value && !this.isValidGhanaPhone(value)) {
                    isValid = false;
                    message = 'Please enter a valid Ghana phone number';
                }
                break;

            case 'firstName':
            case 'lastName':
            case 'reportingManager':
            case 'emergencyContactName':
                if (value && !this.isValidName(value)) {
                    isValid = false;
                    message = 'Please enter a valid name (letters only)';
                }
                break;

            case 'employeeId':
                if (value && !this.isValidEmployeeId(value)) {
                    isValid = false;
                    message = 'Employee ID format: EMP-XXXX (e.g., EMP-1234)';
                }
                break;

            case 'password':
                if (value && !this.isValidPassword(value)) {
                    isValid = false;
                    message = 'Password must be at least 8 characters with uppercase, lowercase, number, and special character';
                }
                break;
        }

        this.showFieldValidation(field, isValid, message);
        return isValid;
    }

    validatePasswordStrength() {
        const password = document.getElementById('password').value;
        const passwordField = document.getElementById('password');

        if (!password) return false;

        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        const isLongEnough = password.length >= 8;

        const isValid = hasUpper && hasLower && hasNumber && hasSpecial && isLongEnough;

        let message = '';
        if (!isValid) {
            const missing = [];
            if (!isLongEnough) missing.push('8+ characters');
            if (!hasUpper) missing.push('uppercase letter');
            if (!hasLower) missing.push('lowercase letter');
            if (!hasNumber) missing.push('number');
            if (!hasSpecial) missing.push('special character');
            message = `Password needs: ${missing.join(', ')}`;
        }

        this.showFieldValidation(passwordField, isValid, message);
        return isValid;
    }

    validatePasswordMatch() {
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const confirmField = document.getElementById('confirmPassword');

        if (!confirmPassword) return false;

        const isValid = password === confirmPassword;
        const message = isValid ? '' : 'Passwords do not match';

        this.showFieldValidation(confirmField, isValid, message);
        return isValid;
    }

    validateStartDate() {
        const startDate = document.getElementById('startDate').value;
        if (!startDate) return false;

        const today = new Date();
        const proposedDate = new Date(startDate);
        const maxDate = new Date();
        maxDate.setMonth(maxDate.getMonth() + 6); // 6 months from now

        const isValid = proposedDate >= today && proposedDate <= maxDate;
        let message = '';

        if (proposedDate < today) {
            message = 'Start date cannot be in the past';
        } else if (proposedDate > maxDate) {
            message = 'Start date cannot be more than 6 months in the future';
        }

        this.showFieldValidation(document.getElementById('startDate'), isValid, message);
        return isValid;
    }

    validateManagerEmail() {
        const managerEmail = document.getElementById('managerEmail').value;
        const userEmail = document.getElementById('email').value;

        if (!managerEmail || !userEmail) return true;

        const isValid = managerEmail !== userEmail;
        const message = isValid ? '' : 'Manager email cannot be the same as your email';

        this.showFieldValidation(document.getElementById('managerEmail'), isValid, message);
        return isValid;
    }

    validateSecurityQuestions() {
        const question1 = document.getElementById('securityQuestion1').value;
        const question2 = document.getElementById('securityQuestion2').value;

        if (!question1 || !question2) return true;

        const isValid = question1 !== question2;
        const message = isValid ? '' : 'Security questions must be different';

        this.showFieldValidation(document.getElementById('securityQuestion2'), isValid, message);
        return isValid;
    }

    validateAccessPermissions() {
        const systemAccess = this.form.querySelectorAll('input[name="systemAccess"]:checked');
        const dataAccess = this.form.querySelectorAll('input[name="dataAccess"]:checked');

        const hasSystemAccess = systemAccess.length > 0;
        const hasDataAccess = dataAccess.length > 0;

        const systemContainer = this.form.querySelector('input[name="systemAccess"]').closest('.form-group');
        const dataContainer = this.form.querySelector('input[name="dataAccess"]').closest('.form-group');

        this.showFieldValidation(systemContainer, hasSystemAccess, hasSystemAccess ? '' : 'Please select at least one system access permission');
        this.showFieldValidation(dataContainer, hasDataAccess, hasDataAccess ? '' : 'Please select at least one data access permission');

        return hasSystemAccess && hasDataAccess;
    }

    updateAccessBasedOnRole() {
        const role = document.getElementById('adminRole').value;
        const systemAccess = this.form.querySelectorAll('input[name="systemAccess"]');
        const dataAccess = this.form.querySelectorAll('input[name="dataAccess"]');

        // Clear all selections first
        [...systemAccess, ...dataAccess].forEach(checkbox => {
            checkbox.checked = false;
            checkbox.disabled = false;
        });

        // Set default permissions based on role
        const rolePermissions = {
            'super-admin': {
                system: ['driver-management', 'fleet-tracking', 'financial-reports', 'customer-support', 'compliance-monitoring', 'user-management', 'analytics-dashboard', 'mobile-money-integration'],
                data: ['driver-data', 'financial-data', 'operational-data', 'customer-data', 'analytics-data', 'audit-logs']
            },
            'operations-manager': {
                system: ['driver-management', 'fleet-tracking', 'customer-support', 'analytics-dashboard'],
                data: ['driver-data', 'operational-data', 'analytics-data']
            },
            'fleet-manager': {
                system: ['driver-management', 'fleet-tracking', 'analytics-dashboard'],
                data: ['driver-data', 'operational-data']
            },
            'customer-service': {
                system: ['customer-support', 'analytics-dashboard'],
                data: ['customer-data', 'operational-data']
            },
            'finance-manager': {
                system: ['financial-reports', 'mobile-money-integration', 'analytics-dashboard'],
                data: ['financial-data', 'analytics-data']
            },
            'compliance-officer': {
                system: ['compliance-monitoring', 'driver-management', 'analytics-dashboard'],
                data: ['driver-data', 'operational-data', 'audit-logs']
            },
            'support-staff': {
                system: ['customer-support'],
                data: ['customer-data']
            }
        };

        if (rolePermissions[role]) {
            const permissions = rolePermissions[role];

            // Check appropriate system access
            permissions.system.forEach(permission => {
                const checkbox = this.form.querySelector(`input[name="systemAccess"][value="${permission}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                }
            });

            // Check appropriate data access
            permissions.data.forEach(permission => {
                const checkbox = this.form.querySelector(`input[name="dataAccess"][value="${permission}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                }
            });
        }
    }

    validateFile(fileInput) {
        const file = fileInput.files[0];
        if (!file && fileInput.hasAttribute('required')) {
            this.showFieldValidation(fileInput, false, 'Please select a file');
            return false;
        }

        if (!file) return true;

        const maxSize = 10 * 1024 * 1024; // 10MB for admin documents
        const allowedTypes = fileInput.accept.split(',').map(type => type.trim());

        let isValid = true;
        let message = '';

        if (file.size > maxSize) {
            isValid = false;
            message = 'File size must be less than 10MB';
        } else if (!this.isValidFileType(file, allowedTypes)) {
            isValid = false;
            message = 'Invalid file type';
        }

        this.showFieldValidation(fileInput, isValid, message);
        return isValid;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidGhanaPhone(phone) {
        const cleanPhone = phone.replace(/\s/g, '');
        const ghanaPhoneRegex = /^0?[245][0-9]{8}$/;
        return ghanaPhoneRegex.test(cleanPhone);
    }

    isValidName(name) {
        return /^[a-zA-Z\s'-]+$/.test(name);
    }

    isValidEmployeeId(id) {
        return /^EMP-\d{4,6}$/i.test(id);
    }

    isValidPassword(password) {
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        const isLongEnough = password.length >= 8;

        return hasUpper && hasLower && hasNumber && hasSpecial && isLongEnough;
    }

    isValidFileType(file, allowedTypes) {
        return allowedTypes.some(type => {
            if (type === 'image/*') {
                return file.type.startsWith('image/');
            }
            return file.type === type || file.name.toLowerCase().endsWith(type.replace('.', ''));
        });
    }

    showFieldValidation(field, isValid, message) {
        const formGroup = field.closest('.form-group') || field.parentElement;
        const errorElement = formGroup.querySelector('.error-message');

        // Remove existing classes
        formGroup.classList.remove('error', 'success');

        if (!isValid) {
            formGroup.classList.add('error');
            if (errorElement) {
                errorElement.textContent = message;
                errorElement.classList.add('show');
            }
        } else if (field.value && field.value.trim()) {
            formGroup.classList.add('success');
            if (errorElement) {
                errorElement.classList.remove('show');
            }
        }
    }

    clearError(field) {
        const formGroup = field.closest('.form-group') || field.parentElement;
        const errorElement = formGroup.querySelector('.error-message');

        formGroup.classList.remove('error');
        if (errorElement) {
            errorElement.classList.remove('show');
        }
    }

    async handleSubmit(e) {
        e.preventDefault();

        // Validate all fields
        const isFormValid = this.validateForm();
        if (!isFormValid) {
            this.showFormError('Please correct the errors above');
            return;
        }

        // Show loading state
        const submitBtn = this.form.querySelector('.submit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Submitting Registration...';
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');

        try {
            // Prepare form data
            const formData = new FormData(this.form);
            
            // Add access permissions arrays
            const systemAccess = Array.from(this.form.querySelectorAll('input[name="systemAccess"]:checked'))
                .map(cb => cb.value);
            const dataAccess = Array.from(this.form.querySelectorAll('input[name="dataAccess"]:checked'))
                .map(cb => cb.value);
            
            formData.append('systemAccessArray', JSON.stringify(systemAccess));
            formData.append('dataAccessArray', JSON.stringify(dataAccess));

            // Submit to API
            const response = await fetch('/api/auth/admin-signup', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                this.showSuccessMessage('Admin registration submitted successfully! Your manager will be notified for approval.');
                this.form.reset();
                
                // Redirect after delay
                setTimeout(() => {
                    window.location.href = '/admin-approval-pending';
                }, 3000);
            } else {
                throw new Error(result.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showFormError(error.message || 'Registration failed. Please try again.');
        } finally {
            // Reset button state
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
        }
    }

    validateForm() {
        const inputs = this.form.querySelectorAll('input[required], select[required], textarea[required]');
        let isValid = true;

        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });

        // Additional validations
        if (!this.validatePasswordStrength()) isValid = false;
        if (!this.validatePasswordMatch()) isValid = false;
        if (!this.validateStartDate()) isValid = false;
        if (!this.validateManagerEmail()) isValid = false;
        if (!this.validateSecurityQuestions()) isValid = false;
        if (!this.validateAccessPermissions()) isValid = false;

        // Validate required checkboxes
        const requiredCheckboxes = ['backgroundCheck', 'dataProcessing', 'codeOfConduct', 'termsConditions', 'privacyPolicy'];
        requiredCheckboxes.forEach(checkboxId => {
            const checkbox = document.getElementById(checkboxId);
            if (!checkbox.checked) {
                this.showFieldValidation(checkbox, false, 'This agreement is required');
                isValid = false;
            }
        });

        return isValid;
    }

    showFormError(message) {
        // Create or update error message at top of form
        let errorDiv = this.form.querySelector('.form-error');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'form-error';
            errorDiv.style.cssText = `
                background: #fee;
                color: #e74c3c;
                padding: 15px;
                border-radius: 5px;
                margin-bottom: 20px;
                border: 1px solid #e74c3c;
            `;
            this.form.insertBefore(errorDiv, this.form.firstChild);
        }
        errorDiv.textContent = message;

        // Scroll to top
        this.form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    showSuccessMessage(message) {
        // Create success message
        const successDiv = document.createElement('div');
        successDiv.className = 'form-success';
        successDiv.style.cssText = `
            background: #d4edda;
            color: #155724;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
            border: 1px solid #c3e6cb;
        `;
        successDiv.textContent = message;

        // Remove any existing messages
        const existingMessages = this.form.querySelectorAll('.form-error, .form-success');
        existingMessages.forEach(msg => msg.remove());

        this.form.insertBefore(successDiv, this.form.firstChild);
        this.form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Initialize form when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AdminSignupForm();
});

// Password strength indicator
document.addEventListener('DOMContentLoaded', () => {
    const passwordInput = document.getElementById('password');
    
    if (passwordInput) {
        // Create password strength indicator
        const strengthIndicator = document.createElement('div');
        strengthIndicator.className = 'password-strength';
        strengthIndicator.style.cssText = `
            margin-top: 5px;
            height: 4px;
            background: #e0e0e0;
            border-radius: 2px;
            overflow: hidden;
            transition: all 0.3s ease;
        `;
        
        const strengthBar = document.createElement('div');
        strengthBar.className = 'strength-bar';
        strengthBar.style.cssText = `
            height: 100%;
            width: 0%;
            transition: all 0.3s ease;
            background: #e74c3c;
        `;
        
        strengthIndicator.appendChild(strengthBar);
        passwordInput.parentElement.appendChild(strengthIndicator);

        passwordInput.addEventListener('input', (e) => {
            const password = e.target.value;
            const strength = calculatePasswordStrength(password);
            
            strengthBar.style.width = `${strength.percentage}%`;
            strengthBar.style.background = strength.color;
        });
    }
});

function calculatePasswordStrength(password) {
    let score = 0;
    let checks = 0;

    if (password.length >= 8) { score += 20; checks++; }
    if (/[a-z]/.test(password)) { score += 20; checks++; }
    if (/[A-Z]/.test(password)) { score += 20; checks++; }
    if (/\d/.test(password)) { score += 20; checks++; }
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) { score += 20; checks++; }

    let color = '#e74c3c'; // Red
    if (score >= 60) color = '#f39c12'; // Orange
    if (score >= 80) color = '#27ae60'; // Green

    return {
        percentage: score,
        color: color,
        strength: checks < 3 ? 'Weak' : checks < 5 ? 'Medium' : 'Strong'
    };
}