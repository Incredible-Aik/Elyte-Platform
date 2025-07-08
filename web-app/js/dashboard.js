// Dashboard JavaScript - Interactive functionality for dashboard pages

// Wait for DOM to be loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    console.log('Dashboard initialized successfully');
});

// Initialize dashboard functionality
function initializeDashboard() {
    // Check authentication
    if (!window.ElyteAuth || !window.ElyteAuth.isAuthenticated()) {
        redirectToLogin();
        return;
    }
    
    // Initialize components
    initializeNavigation();
    initializeSidebar();
    initializeUserProfile();
    initializeDashboardSections();
    initializeRealTimeUpdates();
    loadDashboardData();
    
    // Initialize page-specific functionality
    const currentPage = getCurrentDashboardPage();
    if (currentPage === 'passenger') {
        initializePassengerDashboard();
    } else if (currentPage === 'driver') {
        initializeDriverDashboard();
    } else if (currentPage === 'admin') {
        initializeAdminDashboard();
    }
}

// Navigation functionality
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sidebarNav = document.querySelectorAll('.sidebar-nav a');
    
    // Add click handlers to navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetSection = this.getAttribute('href').substring(1);
            showSection(targetSection);
            updateActiveNavItem(this);
        });
    });
    
    // Add click handlers to sidebar navigation
    sidebarNav.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetSection = this.getAttribute('href').substring(1);
            showSection(targetSection);
            updateActiveNavItem(this);
        });
    });
    
    // Handle initial section display
    const hash = window.location.hash.substring(1);
    if (hash) {
        showSection(hash);
    } else {
        showSection('dashboard');
    }
}

// Sidebar functionality
function initializeSidebar() {
    const sidebar = document.querySelector('.dashboard-sidebar');
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const main = document.querySelector('.dashboard-main');
    
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
            
            // Update aria-expanded
            const isExpanded = sidebar.classList.contains('active');
            this.setAttribute('aria-expanded', isExpanded);
        });
    }
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
                sidebar.classList.remove('active');
                if (sidebarToggle) {
                    sidebarToggle.setAttribute('aria-expanded', false);
                }
            }
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            sidebar.classList.remove('active');
            if (sidebarToggle) {
                sidebarToggle.setAttribute('aria-expanded', false);
            }
        }
    });
}

// User profile functionality
function initializeUserProfile() {
    const user = window.ElyteAuth.getCurrentUser();
    if (user) {
        updateUserProfile(user);
    }
}

// Dashboard sections functionality
function initializeDashboardSections() {
    // Initialize form handlers
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            handleFormSubmission(this);
        });
    });
    
    // Initialize quick action buttons
    const quickActionBtns = document.querySelectorAll('.quick-action-btn');
    quickActionBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const action = this.getAttribute('onclick');
            if (action) {
                eval(action);
            }
        });
    });
}

// Real-time updates
function initializeRealTimeUpdates() {
    // Simulate real-time updates for demonstration
    setInterval(updateDashboardStats, 30000); // Update every 30 seconds
    setInterval(checkForNotifications, 60000); // Check notifications every minute
}

// Load dashboard data
function loadDashboardData() {
    const currentPage = getCurrentDashboardPage();
    
    if (currentPage === 'passenger') {
        loadPassengerData();
    } else if (currentPage === 'driver') {
        loadDriverData();
    } else if (currentPage === 'admin') {
        loadAdminData();
    }
}

// Show specific section
function showSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Update page title
        updatePageTitle(sectionId);
        
        // Update URL hash
        window.history.replaceState(null, null, `#${sectionId}`);
        
        // Load section-specific data
        loadSectionData(sectionId);
    }
}

// Update active navigation item
function updateActiveNavItem(clickedLink) {
    // Remove active class from all nav items
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active class to parent of clicked link
    const parentNavItem = clickedLink.closest('.nav-item');
    if (parentNavItem) {
        parentNavItem.classList.add('active');
    }
}

// Update page title
function updatePageTitle(sectionId) {
    const titleMap = {
        'dashboard': 'Dashboard',
        'book-ride': 'Book a Ride',
        'current-ride': 'Current Ride',
        'ride-history': 'Ride History',
        'payments': 'Payment Methods',
        'favorites': 'Favorite Locations',
        'ussd-settings': 'USSD Settings',
        'profile': 'Profile Settings',
        'support': 'Support',
        // Driver specific
        'go-online': 'Go Online',
        'ride-requests': 'Ride Requests',
        'earnings': 'Earnings',
        'vehicle': 'Vehicle Management',
        // Admin specific
        'overview': 'Overview',
        'user-management': 'User Management',
        'driver-verification': 'Driver Verification',
        'financial-reports': 'Financial Reports',
        'support-tickets': 'Support Tickets',
        'system-settings': 'System Settings'
    };
    
    const pageTitle = document.querySelector('.page-title');
    if (pageTitle && titleMap[sectionId]) {
        pageTitle.textContent = titleMap[sectionId];
    }
}

// Update user profile
function updateUserProfile(user) {
    const profileName = document.querySelector('.profile-name');
    const profileRole = document.querySelector('.profile-role');
    const avatarInitials = document.querySelector('.avatar-initials');
    
    if (profileName) {
        profileName.textContent = user.name || 'User';
    }
    
    if (profileRole) {
        profileRole.textContent = capitalizeFirst(user.type) || 'User';
    }
    
    if (avatarInitials) {
        const initials = getInitials(user.name || 'User');
        avatarInitials.textContent = initials;
    }
}

// Handle form submissions
function handleFormSubmission(form) {
    const formId = form.id;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Processing...';
        submitButton.disabled = true;
        
        // Simulate API call
        setTimeout(() => {
            // Reset button
            submitButton.textContent = originalText;
            submitButton.disabled = false;
            
            // Handle specific form types
            if (formId === 'bookRideForm') {
                handleRideBooking(data);
            } else if (formId === 'profileForm') {
                handleProfileUpdate(data);
            } else if (formId === 'paymentForm') {
                handlePaymentUpdate(data);
            }
            
            // Show success message
            showNotification('Request processed successfully!', 'success');
        }, 2000);
    }
}

// Load section-specific data
function loadSectionData(sectionId) {
    switch (sectionId) {
        case 'ride-history':
            loadRideHistory();
            break;
        case 'payments':
            loadPaymentMethods();
            break;
        case 'favorites':
            loadFavoriteLocations();
            break;
        case 'earnings':
            loadEarningsData();
            break;
        case 'user-management':
            loadUserManagementData();
            break;
        default:
            // No specific data loading needed
            break;
    }
}

// Passenger dashboard specific functionality
function initializePassengerDashboard() {
    console.log('Initializing passenger dashboard');
    
    // Initialize ride booking
    initializeRideBooking();
    
    // Initialize payment methods
    initializePaymentMethods();
    
    // Initialize USSD settings
    initializeUSSDSettings();
}

// Driver dashboard specific functionality
function initializeDriverDashboard() {
    console.log('Initializing driver dashboard');
    
    // Initialize online/offline toggle
    initializeOnlineToggle();
    
    // Initialize ride request handling
    initializeRideRequests();
    
    // Initialize earnings tracking
    initializeEarningsTracking();
}

// Admin dashboard specific functionality
function initializeAdminDashboard() {
    console.log('Initializing admin dashboard');
    
    // Initialize user management
    initializeUserManagement();
    
    // Initialize analytics
    initializeAnalytics();
    
    // Initialize system monitoring
    initializeSystemMonitoring();
}

// Ride booking functionality
function initializeRideBooking() {
    const pickupInput = document.getElementById('pickupLocation');
    const destinationInput = document.getElementById('destination');
    
    if (pickupInput && destinationInput) {
        // Add location autocomplete simulation
        [pickupInput, destinationInput].forEach(input => {
            input.addEventListener('input', function() {
                // Simulate location suggestions
                showLocationSuggestions(this);
            });
        });
    }
}

// Payment methods functionality
function initializePaymentMethods() {
    const addPaymentBtn = document.querySelector('.payment-methods .btn');
    
    if (addPaymentBtn) {
        addPaymentBtn.addEventListener('click', function() {
            showAddPaymentModal();
        });
    }
}

// USSD settings functionality
function initializeUSSDSettings() {
    // Initialize USSD PIN setup and management
    console.log('USSD settings initialized');
}

// Online/offline toggle for drivers
function initializeOnlineToggle() {
    const onlineToggle = document.getElementById('onlineToggle');
    
    if (onlineToggle) {
        onlineToggle.addEventListener('change', function() {
            const isOnline = this.checked;
            updateDriverStatus(isOnline);
        });
    }
}

// Ride requests for drivers
function initializeRideRequests() {
    // Listen for incoming ride requests
    console.log('Ride request system initialized');
}

// Earnings tracking for drivers
function initializeEarningsTracking() {
    loadEarningsChart();
}

// User management for admins
function initializeUserManagement() {
    const userTable = document.getElementById('userTable');
    
    if (userTable) {
        // Initialize user table functionality
        initializeUserTable();
    }
}

// Analytics for admins
function initializeAnalytics() {
    loadAnalyticsCharts();
}

// System monitoring for admins
function initializeSystemMonitoring() {
    // Initialize real-time system monitoring
    console.log('System monitoring initialized');
}

// Utility functions
function getCurrentDashboardPage() {
    const path = window.location.pathname;
    if (path.includes('passenger')) return 'passenger';
    if (path.includes('driver')) return 'driver';
    if (path.includes('admin')) return 'admin';
    return 'passenger'; // default
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function getInitials(name) {
    return name.split(' ').map(word => word.charAt(0)).join('').substring(0, 2).toUpperCase();
}

function redirectToLogin() {
    window.location.href = 'login.html';
}

function showNotification(message, type = 'info') {
    if (window.ElyteApp && window.ElyteApp.showNotification) {
        window.ElyteApp.showNotification(message, type);
    }
}

// Data loading functions
function loadPassengerData() {
    // Load passenger-specific data
    updateDashboardStats();
    loadRecentRides();
    loadFavoriteLocations();
}

function loadDriverData() {
    // Load driver-specific data
    updateDriverStats();
    loadTodaysEarnings();
    loadRideRequests();
}

function loadAdminData() {
    // Load admin-specific data
    updatePlatformStats();
    loadRecentActivity();
    loadSystemAlerts();
}

function updateDashboardStats() {
    // Update statistics cards with real data
    const stats = {
        totalRides: 24,
        totalSpent: 450,
        rating: 4.8,
        walletBalance: 125.50
    };
    
    updateStatCard('Total Rides', stats.totalRides);
    updateStatCard('Total Spent', `GHS ${stats.totalSpent}`);
    updateStatCard('Your Rating', stats.rating);
    updateStatCard('Wallet Balance', `GHS ${stats.walletBalance}`);
}

function updateStatCard(label, value) {
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
        const cardLabel = card.querySelector('.stat-label');
        const cardNumber = card.querySelector('.stat-number');
        
        if (cardLabel && cardLabel.textContent === label) {
            cardNumber.textContent = value;
        }
    });
}

function loadRecentRides() {
    // Load and display recent rides
    console.log('Loading recent rides...');
}

function loadRideHistory() {
    // Load complete ride history
    console.log('Loading ride history...');
}

function loadFavoriteLocations() {
    // Load user's favorite locations
    console.log('Loading favorite locations...');
}

function loadPaymentMethods() {
    // Load user's payment methods
    console.log('Loading payment methods...');
}

function loadEarningsData() {
    // Load driver earnings data
    console.log('Loading earnings data...');
}

function loadUserManagementData() {
    // Load user management data for admins
    console.log('Loading user management data...');
}

function checkForNotifications() {
    // Check for new notifications
    const currentCount = parseInt(document.querySelector('.badge-count')?.textContent || '0');
    // Simulate new notification
    if (Math.random() > 0.8) {
        updateNotificationCount(currentCount + 1);
    }
}

function updateNotificationCount(count) {
    const badgeCount = document.querySelector('.badge-count');
    if (badgeCount) {
        badgeCount.textContent = count;
        badgeCount.style.display = count > 0 ? 'block' : 'none';
    }
}

// Event handlers
function handleRideBooking(data) {
    console.log('Booking ride:', data);
    // Process ride booking
}

function handleProfileUpdate(data) {
    console.log('Updating profile:', data);
    // Process profile update
}

function handlePaymentUpdate(data) {
    console.log('Updating payment:', data);
    // Process payment method update
}

function updateDriverStatus(isOnline) {
    console.log('Driver status:', isOnline ? 'Online' : 'Offline');
    // Update driver online status
}

function showLocationSuggestions(input) {
    // Show location suggestions for autocomplete
    console.log('Showing suggestions for:', input.value);
}

function showAddPaymentModal() {
    // Show modal for adding payment method
    console.log('Showing add payment modal');
}

function loadEarningsChart() {
    // Load earnings chart for drivers
    console.log('Loading earnings chart');
}

function initializeUserTable() {
    // Initialize user management table
    console.log('Initializing user table');
}

function loadAnalyticsCharts() {
    // Load analytics charts for admins
    console.log('Loading analytics charts');
}

function updateDriverStats() {
    // Update driver-specific statistics
    console.log('Updating driver stats');
}

function loadTodaysEarnings() {
    // Load today's earnings for driver
    console.log('Loading today\'s earnings');
}

function loadRideRequests() {
    // Load pending ride requests
    console.log('Loading ride requests');
}

function updatePlatformStats() {
    // Update platform-wide statistics for admin
    console.log('Updating platform stats');
}

function loadRecentActivity() {
    // Load recent platform activity for admin
    console.log('Loading recent activity');
}

function loadSystemAlerts() {
    // Load system alerts for admin
    console.log('Loading system alerts');
}

// Logout function
function logout() {
    if (window.ElyteAuth && window.ElyteAuth.logout) {
        window.ElyteAuth.logout();
    } else {
        // Fallback logout
        localStorage.removeItem('elyte_user');
        localStorage.removeItem('elyte_session');
        window.location.href = 'index.html';
    }
}

// Export functions for global use
window.DashboardApp = {
    showSection,
    logout,
    handleRideBooking,
    handleProfileUpdate,
    handlePaymentUpdate,
    updateDriverStatus
};