// Driver Dashboard specific functionality

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is a driver
    const user = ElyteApp.storage.get('user');
    if (!user || user.type !== 'driver') {
        window.location.href = 'passenger-login.html';
        return;
    }
    
    // Initialize driver dashboard
    initializeDriverDashboard();
    
    // Update driver name
    updateDriverName(user.name);
    
    // Load initial data
    loadDriverData();
});

function initializeDriverDashboard() {
    // Initialize status toggle
    const statusToggle = document.getElementById('statusToggle');
    if (statusToggle) {
        statusToggle.addEventListener('click', toggleDriverStatus);
        
        // Load saved status
        const savedStatus = ElyteApp.storage.get('driverStatus') || 'offline';
        updateStatusButton(savedStatus);
    }
    
    // Initialize ride request modal handlers
    setupRideRequestModal();
    
    // Start checking for ride requests
    if (ElyteApp.storage.get('driverStatus') === 'online') {
        startRideRequestPolling();
    }
}

function updateDriverName(name) {
    const nameElement = document.querySelector('.user-info span');
    if (nameElement) {
        nameElement.textContent = `Welcome, Driver ${name}!`;
    }
}

function updateStatusButton(status) {
    const statusButton = document.getElementById('statusToggle');
    if (!statusButton) return;
    
    if (status === 'online') {
        statusButton.classList.remove('offline');
        statusButton.classList.add('online');
        statusButton.textContent = 'Go Offline';
    } else {
        statusButton.classList.remove('online');
        statusButton.classList.add('offline');
        statusButton.textContent = 'Go Online';
    }
}

async function toggleDriverStatus() {
    const statusButton = document.getElementById('statusToggle');
    const currentStatus = statusButton.classList.contains('online') ? 'online' : 'offline';
    const newStatus = currentStatus === 'online' ? 'offline' : 'online';
    
    const hideLoading = ElyteApp.showLoading(statusButton);
    
    try {
        // For now, we'll simulate the API call
        // In a real app, this would call the actual API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Update status
        updateStatusButton(newStatus);
        ElyteApp.storage.set('driverStatus', newStatus);
        
        if (newStatus === 'online') {
            ElyteApp.showNotification('You are now online and ready to receive rides!', 'success');
            startRideRequestPolling();
        } else {
            ElyteApp.showNotification('You are now offline', 'info');
            stopRideRequestPolling();
        }
        
    } catch (error) {
        console.error('Status toggle error:', error);
        ElyteApp.showNotification('Failed to update status', 'error');
    } finally {
        hideLoading();
    }
}

async function loadDriverData() {
    try {
        // Load driver stats
        await loadDriverStats();
        
        // Load recent rides
        await loadRecentRides();
        
    } catch (error) {
        console.error('Failed to load driver data:', error);
    }
}

async function loadDriverStats() {
    try {
        // Simulate API call with mock data
        const mockStats = {
            todayEarnings: '125.50',
            ridesCompleted: 8,
            rating: 4.8,
            onlineTime: '6h 30m'
        };
        
        updateDriverStats(mockStats);
        
    } catch (error) {
        console.error('Failed to load driver stats:', error);
    }
}

function updateDriverStats(stats) {
    const statCards = document.querySelectorAll('.stat-card');
    
    statCards.forEach(card => {
        const title = card.querySelector('h3').textContent.toLowerCase();
        const valueElement = card.querySelector('.stat-value');
        
        if (title.includes('earnings')) {
            valueElement.textContent = `GHS ${stats.todayEarnings}`;
        } else if (title.includes('rides')) {
            valueElement.textContent = stats.ridesCompleted;
        } else if (title.includes('rating')) {
            valueElement.textContent = `${stats.rating} ⭐`;
        } else if (title.includes('time')) {
            valueElement.textContent = stats.onlineTime;
        }
    });
}

async function loadRecentRides() {
    try {
        // Simulate API call with mock data
        const mockRides = [
            {
                id: 1,
                pickup: 'Osu',
                destination: 'Airport',
                createdAt: '2024-12-15T10:30:00Z',
                fare: '32.00',
                rating: 5.0
            },
            {
                id: 2,
                pickup: 'Tema',
                destination: 'Accra Mall',
                createdAt: '2024-12-15T08:45:00Z',
                fare: '28.50',
                rating: 4.8
            }
        ];
        
        displayRecentRides(mockRides);
        
    } catch (error) {
        console.error('Failed to load recent rides:', error);
    }
}

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
                <span>⭐ ${ride.rating}</span>
            </div>
        </div>
    `).join('');
}

function setupRideRequestModal() {
    const modal = document.getElementById('rideRequestModal');
    if (!modal) return;
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            declineRide();
        }
    });
}

let rideRequestPolling = null;

function startRideRequestPolling() {
    if (rideRequestPolling) return;
    
    rideRequestPolling = setInterval(async () => {
        await checkForRideRequests();
    }, 5000);
}

function stopRideRequestPolling() {
    if (rideRequestPolling) {
        clearInterval(rideRequestPolling);
        rideRequestPolling = null;
    }
}

async function checkForRideRequests() {
    const status = ElyteApp.storage.get('driverStatus');
    if (status !== 'online') return;
    
    try {
        // Simulate checking for ride requests
        // In a real app, this would be an API call
        const hasRequest = Math.random() < 0.1; // 10% chance of getting a request
        
        if (hasRequest) {
            const mockRequest = {
                id: Date.now(),
                pickup: 'Osu Oxford Street',
                destination: 'Kotoka Airport',
                distance: '15.2',
                fare: '32.00',
                passengerName: 'John Doe',
                passengerRating: 4.7
            };
            
            showRideRequestModal(mockRequest);
        }
        
    } catch (error) {
        console.error('Failed to check for ride requests:', error);
    }
}

function showRideRequestModal(request) {
    const modal = document.getElementById('rideRequestModal');
    if (!modal) return;
    
    // Update modal content
    document.getElementById('requestPickup').textContent = request.pickup;
    document.getElementById('requestDestination').textContent = request.destination;
    document.getElementById('requestDistance').textContent = `${request.distance} km`;
    document.getElementById('requestFare').textContent = `GHS ${request.fare}`;
    
    // Store request data
    modal.dataset.requestId = request.id;
    
    // Show modal
    modal.style.display = 'block';
    
    // Start countdown timer
    startRequestTimer();
    
    // Play notification sound (if available)
    playNotificationSound();
}

function startRequestTimer() {
    let timeLeft = 15;
    const timerElement = document.getElementById('timer');
    
    const countdown = setInterval(() => {
        if (timerElement) {
            timerElement.textContent = timeLeft;
        }
        timeLeft--;
        
        if (timeLeft < 0) {
            clearInterval(countdown);
            declineRide();
        }
    }, 1000);
    
    // Store timer to clear it if needed
    window.currentRequestTimer = countdown;
}

function playNotificationSound() {
    try {
        // Create audio context for notification
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
        
    } catch (error) {
        console.log('Could not play notification sound:', error);
    }
}

async function acceptRide() {
    const modal = document.getElementById('rideRequestModal');
    const requestId = modal.dataset.requestId;
    
    // Clear timer
    if (window.currentRequestTimer) {
        clearInterval(window.currentRequestTimer);
    }
    
    try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        ElyteApp.showNotification('Ride accepted! Navigate to pickup location.', 'success');
        modal.style.display = 'none';
        
        // Update ride requests list
        updateRideRequestsList('Ride accepted - Navigate to pickup location');
        
        // In a real app, this would start navigation and ride tracking
        
    } catch (error) {
        console.error('Accept ride error:', error);
        ElyteApp.showNotification('Failed to accept ride', 'error');
    }
}

async function declineRide() {
    const modal = document.getElementById('rideRequestModal');
    
    // Clear timer
    if (window.currentRequestTimer) {
        clearInterval(window.currentRequestTimer);
    }
    
    modal.style.display = 'none';
    
    // Update ride requests list
    updateRideRequestsList('Ride declined - Waiting for new requests');
}

function updateRideRequestsList(message) {
    const rideRequestsList = document.getElementById('rideRequestsList');
    if (!rideRequestsList) return;
    
    rideRequestsList.innerHTML = `
        <div class="ride-request-item">
            <p>${message}</p>
            <small>${new Date().toLocaleTimeString()}</small>
        </div>
    `;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Export functions to global scope
window.acceptRide = acceptRide;
window.declineRide = declineRide;

// Add CSS for ride request animations
const style = document.createElement('style');
style.textContent = `
    .ride-request-item {
        padding: 1rem;
        background-color: #f8f9fa;
        border-radius: 8px;
        margin-bottom: 0.5rem;
        border-left: 4px solid #3498db;
    }
    
    .ride-request-item p {
        margin: 0 0 0.5rem 0;
        font-weight: 600;
        color: #2c3e50;
    }
    
    .ride-request-item small {
        color: #666;
        font-size: 0.8rem;
    }
    
    .modal {
        animation: fadeIn 0.3s ease-out;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    .modal-content {
        animation: slideIn 0.3s ease-out;
    }
    
    @keyframes slideIn {
        from { transform: translateY(-50px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
`;

document.head.appendChild(style);