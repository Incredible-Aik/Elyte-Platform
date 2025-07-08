// Dashboard functionality for Elyte Platform

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const user = ElyteApp.storage.get('user');
    if (!user) {
        window.location.href = 'passenger-login.html';
        return;
    }
    
    // Initialize based on user type
    if (user.type === 'driver') {
        initializeDriverDashboard();
    } else {
        initializePassengerDashboard();
    }
    
    // Add logout functionality
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
});

// Passenger Dashboard Initialization
function initializePassengerDashboard() {
    const bookingForm = document.getElementById('bookingForm');
    
    if (bookingForm) {
        // Initialize ride type selection
        initializeRideTypeSelection();
        
        // Initialize payment method selection
        initializePaymentMethodSelection();
        
        // Handle form submission
        bookingForm.addEventListener('submit', handleRideBooking);
    }
    
    // Load ride history
    loadRideHistory();
    
    // Initialize map (placeholder for now)
    initializeMap();
}

// Driver Dashboard Initialization
function initializeDriverDashboard() {
    const statusToggle = document.getElementById('statusToggle');
    
    if (statusToggle) {
        statusToggle.addEventListener('click', toggleDriverStatus);
    }
    
    // Load driver stats
    loadDriverStats();
    
    // Load recent rides
    loadRecentRides();
    
    // Initialize driver map
    initializeDriverMap();
    
    // Check for ride requests periodically
    setInterval(checkForRideRequests, 5000);
}

// Ride Type Selection
function initializeRideTypeSelection() {
    const rideTypeCards = document.querySelectorAll('.ride-type-card');
    
    rideTypeCards.forEach(card => {
        card.addEventListener('click', function() {
            // Remove selection from all cards
            rideTypeCards.forEach(c => c.classList.remove('selected'));
            
            // Add selection to clicked card
            this.classList.add('selected');
            
            // Store selected ride type
            const rideType = this.dataset.type;
            ElyteApp.storage.set('selectedRideType', rideType);
        });
    });
    
    // Select default ride type
    if (rideTypeCards.length > 0) {
        rideTypeCards[0].click();
    }
}

// Payment Method Selection
function initializePaymentMethodSelection() {
    const paymentOptions = document.querySelectorAll('.payment-option');
    
    paymentOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove selection from all options
            paymentOptions.forEach(o => o.classList.remove('selected'));
            
            // Add selection to clicked option
            this.classList.add('selected');
            
            // Store selected payment method
            const paymentMethod = this.dataset.method;
            ElyteApp.storage.set('selectedPaymentMethod', paymentMethod);
        });
    });
    
    // Select default payment method
    if (paymentOptions.length > 0) {
        paymentOptions[0].click();
    }
}

// Handle Ride Booking
async function handleRideBooking(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const pickup = formData.get('pickup');
    const destination = formData.get('destination');
    const rideType = ElyteApp.storage.get('selectedRideType');
    const paymentMethod = ElyteApp.storage.get('selectedPaymentMethod');
    
    // Validate inputs
    if (!pickup || !destination) {
        ElyteApp.showNotification('Please enter both pickup and destination locations', 'error');
        return;
    }
    
    if (!rideType) {
        ElyteApp.showNotification('Please select a ride type', 'error');
        return;
    }
    
    if (!paymentMethod) {
        ElyteApp.showNotification('Please select a payment method', 'error');
        return;
    }
    
    const submitButton = e.target.querySelector('button[type="submit"]');
    const hideLoading = ElyteApp.showLoading(submitButton);
    
    try {
        const response = await ElyteApp.api.post('/rides/book', {
            pickup,
            destination,
            rideType,
            paymentMethod
        });
        
        if (response.success) {
            ElyteApp.showNotification('Ride booked successfully! Finding driver...', 'success');
            
            // Show ride tracking interface
            showRideTracking(response.ride);
            
            // Clear form
            e.target.reset();
            
            // Reset selections
            document.querySelectorAll('.ride-type-card').forEach(card => {
                card.classList.remove('selected');
            });
            document.querySelectorAll('.payment-option').forEach(option => {
                option.classList.remove('selected');
            });
            
            // Reselect defaults
            initializeRideTypeSelection();
            initializePaymentMethodSelection();
            
        } else {
            ElyteApp.showNotification(response.message || 'Failed to book ride', 'error');
        }
    } catch (error) {
        console.error('Booking error:', error);
        ElyteApp.showNotification('Failed to book ride. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

// Show Ride Tracking
function showRideTracking(ride) {
    const trackingHTML = `
        <div class="ride-tracking" id="rideTracking">
            <div class="tracking-header">
                <h3>Ride in Progress</h3>
                <button class="close-tracking" onclick="closeRideTracking()">×</button>
            </div>
            <div class="tracking-content">
                <div class="driver-info">
                    <div class="driver-avatar">👤</div>
                    <div class="driver-details">
                        <h4>${ride.driver?.name || 'Finding driver...'}</h4>
                        <p>${ride.driver?.vehicle || 'Please wait'}</p>
                        <p>★ ${ride.driver?.rating || 'N/A'}</p>
                    </div>
                </div>
                <div class="ride-status">
                    <p class="status-text">${ride.status || 'Finding driver...'}</p>
                    <div class="status-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${getRideProgress(ride.status)}%"></div>
                        </div>
                    </div>
                </div>
                <div class="ride-details">
                    <p><strong>From:</strong> ${ride.pickup}</p>
                    <p><strong>To:</strong> ${ride.destination}</p>
                    <p><strong>Fare:</strong> GHS ${ride.fare}</p>
                </div>
            </div>
        </div>
    `;
    
    // Add to page
    const dashboardMain = document.querySelector('.dashboard-main');
    dashboardMain.insertAdjacentHTML('afterbegin', trackingHTML);
    
    // Start tracking updates
    startRideTracking(ride.id);
}

// Close Ride Tracking
function closeRideTracking() {
    const trackingElement = document.getElementById('rideTracking');
    if (trackingElement) {
        trackingElement.remove();
    }
}

// Get ride progress percentage
function getRideProgress(status) {
    const progressMap = {
        'finding_driver': 25,
        'driver_assigned': 50,
        'driver_arriving': 75,
        'ride_started': 90,
        'completed': 100
    };
    
    return progressMap[status] || 0;
}

// Start ride tracking
function startRideTracking(rideId) {
    const trackingInterval = setInterval(async () => {
        try {
            const response = await ElyteApp.api.get(`/rides/${rideId}/status`);
            
            if (response.success) {
                updateRideTracking(response.ride);
                
                if (response.ride.status === 'completed' || response.ride.status === 'cancelled') {
                    clearInterval(trackingInterval);
                    
                    if (response.ride.status === 'completed') {
                        showRideCompletedModal(response.ride);
                    }
                }
            }
        } catch (error) {
            console.error('Tracking error:', error);
        }
    }, 3000);
}

// Update ride tracking display
function updateRideTracking(ride) {
    const trackingElement = document.getElementById('rideTracking');
    if (!trackingElement) return;
    
    const statusText = trackingElement.querySelector('.status-text');
    const progressFill = trackingElement.querySelector('.progress-fill');
    const driverDetails = trackingElement.querySelector('.driver-details');
    
    if (statusText) {
        statusText.textContent = ride.status || 'Finding driver...';
    }
    
    if (progressFill) {
        progressFill.style.width = `${getRideProgress(ride.status)}%`;
    }
    
    if (driverDetails && ride.driver) {
        driverDetails.innerHTML = `
            <h4>${ride.driver.name}</h4>
            <p>${ride.driver.vehicle}</p>
            <p>★ ${ride.driver.rating}</p>
        `;
    }
}

// Show ride completed modal
function showRideCompletedModal(ride) {
    const modalHTML = `
        <div class="modal" id="rideCompletedModal" style="display: block;">
            <div class="modal-content">
                <h3>Ride Completed!</h3>
                <div class="ride-summary">
                    <p><strong>From:</strong> ${ride.pickup}</p>
                    <p><strong>To:</strong> ${ride.destination}</p>
                    <p><strong>Total Fare:</strong> GHS ${ride.fare}</p>
                    <p><strong>Driver:</strong> ${ride.driver.name}</p>
                </div>
                <div class="rating-section">
                    <h4>Rate your driver</h4>
                    <div class="star-rating" data-rating="0">
                        <span class="star" data-value="1">★</span>
                        <span class="star" data-value="2">★</span>
                        <span class="star" data-value="3">★</span>
                        <span class="star" data-value="4">★</span>
                        <span class="star" data-value="5">★</span>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-primary" onclick="submitRating('${ride.id}')">Submit Rating</button>
                    <button class="btn btn-secondary" onclick="closeRideCompletedModal()">Close</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Initialize star rating
    initializeStarRating();
    
    // Close ride tracking
    closeRideTracking();
}

// Initialize star rating
function initializeStarRating() {
    const stars = document.querySelectorAll('.star');
    const ratingContainer = document.querySelector('.star-rating');
    
    stars.forEach(star => {
        star.addEventListener('click', function() {
            const rating = parseInt(this.dataset.value);
            ratingContainer.dataset.rating = rating;
            
            stars.forEach((s, index) => {
                if (index < rating) {
                    s.style.color = '#f39c12';
                } else {
                    s.style.color = '#ddd';
                }
            });
        });
    });
}

// Submit rating
async function submitRating(rideId) {
    const rating = parseInt(document.querySelector('.star-rating').dataset.rating);
    
    if (rating === 0) {
        ElyteApp.showNotification('Please select a rating', 'error');
        return;
    }
    
    try {
        const response = await ElyteApp.api.post(`/rides/${rideId}/rate`, { rating });
        
        if (response.success) {
            ElyteApp.showNotification('Thank you for your rating!', 'success');
            closeRideCompletedModal();
            loadRideHistory(); // Refresh ride history
        } else {
            ElyteApp.showNotification('Failed to submit rating', 'error');
        }
    } catch (error) {
        console.error('Rating error:', error);
        ElyteApp.showNotification('Failed to submit rating', 'error');
    }
}

// Close ride completed modal
function closeRideCompletedModal() {
    const modal = document.getElementById('rideCompletedModal');
    if (modal) {
        modal.remove();
    }
}

// Load ride history
async function loadRideHistory() {
    try {
        const response = await ElyteApp.api.get('/rides/history');
        
        if (response.success && response.rides) {
            displayRideHistory(response.rides);
        }
    } catch (error) {
        console.error('Failed to load ride history:', error);
    }
}

// Display ride history
function displayRideHistory(rides) {
    const rideHistoryList = document.querySelector('.ride-history-list');
    if (!rideHistoryList) return;
    
    if (rides.length === 0) {
        rideHistoryList.innerHTML = '<p class="no-rides">No rides yet. Book your first ride!</p>';
        return;
    }
    
    rideHistoryList.innerHTML = rides.map(ride => `
        <div class="ride-item">
            <div class="ride-details">
                <h4>${ride.pickup} → ${ride.destination}</h4>
                <p>${formatDate(ride.createdAt)} • GHS ${ride.fare}</p>
            </div>
            <div class="ride-status ${ride.status}">${formatStatus(ride.status)}</div>
        </div>
    `).join('');
}

// Initialize Map (placeholder)
function initializeMap() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;
    
    // This would integrate with a real map service like Google Maps or OpenStreetMap
    mapContainer.innerHTML = `
        <div class="map-placeholder">
            <p>📍 Map integration coming soon</p>
            <p>Your location and nearby drivers will appear here</p>
        </div>
    `;
}

// Initialize Driver Map
function initializeDriverMap() {
    const mapContainer = document.getElementById('driverMap');
    if (!mapContainer) return;
    
    // This would integrate with a real map service
    mapContainer.innerHTML = `
        <div class="map-placeholder">
            <p>📍 Driver Map</p>
            <p>Your location and nearby ride requests will appear here</p>
        </div>
    `;
}

// Toggle Driver Status
async function toggleDriverStatus() {
    const statusButton = document.getElementById('statusToggle');
    const isOnline = statusButton.classList.contains('online');
    
    try {
        const response = await ElyteApp.api.post('/driver/status', {
            status: isOnline ? 'offline' : 'online'
        });
        
        if (response.success) {
            if (isOnline) {
                statusButton.classList.remove('online');
                statusButton.classList.add('offline');
                statusButton.textContent = 'Go Online';
                ElyteApp.showNotification('You are now offline', 'info');
            } else {
                statusButton.classList.remove('offline');
                statusButton.classList.add('online');
                statusButton.textContent = 'Go Offline';
                ElyteApp.showNotification('You are now online', 'success');
            }
        }
    } catch (error) {
        console.error('Status toggle error:', error);
        ElyteApp.showNotification('Failed to update status', 'error');
    }
}

// Load Driver Stats
async function loadDriverStats() {
    try {
        const response = await ElyteApp.api.get('/driver/stats');
        
        if (response.success && response.stats) {
            displayDriverStats(response.stats);
        }
    } catch (error) {
        console.error('Failed to load driver stats:', error);
    }
}

// Display Driver Stats
function displayDriverStats(stats) {
    const statCards = document.querySelectorAll('.stat-card');
    
    statCards.forEach(card => {
        const title = card.querySelector('h3').textContent;
        const valueElement = card.querySelector('.stat-value');
        
        switch (title) {
            case "Today's Earnings":
                valueElement.textContent = `GHS ${stats.todayEarnings || '0.00'}`;
                break;
            case 'Rides Completed':
                valueElement.textContent = stats.ridesCompleted || '0';
                break;
            case 'Rating':
                valueElement.textContent = `${stats.rating || '0.0'} ⭐`;
                break;
            case 'Online Time':
                valueElement.textContent = stats.onlineTime || '0h 0m';
                break;
        }
    });
}

// Load Recent Rides
async function loadRecentRides() {
    try {
        const response = await ElyteApp.api.get('/driver/recent-rides');
        
        if (response.success && response.rides) {
            displayRecentRides(response.rides);
        }
    } catch (error) {
        console.error('Failed to load recent rides:', error);
    }
}

// Display Recent Rides
function displayRecentRides(rides) {
    const rideHistoryList = document.querySelector('.recent-rides .ride-history-list');
    if (!rideHistoryList) return;
    
    if (rides.length === 0) {
        rideHistoryList.innerHTML = '<p class="no-rides">No recent rides</p>';
        return;
    }
    
    rideHistoryList.innerHTML = rides.map(ride => `
        <div class="ride-item">
            <div class="ride-details">
                <h4>Pickup: ${ride.pickup} • Drop: ${ride.destination}</h4>
                <p>${formatDate(ride.createdAt)} • Earned: GHS ${ride.fare}</p>
            </div>
            <div class="ride-rating">
                <span>⭐ ${ride.rating || 'N/A'}</span>
            </div>
        </div>
    `).join('');
}

// Check for Ride Requests
async function checkForRideRequests() {
    const statusButton = document.getElementById('statusToggle');
    const isOnline = statusButton && statusButton.classList.contains('online');
    
    if (!isOnline) return;
    
    try {
        const response = await ElyteApp.api.get('/driver/ride-requests');
        
        if (response.success && response.requests && response.requests.length > 0) {
            showRideRequestModal(response.requests[0]);
        }
    } catch (error) {
        console.error('Failed to check ride requests:', error);
    }
}

// Show Ride Request Modal
function showRideRequestModal(request) {
    const modal = document.getElementById('rideRequestModal');
    if (!modal) return;
    
    // Update modal content
    document.getElementById('requestPickup').textContent = request.pickup;
    document.getElementById('requestDestination').textContent = request.destination;
    document.getElementById('requestDistance').textContent = `${request.distance} km`;
    document.getElementById('requestFare').textContent = `GHS ${request.fare}`;
    
    // Show modal
    modal.style.display = 'block';
    
    // Start countdown timer
    startRequestTimer(request.id);
}

// Start Request Timer
function startRequestTimer(requestId) {
    let timeLeft = 15;
    const timerElement = document.getElementById('timer');
    
    const countdown = setInterval(() => {
        timerElement.textContent = timeLeft;
        timeLeft--;
        
        if (timeLeft < 0) {
            clearInterval(countdown);
            declineRide();
        }
    }, 1000);
    
    // Store timer to clear it if needed
    window.currentRequestTimer = countdown;
}

// Accept Ride
async function acceptRide() {
    const modal = document.getElementById('rideRequestModal');
    const requestId = modal.dataset.requestId;
    
    try {
        const response = await ElyteApp.api.post(`/driver/accept-ride/${requestId}`);
        
        if (response.success) {
            ElyteApp.showNotification('Ride accepted! Navigate to pickup location.', 'success');
            modal.style.display = 'none';
            
            // Clear timer
            if (window.currentRequestTimer) {
                clearInterval(window.currentRequestTimer);
            }
            
            // Start ride tracking for driver
            startDriverRideTracking(response.ride);
        } else {
            ElyteApp.showNotification('Failed to accept ride', 'error');
        }
    } catch (error) {
        console.error('Accept ride error:', error);
        ElyteApp.showNotification('Failed to accept ride', 'error');
    }
}

// Decline Ride
async function declineRide() {
    const modal = document.getElementById('rideRequestModal');
    modal.style.display = 'none';
    
    // Clear timer
    if (window.currentRequestTimer) {
        clearInterval(window.currentRequestTimer);
    }
}

// Start Driver Ride Tracking
function startDriverRideTracking(ride) {
    // This would show the driver interface for managing the ride
    console.log('Starting driver ride tracking for:', ride);
}

// Utility Functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatStatus(status) {
    const statusMap = {
        'completed': 'Completed',
        'cancelled': 'Cancelled',
        'in_progress': 'In Progress',
        'finding_driver': 'Finding Driver'
    };
    
    return statusMap[status] || status;
}

// Export functions to global scope
window.closeRideTracking = closeRideTracking;
window.submitRating = submitRating;
window.closeRideCompletedModal = closeRideCompletedModal;
window.acceptRide = acceptRide;
window.declineRide = declineRide;