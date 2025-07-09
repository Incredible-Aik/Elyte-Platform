// Driver Signup Form JavaScript
class DriverSignupForm {
    constructor() {
        this.form = document.getElementById('driverSignupForm');
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupPhoneValidation();
        this.setupFileValidation();
        this.setupMobileMoneyValidation();
        this.setupWorkingDaysValidation();
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
        document.getElementById('dateOfBirth').addEventListener('blur', () => this.validateAge());
        document.getElementById('licenseExpiry').addEventListener('blur', () => this.validateLicenseExpiry());
        document.getElementById('insuranceExpiry').addEventListener('blur', () => this.validateInsuranceExpiry());
        document.getElementById('workingHoursEnd').addEventListener('blur', () => this.validateWorkingHours());
    }

    setupPhoneValidation() {
        const phoneInput = document.getElementById('phone');
        const emergencyPhoneInput = document.getElementById('emergencyContactPhone');
        const mobileMoneyInput = document.getElementById('mobileMoneyNumber');

        [phoneInput, emergencyPhoneInput, mobileMoneyInput].forEach(input => {
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

    setupMobileMoneyValidation() {
        const providerSelect = document.getElementById('mobileMoneyProvider');
        const numberInput = document.getElementById('mobileMoneyNumber');

        providerSelect.addEventListener('change', () => {
            this.validateMobileMoneyCompatibility();
        });

        numberInput.addEventListener('blur', () => {
            this.validateMobileMoneyCompatibility();
        });
    }

    setupWorkingDaysValidation() {
        const workingDaysCheckboxes = this.form.querySelectorAll('input[name="workingDays"]');
        workingDaysCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => this.validateWorkingDays());
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
                if (value && !this.isValidEmail(value)) {
                    isValid = false;
                    message = 'Please enter a valid email address';
                }
                break;

            case 'phone':
            case 'emergencyContactPhone':
                if (value && !this.isValidGhanaPhone(value)) {
                    isValid = false;
                    message = 'Please enter a valid Ghana phone number';
                }
                break;

            case 'mobileMoneyNumber':
                if (value && !this.isValidMobileMoneyNumber(value)) {
                    isValid = false;
                    message = 'Please enter a valid mobile money number';
                }
                break;

            case 'licenseNumber':
                if (value && !this.isValidLicenseNumber(value)) {
                    isValid = false;
                    message = 'Please enter a valid license number';
                }
                break;

            case 'licensePlate':
                if (value && !this.isValidLicensePlate(value)) {
                    isValid = false;
                    message = 'Please enter a valid Ghana license plate (e.g., GR-1234-AB)';
                }
                break;

            case 'firstName':
            case 'lastName':
            case 'emergencyContactName':
            case 'accountName':
                if (value && !this.isValidName(value)) {
                    isValid = false;
                    message = 'Please enter a valid name (letters only)';
                }
                break;

            case 'vehicleYear':
                if (value && !this.isValidVehicleYear(value)) {
                    isValid = false;
                    message = 'Vehicle year must be between 2000 and current year';
                }
                break;
        }

        this.showFieldValidation(field, isValid, message);
        return isValid;
    }

    validateAge() {
        const dateOfBirth = document.getElementById('dateOfBirth').value;
        if (!dateOfBirth) return false;

        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        const isValid = age >= 18 && age <= 70;
        const message = age < 18 ? 'You must be at least 18 years old' : age > 70 ? 'Maximum age limit is 70 years' : '';

        this.showFieldValidation(document.getElementById('dateOfBirth'), isValid, message);
        return isValid;
    }

    validateLicenseExpiry() {
        const expiryDate = document.getElementById('licenseExpiry').value;
        if (!expiryDate) return false;

        const today = new Date();
        const expiry = new Date(expiryDate);
        const isValid = expiry > today;
        const message = isValid ? '' : 'License must not be expired';

        this.showFieldValidation(document.getElementById('licenseExpiry'), isValid, message);
        return isValid;
    }

    validateInsuranceExpiry() {
        const expiryDate = document.getElementById('insuranceExpiry').value;
        if (!expiryDate) return false;

        const today = new Date();
        const expiry = new Date(expiryDate);
        const isValid = expiry > today;
        const message = isValid ? '' : 'Insurance must not be expired';

        this.showFieldValidation(document.getElementById('insuranceExpiry'), isValid, message);
        return isValid;
    }

    validateWorkingHours() {
        const startTime = document.getElementById('workingHoursStart').value;
        const endTime = document.getElementById('workingHoursEnd').value;

        if (!startTime || !endTime) return false;

        const start = new Date(`2000-01-01 ${startTime}`);
        const end = new Date(`2000-01-01 ${endTime}`);
        const isValid = end > start;
        const message = isValid ? '' : 'End time must be after start time';

        this.showFieldValidation(document.getElementById('workingHoursEnd'), isValid, message);
        return isValid;
    }

    validateWorkingDays() {
        const checkedDays = this.form.querySelectorAll('input[name="workingDays"]:checked');
        const isValid = checkedDays.length > 0;
        const message = isValid ? '' : 'Please select at least one working day';

        const container = this.form.querySelector('.checkbox-group').parentElement;
        this.showFieldValidation(container, isValid, message);
        return isValid;
    }

    validateMobileMoneyCompatibility() {
        const provider = document.getElementById('mobileMoneyProvider').value;
        const number = document.getElementById('mobileMoneyNumber').value;

        if (!provider || !number) return false;

        let isValid = true;
        let message = '';

        // Validate number format based on provider
        switch (provider) {
            case 'MTN':
                isValid = /^0?24|25|53|54|55|59/.test(number.replace(/\s/g, ''));
                message = isValid ? '' : 'Invalid MTN number format';
                break;
            case 'Vodafone':
                isValid = /^0?20|50/.test(number.replace(/\s/g, ''));
                message = isValid ? '' : 'Invalid Vodafone number format';
                break;
            case 'AirtelTigo':
                isValid = /^0?26|27|56|57/.test(number.replace(/\s/g, ''));
                message = isValid ? '' : 'Invalid AirtelTigo number format';
                break;
        }

        this.showFieldValidation(document.getElementById('mobileMoneyNumber'), isValid, message);
        return isValid;
    }

    validateFile(fileInput) {
        const file = fileInput.files[0];
        if (!file && fileInput.hasAttribute('required')) {
            this.showFieldValidation(fileInput, false, 'Please select a file');
            return false;
        }

        if (!file) return true;

        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = fileInput.accept.split(',').map(type => type.trim());

        let isValid = true;
        let message = '';

        if (file.size > maxSize) {
            isValid = false;
            message = 'File size must be less than 5MB';
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

    isValidMobileMoneyNumber(number) {
        const cleanNumber = number.replace(/\s/g, '');
        return /^0?[2-5][0-9]{8}$/.test(cleanNumber);
    }

    isValidLicenseNumber(license) {
        // Ghana license format: 2-3 letters followed by 6-8 digits
        return /^[A-Z]{2,3}[0-9]{6,8}$/i.test(license);
    }

    isValidLicensePlate(plate) {
        // Ghana license plate format: 2 letters - 4 digits - 2 letters
        return /^[A-Z]{2}-[0-9]{4}-[A-Z]{2}$/i.test(plate);
    }

    isValidName(name) {
        return /^[a-zA-Z\s'-]+$/.test(name);
    }

    isValidVehicleYear(year) {
        const currentYear = new Date().getFullYear();
        return year >= 2000 && year <= currentYear;
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
        } else if (field.value.trim()) {
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
        submitBtn.textContent = 'Registering...';
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');

        try {
            // Prepare form data
            const formData = new FormData(this.form);
            
            // Add working days array
            const workingDays = Array.from(this.form.querySelectorAll('input[name="workingDays"]:checked'))
                .map(cb => cb.value);
            formData.append('workingDaysArray', JSON.stringify(workingDays));

            // Submit to API
            const response = await fetch('/api/auth/driver-signup', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                this.showSuccessMessage('Registration successful! Please check your email for verification.');
                this.form.reset();
                
                // Redirect after delay
                setTimeout(() => {
                    window.location.href = '/verification-pending';
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
        if (!this.validateAge()) isValid = false;
        if (!this.validateLicenseExpiry()) isValid = false;
        if (!this.validateInsuranceExpiry()) isValid = false;
        if (!this.validateWorkingHours()) isValid = false;
        if (!this.validateWorkingDays()) isValid = false;
        if (!this.validateMobileMoneyCompatibility()) isValid = false;

        // Validate checkboxes
        const requiredCheckboxes = ['backgroundCheck', 'termsConditions', 'privacyPolicy'];
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
    new DriverSignupForm();
});

// Ghana Cities and Regions data for dynamic updates
const ghanaRegionsAndCities = {
    'Greater Accra': ['Accra', 'Tema', 'Kasoa', 'Madina', 'Adenta', 'Teshie', 'Nungua'],
    'Ashanti': ['Kumasi', 'Obuasi', 'Ejisu', 'Mampong', 'Konongo', 'Bekwai'],
    'Northern': ['Tamale', 'Yendi', 'Gushegu', 'Karaga', 'Kumbungu', 'Sagnarigu'],
    'Western': ['Takoradi', 'Tarkwa', 'Elubo', 'Half Assini', 'Axim', 'Prestea'],
    'Central': ['Cape Coast', 'Elmina', 'Winneba', 'Kasoa', 'Swedru', 'Dunkwa'],
    'Eastern': ['Koforidua', 'Akropong', 'Somanya', 'Begoro', 'Akim Oda', 'Nkawkaw'],
    'Volta': ['Ho', 'Hohoe', 'Keta', 'Sogakope', 'Denu', 'Aflao'],
    'Brong Ahafo': ['Sunyani', 'Techiman', 'Berekum', 'Dormaa Ahenkro', 'Kintampo'],
    'Upper East': ['Bolgatanga', 'Bawku', 'Navrongo', 'Paga', 'Zebilla'],
    'Upper West': ['Wa', 'Lawra', 'Jirapa', 'Tumu', 'Funsi']
};

// Update cities based on selected region
document.addEventListener('DOMContentLoaded', () => {
    const regionSelect = document.getElementById('region');
    const citySelect = document.getElementById('city');

    if (regionSelect && citySelect) {
        regionSelect.addEventListener('change', () => {
            const selectedRegion = regionSelect.value;
            citySelect.innerHTML = '<option value="">Select City</option>';

            if (selectedRegion && ghanaRegionsAndCities[selectedRegion]) {
                ghanaRegionsAndCities[selectedRegion].forEach(city => {
                    const option = document.createElement('option');
                    option.value = city;
                    option.textContent = city;
                    citySelect.appendChild(option);
                });
            }
        });
    }
});