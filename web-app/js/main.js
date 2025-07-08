// Main JavaScript - Core functionality for Elyte Platform Admin Dashboard

// Global variables
let isMobileMenuOpen = false;
let currentTheme = 'light';
let notifications = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadDashboardData();
    setupAnimations();
});

// Initialize the application
function initializeApp() {
    console.log('Initializing Elyte Platform Admin Dashboard...');
    
    // Set initial theme
    setTheme(getStoredTheme() || 'light');
    
    // Initialize mobile menu
    setupMobileMenu();
    
    // Initialize tooltips
    setupTooltips();
    
    // Initialize notifications
    setupNotifications();
    
    // Initialize search functionality
    setupSearch();
    
    console.log('Dashboard initialized successfully');
}

// Setup event listeners
function setupEventListeners() {
    // Mobile menu toggle
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    if (mobileToggle) {
        mobileToggle.addEventListener('click', toggleMobileMenu);
    }
    
    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Notification bell
    const notificationBell = document.getElementById('notification-bell');
    if (notificationBell) {
        notificationBell.addEventListener('click', toggleNotifications);
    }
    
    // Search functionality
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    // Quick actions
    setupQuickActions();
    
    // Card hover effects
    setupCardEffects();
    
    // Window resize handler
    window.addEventListener('resize', handleWindowResize);
    
    // Escape key handler
    document.addEventListener('keydown', handleEscapeKey);
}

// Mobile menu functionality
function setupMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileOverlay = document.getElementById('mobile-overlay');
    
    if (mobileOverlay) {
        mobileOverlay.addEventListener('click', closeMobileMenu);
    }
}

function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileOverlay = document.getElementById('mobile-overlay');
    
    if (mobileMenu && mobileOverlay) {
        isMobileMenuOpen = !isMobileMenuOpen;
        
        if (isMobileMenuOpen) {
            mobileMenu.classList.add('open');
            mobileOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            mobileMenu.classList.remove('open');
            mobileOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
}

function closeMobileMenu() {
    if (isMobileMenuOpen) {
        toggleMobileMenu();
    }
}

// Theme functionality
function getStoredTheme() {
    return localStorage.getItem('elyte-theme');
}

function setTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('elyte-theme', theme);
    
    // Update theme toggle button
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.textContent = theme === 'light' ? '🌙' : '☀️';
    }
}

function toggleTheme() {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
}

// Notification functionality
function setupNotifications() {
    // Simulate initial notifications
    notifications = [
        {
            id: 1,
            title: 'New Ride Request',
            message: 'Driver John Doe has a new ride request',
            type: 'info',
            timestamp: new Date(Date.now() - 5 * 60 * 1000),
            read: false
        },
        {
            id: 2,
            title: 'Payment Completed',
            message: 'Payment of $25.50 has been processed',
            type: 'success',
            timestamp: new Date(Date.now() - 15 * 60 * 1000),
            read: false
        },
        {
            id: 3,
            title: 'Driver Offline',
            message: 'Driver Sarah Smith went offline',
            type: 'warning',
            timestamp: new Date(Date.now() - 30 * 60 * 1000),
            read: true
        }
    ];
    
    updateNotificationBadge();
}

function toggleNotifications() {
    const notificationPanel = document.getElementById('notification-panel');
    if (notificationPanel) {
        notificationPanel.classList.toggle('active');
        renderNotifications();
    }
}

function updateNotificationBadge() {
    const badge = document.getElementById('notification-badge');
    const unreadCount = notifications.filter(n => !n.read).length;
    
    if (badge) {
        if (unreadCount > 0) {
            badge.style.display = 'block';
            badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
        } else {
            badge.style.display = 'none';
        }
    }
}

function renderNotifications() {
    const notificationList = document.getElementById('notification-list');
    if (!notificationList) return;
    
    notificationList.innerHTML = notifications.map(notification => `
        <div class="notification-item ${notification.read ? 'read' : 'unread'}" data-id="${notification.id}">
            <div class="notification-icon ${notification.type}">
                ${getNotificationIcon(notification.type)}
            </div>
            <div class="notification-content">
                <div class="notification-title">${notification.title}</div>
                <div class="notification-message">${notification.message}</div>
                <div class="notification-time">${formatTimeAgo(notification.timestamp)}</div>
            </div>
        </div>
    `).join('');
    
    // Add click handlers to mark as read
    notificationList.querySelectorAll('.notification-item').forEach(item => {
        item.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            markNotificationAsRead(id);
        });
    });
}

function getNotificationIcon(type) {
    const icons = {
        info: '📢',
        success: '✅',
        warning: '⚠️',
        error: '❌'
    };
    return icons[type] || '📢';
}

function markNotificationAsRead(id) {
    const notification = notifications.find(n => n.id === id);
    if (notification) {
        notification.read = true;
        updateNotificationBadge();
        renderNotifications();
    }
}

function formatTimeAgo(timestamp) {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
}

// Search functionality
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }
}

function handleSearch(event) {
    const query = event.target.value.toLowerCase();
    console.log('Searching for:', query);
    
    // Here you would implement actual search functionality
    // For now, we'll just log the search term
    
    if (query.length > 2) {
        // Simulate search results
        showSearchResults(query);
    } else {
        hideSearchResults();
    }
}

function showSearchResults(query) {
    // Simulate search results
    const results = [
        { type: 'driver', name: 'John Doe', status: 'Active' },
        { type: 'ride', id: '#12345', status: 'Completed' },
        { type: 'user', name: 'Jane Smith', status: 'Verified' }
    ].filter(item => 
        item.name?.toLowerCase().includes(query) || 
        item.id?.toLowerCase().includes(query)
    );
    
    console.log('Search results:', results);
}

function hideSearchResults() {
    console.log('Hiding search results');
}

// Quick actions setup
function setupQuickActions() {
    const quickActions = document.querySelectorAll('.quick-action');
    quickActions.forEach(action => {
        action.addEventListener('click', function(e) {
            e.preventDefault();
            const actionType = this.getAttribute('data-action');
            handleQuickAction(actionType);
        });
    });
}

function handleQuickAction(actionType) {
    console.log('Quick action:', actionType);
    
    switch (actionType) {
        case 'add-driver':
            showModal('add-driver-modal');
            break;
        case 'new-ride':
            showModal('new-ride-modal');
            break;
        case 'reports':
            navigateTo('/reports');
            break;
        case 'settings':
            navigateTo('/settings');
            break;
        default:
            console.log('Unknown action:', actionType);
    }
}

// Card effects
function setupCardEffects() {
    const cards = document.querySelectorAll('.card, .stat-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-4px)';
            this.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '';
        });
    });
}

// Animation setup
function setupAnimations() {
    // Animate statistics on load
    animateStatistics();
    
    // Setup scroll animations
    setupScrollAnimations();
    
    // Setup loading animations
    setupLoadingAnimations();
}

function animateStatistics() {
    const statValues = document.querySelectorAll('.stat-value');
    statValues.forEach(stat => {
        const finalValue = parseInt(stat.textContent.replace(/[^\d]/g, ''));
        if (!isNaN(finalValue)) {
            animateCounter(stat, 0, finalValue, 2000);
        }
    });
}

function animateCounter(element, start, end, duration) {
    const startTime = performance.now();
    const isDecimal = end.toString().includes('.');
    
    function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (ease-out)
        const easeOutProgress = 1 - Math.pow(1 - progress, 3);
        
        const currentValue = start + (end - start) * easeOutProgress;
        
        if (isDecimal) {
            element.textContent = currentValue.toFixed(1);
        } else {
            element.textContent = Math.floor(currentValue).toLocaleString();
        }
        
        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        }
    }
    
    requestAnimationFrame(updateCounter);
}

function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    const animatedElements = document.querySelectorAll('.card, .stat-card');
    animatedElements.forEach(el => observer.observe(el));
}

function setupLoadingAnimations() {
    // Show loading states for dynamic content
    const loadingElements = document.querySelectorAll('.loading-placeholder');
    loadingElements.forEach(el => {
        el.classList.add('loading-animation');
    });
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

function navigateTo(path) {
    // Simulate navigation
    console.log('Navigating to:', path);
    // In a real app, you would use a router here
}

function handleWindowResize() {
    // Handle responsive behavior
    if (window.innerWidth > 768 && isMobileMenuOpen) {
        closeMobileMenu();
    }
}

function handleEscapeKey(event) {
    if (event.key === 'Escape') {
        closeMobileMenu();
        
        // Close any open modals
        const openModals = document.querySelectorAll('.modal[style*="display: flex"]');
        openModals.forEach(modal => {
            modal.style.display = 'none';
        });
        
        document.body.style.overflow = '';
    }
}

// Setup tooltips
function setupTooltips() {
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    tooltipElements.forEach(element => {
        element.addEventListener('mouseenter', showTooltip);
        element.addEventListener('mouseleave', hideTooltip);
    });
}

function showTooltip(event) {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = event.target.getAttribute('data-tooltip');
    
    document.body.appendChild(tooltip);
    
    const rect = event.target.getBoundingClientRect();
    tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
    tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';
    
    setTimeout(() => tooltip.classList.add('visible'), 10);
}

function hideTooltip() {
    const tooltips = document.querySelectorAll('.tooltip');
    tooltips.forEach(tooltip => {
        tooltip.classList.remove('visible');
        setTimeout(() => tooltip.remove(), 300);
    });
}

// Load dashboard data
function loadDashboardData() {
    // Simulate loading dashboard data
    console.log('Loading dashboard data...');
    
    // In a real application, you would fetch this data from an API
    const dashboardData = {
        stats: {
            totalRides: 12847,
            activeDrivers: 142,
            revenue: 45230.50,
            userGrowth: 23.5
        },
        recentActivities: [
            { type: 'ride', text: 'New ride completed by John Doe', time: '2 minutes ago' },
            { type: 'driver', text: 'Sarah Smith went online', time: '5 minutes ago' },
            { type: 'payment', text: 'Payment of $25.50 processed', time: '8 minutes ago' }
        ]
    };
    
    // Update the dashboard with the loaded data
    updateDashboardStats(dashboardData.stats);
    updateRecentActivities(dashboardData.recentActivities);
    
    console.log('Dashboard data loaded successfully');
}

function updateDashboardStats(stats) {
    // Update statistics values
    const totalRidesElement = document.getElementById('total-rides');
    const activeDriversElement = document.getElementById('active-drivers');
    const revenueElement = document.getElementById('revenue');
    const userGrowthElement = document.getElementById('user-growth');
    
    if (totalRidesElement) totalRidesElement.textContent = stats.totalRides.toLocaleString();
    if (activeDriversElement) activeDriversElement.textContent = stats.activeDrivers.toLocaleString();
    if (revenueElement) revenueElement.textContent = `$${stats.revenue.toLocaleString()}`;
    if (userGrowthElement) userGrowthElement.textContent = `${stats.userGrowth}%`;
}

function updateRecentActivities(activities) {
    const activitiesList = document.getElementById('activities-list');
    if (!activitiesList) return;
    
    activitiesList.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon ${activity.type}">
                ${getActivityIcon(activity.type)}
            </div>
            <div class="activity-content">
                <div class="activity-text">${activity.text}</div>
                <div class="activity-time">${activity.time}</div>
            </div>
        </div>
    `).join('');
}

function getActivityIcon(type) {
    const icons = {
        ride: '🚗',
        driver: '👨‍💼',
        payment: '💳',
        user: '👤'
    };
    return icons[type] || '📄';
}

// Error handling
window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
    
    // Show user-friendly error message
    showNotification('An error occurred. Please try again.', 'error');
});

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('visible');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('visible');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Export functions for use in other modules
window.ElyteAdmin = {
    showModal,
    hideModal,
    showNotification,
    navigateTo,
    loadDashboardData,
    toggleTheme,
    toggleMobileMenu
};