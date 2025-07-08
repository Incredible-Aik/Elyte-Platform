// Admin JavaScript - Admin-specific functionality for Elyte Platform

// Admin state management
let adminState = {
    currentUser: null,
    permissions: [],
    auditLog: [],
    bulkActions: [],
    selectedItems: new Set(),
    currentModal: null
};

// Initialize admin functionality
document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('.admin-dashboard')) {
        initializeAdminPanel();
    }
});

function initializeAdminPanel() {
    console.log('Initializing admin panel...');
    
    // Load admin user info
    loadAdminUserInfo();
    
    // Setup admin forms
    setupAdminForms();
    
    // Setup admin tables
    setupAdminTables();
    
    // Setup admin modals
    setupAdminModals();
    
    // Setup bulk actions
    setupBulkActions();
    
    // Setup admin search
    setupAdminSearch();
    
    // Setup admin alerts
    setupAdminAlerts();
    
    // Setup admin permissions
    setupAdminPermissions();
    
    // Setup audit logging
    setupAuditLogging();
    
    console.log('Admin panel initialized');
}

// Admin user management
function loadAdminUserInfo() {
    // Simulate loading admin user
    adminState.currentUser = {
        id: 1,
        name: 'Admin User',
        email: 'admin@elyte.com',
        role: 'super_admin',
        permissions: ['manage_drivers', 'manage_users', 'view_reports', 'manage_settings'],
        lastLogin: new Date(),
        avatar: '/images/avatars/admin1.jpg'
    };
    
    adminState.permissions = adminState.currentUser.permissions;
    
    // Update UI with admin info
    updateAdminUserUI();
}

function updateAdminUserUI() {
    const adminName = document.getElementById('admin-name');
    const adminEmail = document.getElementById('admin-email');
    const adminAvatar = document.getElementById('admin-avatar');
    
    if (adminName) adminName.textContent = adminState.currentUser.name;
    if (adminEmail) adminEmail.textContent = adminState.currentUser.email;
    if (adminAvatar) adminAvatar.src = adminState.currentUser.avatar;
    
    // Update permissions in UI
    updatePermissionBadges();
}

function updatePermissionBadges() {
    const permissionContainer = document.getElementById('admin-permissions');
    if (permissionContainer) {
        permissionContainer.innerHTML = adminState.permissions.map(permission => `
            <span class="admin-badge primary">${formatPermission(permission)}</span>
        `).join('');
    }
}

function formatPermission(permission) {
    return permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Admin forms
function setupAdminForms() {
    const adminForms = document.querySelectorAll('.admin-form');
    adminForms.forEach(form => {
        setupFormValidation(form);
        setupFormSubmission(form);
        setupFormAutoSave(form);
    });
}

function setupFormValidation(form) {
    const inputs = form.querySelectorAll('.form-input, .form-select, .form-textarea');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
        
        input.addEventListener('input', function() {
            clearFieldError(this);
        });
    });
}

function validateField(field) {
    const value = field.value.trim();
    const required = field.hasAttribute('required');
    const type = field.getAttribute('type');
    const minLength = field.getAttribute('minlength');
    const maxLength = field.getAttribute('maxlength');
    
    // Clear previous errors
    clearFieldError(field);
    
    // Required validation
    if (required && !value) {
        showFieldError(field, 'This field is required');
        return false;
    }
    
    // Email validation
    if (type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            showFieldError(field, 'Please enter a valid email address');
            return false;
        }
    }
    
    // Length validation
    if (minLength && value.length < parseInt(minLength)) {
        showFieldError(field, `Minimum length is ${minLength} characters`);
        return false;
    }
    
    if (maxLength && value.length > parseInt(maxLength)) {
        showFieldError(field, `Maximum length is ${maxLength} characters`);
        return false;
    }
    
    return true;
}

function showFieldError(field, message) {
    const errorElement = field.parentElement.querySelector('.form-error');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
    
    field.classList.add('error');
}

function clearFieldError(field) {
    const errorElement = field.parentElement.querySelector('.form-error');
    if (errorElement) {
        errorElement.style.display = 'none';
    }
    
    field.classList.remove('error');
}

function setupFormSubmission(form) {
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validate all fields
        const inputs = form.querySelectorAll('.form-input, .form-select, .form-textarea');
        let isValid = true;
        
        inputs.forEach(input => {
            if (!validateField(input)) {
                isValid = false;
            }
        });
        
        if (isValid) {
            submitAdminForm(form);
        } else {
            showAdminAlert('Please fix the errors in the form', 'error');
        }
    });
}

function submitAdminForm(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    const formType = form.getAttribute('data-form-type');
    
    console.log('Submitting admin form:', formType, data);
    
    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Saving...';
    submitButton.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        // Reset button
        submitButton.textContent = originalText;
        submitButton.disabled = false;
        
        // Show success message
        showAdminAlert('Form submitted successfully', 'success');
        
        // Log action
        logAdminAction('form_submit', { formType, data });
        
        // Close modal if in modal
        const modal = form.closest('.admin-modal');
        if (modal) {
            modal.remove();
        }
        
        // Refresh data
        refreshAdminData();
    }, 1000);
}

function setupFormAutoSave(form) {
    let autoSaveTimer;
    const inputs = form.querySelectorAll('.form-input, .form-select, .form-textarea');
    
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            clearTimeout(autoSaveTimer);
            autoSaveTimer = setTimeout(() => {
                autoSaveForm(form);
            }, 2000);
        });
    });
}

function autoSaveForm(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Save to localStorage
    const formId = form.getAttribute('id') || 'admin-form';
    localStorage.setItem(`autosave_${formId}`, JSON.stringify(data));
    
    // Show auto-save indicator
    showAutoSaveIndicator();
}

function showAutoSaveIndicator() {
    const indicator = document.getElementById('autosave-indicator');
    if (indicator) {
        indicator.textContent = 'Auto-saved';
        indicator.style.opacity = '1';
        
        setTimeout(() => {
            indicator.style.opacity = '0';
        }, 2000);
    }
}

// Admin tables
function setupAdminTables() {
    const adminTables = document.querySelectorAll('.admin-table');
    adminTables.forEach(table => {
        setupTableActions(table);
        setupTableFilters(table);
        setupTableExport(table);
    });
}

function setupTableActions(table) {
    // Row actions
    const actionButtons = table.querySelectorAll('.table-action');
    actionButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            
            const action = this.getAttribute('data-action');
            const rowId = this.closest('tr').getAttribute('data-row-id');
            
            handleTableAction(action, rowId);
        });
    });
    
    // Row selection
    const checkboxes = table.querySelectorAll('.row-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const rowId = this.closest('tr').getAttribute('data-row-id');
            
            if (this.checked) {
                adminState.selectedItems.add(rowId);
            } else {
                adminState.selectedItems.delete(rowId);
            }
            
            updateBulkActionButtons();
        });
    });
    
    // Select all checkbox
    const selectAllCheckbox = table.querySelector('.select-all-checkbox');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            const checkboxes = table.querySelectorAll('.row-checkbox');
            checkboxes.forEach(checkbox => {
                checkbox.checked = this.checked;
                
                const rowId = checkbox.closest('tr').getAttribute('data-row-id');
                if (this.checked) {
                    adminState.selectedItems.add(rowId);
                } else {
                    adminState.selectedItems.delete(rowId);
                }
            });
            
            updateBulkActionButtons();
        });
    }
}

function handleTableAction(action, rowId) {
    console.log('Table action:', action, 'Row ID:', rowId);
    
    switch (action) {
        case 'view':
            viewRecord(rowId);
            break;
        case 'edit':
            editRecord(rowId);
            break;
        case 'delete':
            deleteRecord(rowId);
            break;
        case 'activate':
            activateRecord(rowId);
            break;
        case 'deactivate':
            deactivateRecord(rowId);
            break;
        default:
            console.log('Unknown action:', action);
    }
}

function viewRecord(rowId) {
    console.log('Viewing record:', rowId);
    // Implementation for viewing record
}

function editRecord(rowId) {
    console.log('Editing record:', rowId);
    // Implementation for editing record
}

function deleteRecord(rowId) {
    if (confirm('Are you sure you want to delete this record?')) {
        console.log('Deleting record:', rowId);
        
        // Log action
        logAdminAction('record_delete', { recordId: rowId });
        
        // Show success message
        showAdminAlert('Record deleted successfully', 'success');
        
        // Refresh table
        refreshAdminData();
    }
}

function activateRecord(rowId) {
    console.log('Activating record:', rowId);
    logAdminAction('record_activate', { recordId: rowId });
    showAdminAlert('Record activated successfully', 'success');
}

function deactivateRecord(rowId) {
    console.log('Deactivating record:', rowId);
    logAdminAction('record_deactivate', { recordId: rowId });
    showAdminAlert('Record deactivated successfully', 'success');
}

function setupTableFilters(table) {
    const filterInputs = table.parentElement.querySelectorAll('.table-filter');
    filterInputs.forEach(input => {
        input.addEventListener('input', debounce(function() {
            filterTable(table, this.value);
        }, 300));
    });
}

function filterTable(table, filterValue) {
    const rows = table.querySelectorAll('tbody tr');
    const searchTerm = filterValue.toLowerCase();
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        const isVisible = text.includes(searchTerm);
        row.style.display = isVisible ? '' : 'none';
    });
}

function setupTableExport(table) {
    const exportButton = table.parentElement.querySelector('.export-table');
    if (exportButton) {
        exportButton.addEventListener('click', function() {
            const format = this.getAttribute('data-format') || 'csv';
            exportTable(table, format);
        });
    }
}

function exportTable(table, format) {
    console.log('Exporting table as:', format);
    
    const rows = table.querySelectorAll('tr');
    const data = [];
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('th, td');
        const rowData = Array.from(cells).map(cell => cell.textContent.trim());
        data.push(rowData);
    });
    
    if (format === 'csv') {
        downloadCSV(data, 'admin-export.csv');
    } else if (format === 'json') {
        downloadJSON(data, 'admin-export.json');
    }
    
    // Log action
    logAdminAction('table_export', { format, rowCount: data.length });
}

function downloadCSV(data, filename) {
    const csvContent = data.map(row => 
        row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function downloadJSON(data, filename) {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// Admin modals
function setupAdminModals() {
    // Modal triggers
    const modalTriggers = document.querySelectorAll('[data-modal-trigger]');
    modalTriggers.forEach(trigger => {
        trigger.addEventListener('click', function() {
            const modalId = this.getAttribute('data-modal-trigger');
            showAdminModal(modalId);
        });
    });
    
    // Modal close buttons
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('admin-modal-close')) {
            const modal = e.target.closest('.admin-modal');
            if (modal) {
                hideAdminModal(modal);
            }
        }
    });
    
    // Modal overlay click
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('admin-modal')) {
            hideAdminModal(e.target);
        }
    });
}

function showAdminModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        adminState.currentModal = modalId;
        
        // Focus first input
        const firstInput = modal.querySelector('.form-input, .form-select, .form-textarea');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
}

function hideAdminModal(modal) {
    if (typeof modal === 'string') {
        modal = document.getElementById(modal);
    }
    
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
        adminState.currentModal = null;
    }
}

// Bulk actions
function setupBulkActions() {
    const bulkActionButtons = document.querySelectorAll('.bulk-action-btn');
    bulkActionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const action = this.getAttribute('data-bulk-action');
            handleBulkAction(action);
        });
    });
}

function updateBulkActionButtons() {
    const bulkActionContainer = document.getElementById('bulk-actions');
    const selectedCount = adminState.selectedItems.size;
    
    if (bulkActionContainer) {
        if (selectedCount > 0) {
            bulkActionContainer.style.display = 'block';
            bulkActionContainer.querySelector('.selected-count').textContent = selectedCount;
        } else {
            bulkActionContainer.style.display = 'none';
        }
    }
}

function handleBulkAction(action) {
    const selectedIds = Array.from(adminState.selectedItems);
    
    if (selectedIds.length === 0) {
        showAdminAlert('Please select items to perform bulk action', 'warning');
        return;
    }
    
    const confirmMessage = `Are you sure you want to ${action} ${selectedIds.length} item(s)?`;
    if (confirm(confirmMessage)) {
        console.log('Bulk action:', action, 'Items:', selectedIds);
        
        // Log action
        logAdminAction('bulk_action', { action, itemCount: selectedIds.length });
        
        // Show success message
        showAdminAlert(`Bulk ${action} completed successfully`, 'success');
        
        // Clear selection
        adminState.selectedItems.clear();
        updateBulkActionButtons();
        
        // Refresh data
        refreshAdminData();
    }
}

// Admin search
function setupAdminSearch() {
    const searchInput = document.getElementById('admin-search');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function() {
            performAdminSearch(this.value);
        }, 300));
    }
}

function performAdminSearch(query) {
    console.log('Admin search:', query);
    
    if (query.length < 2) {
        clearSearchResults();
        return;
    }
    
    // Show loading state
    showSearchLoading();
    
    // Simulate search
    setTimeout(() => {
        const results = simulateSearchResults(query);
        showSearchResults(results);
    }, 500);
}

function simulateSearchResults(query) {
    const allResults = [
        { type: 'driver', id: 1, name: 'John Doe', email: 'john@example.com' },
        { type: 'user', id: 2, name: 'Jane Smith', email: 'jane@example.com' },
        { type: 'ride', id: 3, name: 'Ride #12345', description: 'Downtown to Airport' },
        { type: 'payment', id: 4, name: 'Payment #54321', amount: '$25.50' }
    ];
    
    return allResults.filter(item => 
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.email?.toLowerCase().includes(query.toLowerCase())
    );
}

function showSearchResults(results) {
    const resultsContainer = document.getElementById('search-results');
    if (resultsContainer) {
        resultsContainer.innerHTML = results.map(result => `
            <div class="search-result-item" data-type="${result.type}" data-id="${result.id}">
                <div class="search-result-icon">${getSearchResultIcon(result.type)}</div>
                <div class="search-result-content">
                    <div class="search-result-title">${result.name}</div>
                    <div class="search-result-subtitle">${result.email || result.description || result.amount || ''}</div>
                </div>
            </div>
        `).join('');
        
        resultsContainer.style.display = 'block';
    }
}

function getSearchResultIcon(type) {
    const icons = {
        driver: '👨‍💼',
        user: '👤',
        ride: '🚗',
        payment: '💳'
    };
    return icons[type] || '📄';
}

function clearSearchResults() {
    const resultsContainer = document.getElementById('search-results');
    if (resultsContainer) {
        resultsContainer.style.display = 'none';
    }
}

function showSearchLoading() {
    const resultsContainer = document.getElementById('search-results');
    if (resultsContainer) {
        resultsContainer.innerHTML = '<div class="search-loading">Searching...</div>';
        resultsContainer.style.display = 'block';
    }
}

// Admin alerts
function setupAdminAlerts() {
    // Auto-hide alerts after 5 seconds
    const existingAlerts = document.querySelectorAll('.admin-alert');
    existingAlerts.forEach(alert => {
        setTimeout(() => {
            alert.style.opacity = '0';
            setTimeout(() => alert.remove(), 300);
        }, 5000);
    });
}

function showAdminAlert(message, type = 'info') {
    const alert = document.createElement('div');
    alert.className = `admin-alert ${type}`;
    alert.innerHTML = `
        <div class="admin-alert-icon">${getAlertIcon(type)}</div>
        <div class="admin-alert-content">
            <div class="admin-alert-message">${message}</div>
        </div>
        <button class="admin-alert-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    document.body.appendChild(alert);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        alert.style.opacity = '0';
        setTimeout(() => alert.remove(), 300);
    }, 5000);
}

function getAlertIcon(type) {
    const icons = {
        success: '✅',
        warning: '⚠️',
        error: '❌',
        info: 'ℹ️'
    };
    return icons[type] || 'ℹ️';
}

// Admin permissions
function setupAdminPermissions() {
    // Check permissions for all interactive elements
    const permissionElements = document.querySelectorAll('[data-permission]');
    permissionElements.forEach(element => {
        const requiredPermission = element.getAttribute('data-permission');
        if (!hasPermission(requiredPermission)) {
            element.style.display = 'none';
        }
    });
}

function hasPermission(permission) {
    return adminState.permissions.includes(permission);
}

// Audit logging
function setupAuditLogging() {
    // Log page views
    logAdminAction('page_view', { page: window.location.pathname });
}

function logAdminAction(action, details = {}) {
    const logEntry = {
        id: Date.now(),
        action: action,
        details: details,
        user: adminState.currentUser?.name || 'Unknown',
        timestamp: new Date().toISOString(),
        ip: '127.0.0.1', // Would be actual IP in real app
        userAgent: navigator.userAgent
    };
    
    adminState.auditLog.push(logEntry);
    console.log('Admin action logged:', logEntry);
    
    // In a real app, you would send this to the server
    // sendAuditLog(logEntry);
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

function refreshAdminData() {
    console.log('Refreshing admin data...');
    // Implementation for refreshing admin data
}

// Export admin functions
window.ElyteAdmin = window.ElyteAdmin || {};
window.ElyteAdmin.Admin = {
    showModal: showAdminModal,
    hideModal: hideAdminModal,
    showAlert: showAdminAlert,
    logAction: logAdminAction,
    hasPermission: hasPermission,
    refreshData: refreshAdminData,
    getAuditLog: () => adminState.auditLog,
    getSelectedItems: () => Array.from(adminState.selectedItems)
};