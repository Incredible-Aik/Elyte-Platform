// Dashboard JavaScript - Dashboard-specific functionality

// Dashboard state management
let dashboardState = {
    currentView: 'overview',
    refreshInterval: null,
    lastRefresh: null,
    autoRefresh: true,
    filters: {
        dateRange: '7d',
        status: 'all',
        driverStatus: 'all'
    }
};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('.dashboard-container')) {
        initializeDashboard();
    }
});

function initializeDashboard() {
    console.log('Initializing dashboard specific functionality...');
    
    // Setup dashboard navigation
    setupDashboardNav();
    
    // Setup real-time updates
    setupRealTimeUpdates();
    
    // Setup dashboard filters
    setupDashboardFilters();
    
    // Setup dashboard widgets
    setupDashboardWidgets();
    
    // Setup data refresh
    setupDataRefresh();
    
    // Setup dashboard shortcuts
    setupDashboardShortcuts();
    
    console.log('Dashboard initialization complete');
}

// Dashboard navigation
function setupDashboardNav() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all items
            navItems.forEach(nav => nav.classList.remove('active'));
            
            // Add active class to clicked item
            this.classList.add('active');
            
            // Get the view name
            const viewName = this.getAttribute('data-view') || 'overview';
            
            // Switch to the selected view
            switchDashboardView(viewName);
        });
    });
}

function switchDashboardView(viewName) {
    console.log('Switching to view:', viewName);
    
    dashboardState.currentView = viewName;
    
    // Hide all view containers
    const viewContainers = document.querySelectorAll('[data-view-container]');
    viewContainers.forEach(container => {
        container.style.display = 'none';
    });
    
    // Show the selected view container
    const activeContainer = document.querySelector(`[data-view-container="${viewName}"]`);
    if (activeContainer) {
        activeContainer.style.display = 'block';
    }
    
    // Update page title
    updatePageTitle(viewName);
    
    // Load view-specific data
    loadViewData(viewName);
}

function updatePageTitle(viewName) {
    const pageTitleElement = document.querySelector('.page-title');
    if (pageTitleElement) {
        const titles = {
            overview: 'Dashboard Overview',
            rides: 'Ride Management',
            drivers: 'Driver Management',
            users: 'User Management',
            payments: 'Payment Management',
            reports: 'Reports & Analytics',
            settings: 'Settings'
        };
        
        pageTitleElement.textContent = titles[viewName] || 'Dashboard';
    }
}

function loadViewData(viewName) {
    console.log('Loading data for view:', viewName);
    
    // Show loading state
    showLoadingState(viewName);
    
    // Simulate data loading
    setTimeout(() => {
        hideLoadingState(viewName);
        
        switch (viewName) {
            case 'overview':
                loadOverviewData();
                break;
            case 'rides':
                loadRidesData();
                break;
            case 'drivers':
                loadDriversData();
                break;
            case 'users':
                loadUsersData();
                break;
            case 'payments':
                loadPaymentsData();
                break;
            case 'reports':
                loadReportsData();
                break;
            case 'settings':
                loadSettingsData();
                break;
        }
    }, 1000);
}

// Real-time updates
function setupRealTimeUpdates() {
    if (dashboardState.autoRefresh) {
        startAutoRefresh();
    }
    
    // Setup auto refresh toggle
    const autoRefreshToggle = document.getElementById('auto-refresh-toggle');
    if (autoRefreshToggle) {
        autoRefreshToggle.addEventListener('change', function() {
            dashboardState.autoRefresh = this.checked;
            
            if (dashboardState.autoRefresh) {
                startAutoRefresh();
            } else {
                stopAutoRefresh();
            }
        });
    }
}

function startAutoRefresh() {
    stopAutoRefresh(); // Clear any existing interval
    
    dashboardState.refreshInterval = setInterval(() => {
        refreshDashboardData();
    }, 30000); // Refresh every 30 seconds
    
    console.log('Auto-refresh started');
}

function stopAutoRefresh() {
    if (dashboardState.refreshInterval) {
        clearInterval(dashboardState.refreshInterval);
        dashboardState.refreshInterval = null;
        console.log('Auto-refresh stopped');
    }
}

function refreshDashboardData() {
    console.log('Refreshing dashboard data...');
    
    dashboardState.lastRefresh = new Date();
    
    // Update last refresh indicator
    updateLastRefreshIndicator();
    
    // Reload current view data
    loadViewData(dashboardState.currentView);
    
    // Update statistics
    updateLiveStatistics();
    
    // Update recent activities
    updateRecentActivities();
}

function updateLastRefreshIndicator() {
    const indicator = document.getElementById('last-refresh');
    if (indicator) {
        const now = new Date();
        indicator.textContent = `Last updated: ${now.toLocaleTimeString()}`;
    }
}

// Dashboard filters
function setupDashboardFilters() {
    const filterElements = document.querySelectorAll('.dashboard-filter');
    filterElements.forEach(filter => {
        filter.addEventListener('change', function() {
            const filterType = this.getAttribute('data-filter');
            const filterValue = this.value;
            
            dashboardState.filters[filterType] = filterValue;
            
            // Apply filters
            applyDashboardFilters();
        });
    });
}

function applyDashboardFilters() {
    console.log('Applying filters:', dashboardState.filters);
    
    // Show loading state
    showLoadingState('filters');
    
    // Simulate filtering
    setTimeout(() => {
        hideLoadingState('filters');
        
        // Reload data with filters
        loadViewData(dashboardState.currentView);
        
        // Update statistics with filters
        updateFilteredStatistics();
    }, 500);
}

function updateFilteredStatistics() {
    // This would normally filter the statistics based on current filters
    console.log('Updating filtered statistics');
    
    // For demo purposes, we'll just update the UI to show filtering is active
    const activeFilters = Object.entries(dashboardState.filters)
        .filter(([key, value]) => value !== 'all' && value !== '')
        .length;
    
    const filterBadge = document.getElementById('active-filters-badge');
    if (filterBadge) {
        if (activeFilters > 0) {
            filterBadge.textContent = activeFilters;
            filterBadge.style.display = 'block';
        } else {
            filterBadge.style.display = 'none';
        }
    }
}

// Dashboard widgets
function setupDashboardWidgets() {
    setupStatisticsWidgets();
    setupChartWidgets();
    setupTableWidgets();
    setupMapWidget();
}

function setupStatisticsWidgets() {
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
        card.addEventListener('click', function() {
            const statType = this.getAttribute('data-stat-type');
            if (statType) {
                showStatisticDetails(statType);
            }
        });
    });
}

function showStatisticDetails(statType) {
    console.log('Showing details for:', statType);
    
    // Create modal with detailed statistics
    const modal = document.createElement('div');
    modal.className = 'admin-modal';
    modal.innerHTML = `
        <div class="admin-modal-content">
            <div class="admin-modal-header">
                <h3 class="admin-modal-title">${getStatisticTitle(statType)} Details</h3>
                <button class="admin-modal-close" onclick="this.closest('.admin-modal').remove()">&times;</button>
            </div>
            <div class="admin-modal-body">
                <div class="stat-details-chart">
                    <div class="chart-placeholder">
                        Detailed ${statType} chart would be displayed here
                    </div>
                </div>
                <div class="stat-details-breakdown">
                    <h4>Breakdown</h4>
                    <div class="breakdown-list">
                        ${getStatisticBreakdown(statType)}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function getStatisticTitle(statType) {
    const titles = {
        rides: 'Total Rides',
        drivers: 'Active Drivers',
        revenue: 'Total Revenue',
        users: 'User Growth'
    };
    return titles[statType] || 'Statistics';
}

function getStatisticBreakdown(statType) {
    const breakdowns = {
        rides: `
            <div class="breakdown-item">
                <span>Today</span>
                <span>245 rides</span>
            </div>
            <div class="breakdown-item">
                <span>This Week</span>
                <span>1,847 rides</span>
            </div>
            <div class="breakdown-item">
                <span>This Month</span>
                <span>7,234 rides</span>
            </div>
        `,
        drivers: `
            <div class="breakdown-item">
                <span>Online Now</span>
                <span>142 drivers</span>
            </div>
            <div class="breakdown-item">
                <span>Offline</span>
                <span>58 drivers</span>
            </div>
            <div class="breakdown-item">
                <span>Total Registered</span>
                <span>200 drivers</span>
            </div>
        `
    };
    
    return breakdowns[statType] || '<div>No breakdown available</div>';
}

function setupChartWidgets() {
    const chartContainers = document.querySelectorAll('.chart-container');
    chartContainers.forEach(container => {
        const chartType = container.getAttribute('data-chart-type');
        if (chartType) {
            initializeChart(container, chartType);
        }
    });
}

function initializeChart(container, chartType) {
    console.log('Initializing chart:', chartType);
    
    // In a real application, you would use Chart.js or similar
    const placeholder = container.querySelector('.chart-placeholder');
    if (placeholder) {
        placeholder.innerHTML = `
            <div class="chart-mock">
                <div class="chart-title">${getChartTitle(chartType)}</div>
                <div class="chart-visual">
                    ${getChartVisual(chartType)}
                </div>
            </div>
        `;
    }
}

function getChartTitle(chartType) {
    const titles = {
        rides: 'Rides Over Time',
        revenue: 'Revenue Trends',
        drivers: 'Driver Activity',
        users: 'User Growth'
    };
    return titles[chartType] || 'Chart';
}

function getChartVisual(chartType) {
    // Simple ASCII-style chart representation
    return `
        <div class="chart-bars">
            <div class="chart-bar" style="height: 60%"></div>
            <div class="chart-bar" style="height: 80%"></div>
            <div class="chart-bar" style="height: 45%"></div>
            <div class="chart-bar" style="height: 90%"></div>
            <div class="chart-bar" style="height: 70%"></div>
            <div class="chart-bar" style="height: 85%"></div>
        </div>
    `;
}

function setupTableWidgets() {
    const tables = document.querySelectorAll('.data-table');
    tables.forEach(table => {
        setupTableSorting(table);
        setupTablePagination(table);
    });
}

function setupTableSorting(table) {
    const headers = table.querySelectorAll('th[data-sortable]');
    headers.forEach(header => {
        header.addEventListener('click', function() {
            const column = this.getAttribute('data-sortable');
            const direction = this.getAttribute('data-sort-direction') || 'asc';
            const newDirection = direction === 'asc' ? 'desc' : 'asc';
            
            // Update sort direction
            this.setAttribute('data-sort-direction', newDirection);
            
            // Sort table
            sortTable(table, column, newDirection);
        });
    });
}

function sortTable(table, column, direction) {
    console.log('Sorting table by:', column, direction);
    
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    rows.sort((a, b) => {
        const aValue = a.querySelector(`[data-column="${column}"]`)?.textContent || '';
        const bValue = b.querySelector(`[data-column="${column}"]`)?.textContent || '';
        
        if (direction === 'asc') {
            return aValue.localeCompare(bValue);
        } else {
            return bValue.localeCompare(aValue);
        }
    });
    
    // Clear tbody and append sorted rows
    tbody.innerHTML = '';
    rows.forEach(row => tbody.appendChild(row));
}

function setupTablePagination(table) {
    const paginationContainer = table.parentElement.querySelector('.table-pagination');
    if (paginationContainer) {
        // Setup pagination controls
        const totalRows = table.querySelectorAll('tbody tr').length;
        const rowsPerPage = 10;
        const totalPages = Math.ceil(totalRows / rowsPerPage);
        
        createPaginationControls(paginationContainer, totalPages);
    }
}

function createPaginationControls(container, totalPages) {
    let currentPage = 1;
    
    const pagination = document.createElement('div');
    pagination.className = 'admin-pagination';
    
    function updatePagination() {
        pagination.innerHTML = `
            <button class="admin-pagination-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">
                Previous
            </button>
            ${Array.from({length: totalPages}, (_, i) => `
                <button class="admin-pagination-btn ${i + 1 === currentPage ? 'active' : ''}" onclick="changePage(${i + 1})">
                    ${i + 1}
                </button>
            `).join('')}
            <button class="admin-pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">
                Next
            </button>
        `;
    }
    
    window.changePage = function(page) {
        if (page >= 1 && page <= totalPages) {
            currentPage = page;
            updatePagination();
            // Here you would update the table to show the correct rows
        }
    };
    
    updatePagination();
    container.appendChild(pagination);
}

function setupMapWidget() {
    const mapContainer = document.getElementById('map-container');
    if (mapContainer) {
        // Initialize map (would use Google Maps, Mapbox, etc. in real app)
        mapContainer.innerHTML = `
            <div class="map-placeholder">
                <div class="map-title">Live Driver Locations</div>
                <div class="map-content">
                    <div class="map-marker" style="top: 30%; left: 40%;">🚗</div>
                    <div class="map-marker" style="top: 60%; left: 70%;">🚗</div>
                    <div class="map-marker" style="top: 45%; left: 25%;">🚗</div>
                    <div class="map-marker" style="top: 80%; left: 60%;">🚗</div>
                </div>
            </div>
        `;
    }
}

// Data loading functions
function loadOverviewData() {
    console.log('Loading overview data...');
    // This would load overview-specific data
}

function loadRidesData() {
    console.log('Loading rides data...');
    // This would load rides-specific data
}

function loadDriversData() {
    console.log('Loading drivers data...');
    // This would load drivers-specific data
}

function loadUsersData() {
    console.log('Loading users data...');
    // This would load users-specific data
}

function loadPaymentsData() {
    console.log('Loading payments data...');
    // This would load payments-specific data
}

function loadReportsData() {
    console.log('Loading reports data...');
    // This would load reports-specific data
}

function loadSettingsData() {
    console.log('Loading settings data...');
    // This would load settings-specific data
}

// Loading states
function showLoadingState(context) {
    const loadingElements = document.querySelectorAll(`.loading-${context}`);
    loadingElements.forEach(el => {
        el.classList.add('loading');
    });
}

function hideLoadingState(context) {
    const loadingElements = document.querySelectorAll(`.loading-${context}`);
    loadingElements.forEach(el => {
        el.classList.remove('loading');
    });
}

// Live statistics updates
function updateLiveStatistics() {
    // Simulate real-time updates
    const stats = {
        totalRides: Math.floor(Math.random() * 100) + 12800,
        activeDrivers: Math.floor(Math.random() * 20) + 130,
        revenue: Math.floor(Math.random() * 1000) + 45000,
        userGrowth: (Math.random() * 5 + 20).toFixed(1)
    };
    
    updateDashboardStats(stats);
}

// Dashboard shortcuts
function setupDashboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'r':
                    e.preventDefault();
                    refreshDashboardData();
                    break;
                case 'n':
                    e.preventDefault();
                    showQuickAddModal();
                    break;
                case 'f':
                    e.preventDefault();
                    focusSearchInput();
                    break;
            }
        }
    });
}

function showQuickAddModal() {
    const modal = document.createElement('div');
    modal.className = 'admin-modal';
    modal.innerHTML = `
        <div class="admin-modal-content">
            <div class="admin-modal-header">
                <h3 class="admin-modal-title">Quick Add</h3>
                <button class="admin-modal-close" onclick="this.closest('.admin-modal').remove()">&times;</button>
            </div>
            <div class="admin-modal-body">
                <div class="quick-add-options">
                    <button class="btn btn-primary" onclick="showAddDriverForm()">Add Driver</button>
                    <button class="btn btn-secondary" onclick="showAddRideForm()">Add Ride</button>
                    <button class="btn btn-accent" onclick="showAddUserForm()">Add User</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function focusSearchInput() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.focus();
        searchInput.select();
    }
}

// Data refresh
function setupDataRefresh() {
    const refreshButton = document.getElementById('refresh-button');
    if (refreshButton) {
        refreshButton.addEventListener('click', function() {
            this.classList.add('spinning');
            refreshDashboardData();
            
            setTimeout(() => {
                this.classList.remove('spinning');
            }, 1000);
        });
    }
}

// Export dashboard functions
window.ElyteAdmin = window.ElyteAdmin || {};
window.ElyteAdmin.Dashboard = {
    switchView: switchDashboardView,
    refresh: refreshDashboardData,
    applyFilters: applyDashboardFilters,
    showStatDetails: showStatisticDetails,
    loadViewData: loadViewData
};