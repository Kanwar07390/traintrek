// DOM Elements (will be initialized later)
let searchBtn, sourceInput, destInput, resultsContainer, luckySection, luckyCoin;
let flipResult, bookingModal, closeModal, bookingStatusBadge, bookingDetails;
let downloadTicketBtn, newBookingBtn, userModal, userNameInput, confirmBookingBtn;

// Global variables
let currentBooking = null;
let selectedTrainId = null;

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeDOMElements();
    setupEventListeners();
    loadAllTrains();
});

// Initialize all DOM elements
function initializeDOMElements() {
    searchBtn = document.getElementById('searchBtn');
    sourceInput = document.getElementById('sourceInput');
    destInput = document.getElementById('destInput');
    resultsContainer = document.getElementById('resultsContainer');
    luckySection = document.getElementById('luckySection');
    luckyCoin = document.getElementById('luckyCoin');
    flipResult = document.getElementById('flipResult');
    bookingModal = document.getElementById('bookingModal');
    closeModal = document.querySelector('.close-modal');
    bookingStatusBadge = document.getElementById('bookingStatusBadge');
    bookingDetails = document.getElementById('bookingDetails');
    downloadTicketBtn = document.getElementById('downloadTicketBtn');
    newBookingBtn = document.getElementById('newBookingBtn');
    userModal = document.getElementById('userModal');
    userNameInput = document.getElementById('userNameInput');
    confirmBookingBtn = document.getElementById('confirmBookingBtn');
    
    console.log('DOM Elements initialized');
}

// Setup all event listeners
function setupEventListeners() {
    if (searchBtn) searchBtn.addEventListener('click', searchTrains);
    if (luckyCoin) luckyCoin.addEventListener('click', handleLuckyConfirm);
    if (closeModal) closeModal.addEventListener('click', () => {
        if (bookingModal) bookingModal.style.display = 'none';
    });
    if (newBookingBtn) newBookingBtn.addEventListener('click', resetAndCloseModal);
    if (confirmBookingBtn) confirmBookingBtn.addEventListener('click', confirmBooking);
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (bookingModal && e.target === bookingModal) bookingModal.style.display = 'none';
        if (userModal && e.target === userModal) userModal.style.display = 'none';
    });
}

// Load all trains on page load
async function loadAllTrains() {
    try {
        const response = await fetch('/api/trains/all');
        const trains = await response.json();
        displayResults(trains);
    } catch (error) {
        console.error('Error loading trains:', error);
        if (resultsContainer) {
            resultsContainer.innerHTML = '<p class="no-results">Error loading trains. Please try again.</p>';
        }
    }
}

// Search trains function
async function searchTrains() {
    const source = sourceInput ? sourceInput.value.trim() : '';
    const destination = destInput ? destInput.value.trim() : '';
    
    if (!source || !destination) {
        alert('Please enter both source and destination');
        return;
    }
    
    try {
        showLoading('Searching trains...');
        const response = await fetch(`/api/trains?source=${source}&destination=${destination}`);
        const trains = await response.json();
        hideLoading();
        displayResults(trains);
    } catch (error) {
        console.error('Error searching trains:', error);
        hideLoading();
        alert('Error searching trains. Please try again.');
    }
}

// Display results function
function displayResults(trains) {
    if (!resultsContainer) return;
    
    resultsContainer.innerHTML = '';
    
    if (trains.length === 0) {
        resultsContainer.innerHTML = '<p class="no-results">No trains found for this route</p>';
        return;
    }
    
    trains.forEach(train => {
        const trainCard = document.createElement('div');
        trainCard.className = 'train-card animate-in';
        trainCard.innerHTML = `
            <div class="train-header">
                <div class="train-name">${train.name}</div>
                <div class="seats-available ${train.available_seats > 0 ? '' : 'seats-waitlist'}">
                    ${train.available_seats > 0 ? `${train.available_seats} Seats` : 'Waitlist'}
                </div>
            </div>
            <div class="train-route">
                <span>${train.source}</span>
                <i class="fas fa-arrow-right"></i>
                <span>${train.destination}</span>
            </div>
            <div class="train-details">
                <div class="detail-item">
                    <span class="detail-label">Departure</span>
                    <span class="detail-value">${train.departure_time}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Arrival</span>
                    <span class="detail-value">${train.arrival_time}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Duration</span>
                    <span class="detail-value">${train.duration}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Fare</span>
                    <span class="detail-value">₹${train.fare}</span>
                </div>
            </div>
            <button class="btn book-btn" data-train-id="${train.id}" style="width: 100%; justify-content: center;">
                <i class="fas fa-ticket-alt"></i> Book Now
            </button>
        `;
        resultsContainer.appendChild(trainCard);
    });
    
    // Add event listeners to book buttons
    setTimeout(() => {
        document.querySelectorAll('.book-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                const trainId = this.getAttribute('data-train-id');
                console.log('Booking train ID:', trainId);
                bookTrain(trainId);
            });
        });
    }, 100);
}

// Book train function - opens user modal
function bookTrain(trainId) {
    console.log('bookTrain called with ID:', trainId);
    
    if (!userModal) {
        console.error('userModal is null! Check if the element exists in HTML');
        alert('Error: Booking modal not found. Please refresh the page.');
        return;
    }
    
    selectedTrainId = trainId;
    userModal.style.display = 'flex';
    
    if (userNameInput) {
        userNameInput.value = '';
        userNameInput.focus();
    }
}

// Confirm booking with user name
async function confirmBooking() {
    const userName = userNameInput ? userNameInput.value.trim() : '';
    
    if (!userName) {
        alert('Please enter your name');
        return;
    }
    
    if (!selectedTrainId) {
        alert('No train selected');
        return;
    }
    
    if (userModal) {
        userModal.style.display = 'none';
    }
    
    showLoading('Processing your booking...');
    
    try {
        const response = await fetch('/api/bookings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                trainId: selectedTrainId,
                userName: userName 
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const booking = await response.json();
        currentBooking = booking;
        hideLoading();
        showBookingResult(booking);
    } catch (error) {
        console.error('Error booking train:', error);
        hideLoading();
        alert('Error booking train. Please try again. ' + error.message);
    }
}

// Show booking result
function showBookingResult(booking) {
    if (!bookingModal || !bookingStatusBadge || !bookingDetails) {
        console.error('Booking modal elements not found');
        return;
    }
    
    let statusClass = 'status-confirmed';
    if (booking.status === 'RAC') statusClass = 'status-rac';
    if (booking.status === 'WL') statusClass = 'status-wl';
    
    bookingStatusBadge.className = `status-badge ${statusClass}`;
    bookingStatusBadge.textContent = booking.status;
    
    bookingDetails.innerHTML = `
        <p>Passenger: <strong>${booking.user_name}</strong></p>
        <p>Train: <strong>${booking.train_name}</strong></p>
        <p>From: <strong>${booking.source}</strong> To: <strong>${booking.destination}</strong></p>
        <p>Booking ID: <strong>${booking.id}</strong></p>
        <p>PNR: <strong>${booking.pnr}</strong></p>
        ${booking.coach ? `<p>Coach: <strong>${booking.coach}</strong>, Seat: <strong>${booking.seat_number}</strong></p>` : ''}
    `;
    
    bookingModal.style.display = 'flex';
    
    // Show lucky section if waitlisted OR RAC
    if (luckySection && flipResult) {
        if (booking.status === 'WL' || booking.status === 'RAC') {
            luckySection.hidden = false;
            if (booking.status === 'WL') {
                flipResult.innerHTML = 'Click the coin to try your luck for RAC upgrade!';
            } else {
                flipResult.innerHTML = 'Click the coin to try your luck for CONFIRMED upgrade!';
            }
        } else {
            luckySection.hidden = true;
        }
    }
}

// 🎰 GAMIFICATION: Handle Lucky Confirm
async function handleLuckyConfirm() {
    if (!currentBooking || (currentBooking.status !== 'WL' && currentBooking.status !== 'RAC')) {
        alert('Only waitlisted or RAC tickets can try Lucky Confirm!');
        return;
    }
    
    try {
        const response = await fetch('/api/bookings/lucky-confirm', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                bookingId: currentBooking.id,
                currentStatus: currentBooking.status 
            })
        });
        
        const result = await response.json();
        
        // Animate coin flip
        animateCoinFlip(result);
        
        // Update UI if successful
        if (result.success) {
            setTimeout(() => {
                currentBooking.status = result.newStatus;
                currentBooking.coach = result.booking.coach;
                currentBooking.seat_number = result.booking.seat_number;
                updateBookingUI();
                showNotification(result.message, 'success');
            }, 2000);
        } else {
            setTimeout(() => {
                showNotification(result.message, 'warning');
            }, 2000);
        }
        
    } catch (error) {
        console.error('Lucky confirm error:', error);
        showNotification('Error trying lucky confirm', 'error');
    }
}

// Coin flip animation
function animateCoinFlip(result) {
    if (!luckyCoin || !flipResult) return;
    
    const coin = luckyCoin;
    const resultElement = flipResult;
    
    // Disable coin during animation
    coin.style.pointerEvents = 'none';
    coin.style.transform = 'rotateY(1440deg)'; // 4 full rotations
    resultElement.innerHTML = '<div class="flipping">🔄 Flipping coin...</div>';
    
    setTimeout(() => {
        coin.style.transform = '';
        coin.style.pointerEvents = 'auto';
        
        resultElement.innerHTML = `
            <div class="flip-result">
                <strong>${result.coinResult}</strong><br>
                ${result.message}
            </div>
        `;
        
        // Show confetti if successful
        if (result.success) {
            launchConfetti();
        }
    }, 2000);
}

// Confetti celebration
function launchConfetti() {
    const confetti = document.createElement('div');
    confetti.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: transparent;
        z-index: 10000;
        pointer-events: none;
    `;
    
    // Add confetti elements
    for (let i = 0; i < 50; i++) {
        const confettiPiece = document.createElement('div');
        confettiPiece.innerHTML = ['🎉', '🎊', '✨', '⭐', '🔥'][Math.floor(Math.random() * 5)];
        confettiPiece.style.cssText = `
            position: absolute;
            font-size: ${Math.random() * 20 + 10}px;
            left: ${Math.random() * 100}%;
            top: -10%;
            animation: fall ${Math.random() * 3 + 2}s linear forwards;
        `;
        confetti.appendChild(confettiPiece);
    }
    
    document.body.appendChild(confetti);
    
    setTimeout(() => {
        confetti.remove();
    }, 3000);
}

// Update booking UI
function updateBookingUI() {
    if (!bookingStatusBadge || !luckySection || !bookingDetails) return;
    
    let statusClass = 'status-confirmed';
    if (currentBooking.status === 'RAC') statusClass = 'status-rac';
    if (currentBooking.status === 'WL') statusClass = 'status-wl';
    
    bookingStatusBadge.className = `status-badge ${statusClass}`;
    bookingStatusBadge.textContent = currentBooking.status;
    
    // Update booking details with coach/seat if confirmed
    if (currentBooking.status === 'CONFIRMED' && currentBooking.coach) {
        bookingDetails.innerHTML = `
            <p>Passenger: <strong>${currentBooking.user_name}</strong></p>
            <p>Train: <strong>${currentBooking.train_name}</strong></p>
            <p>From: <strong>${currentBooking.source}</strong> To: <strong>${currentBooking.destination}</strong></p>
            <p>Booking ID: <strong>${currentBooking.id}</strong></p>
            <p>PNR: <strong>${currentBooking.pnr}</strong></p>
            <p>Coach: <strong>${currentBooking.coach}</strong>, Seat: <strong>${currentBooking.seat_number}</strong></p>
        `;
    }
    
    // Hide lucky section if confirmed
    if (currentBooking.status === 'CONFIRMED') {
        luckySection.hidden = true;
    } else {
        luckySection.hidden = false;
        // Update the message based on current status
        if (currentBooking.status === 'WL') {
            flipResult.innerHTML = 'Click the coin to try your luck for RAC upgrade!';
        } else if (currentBooking.status === 'RAC') {
            flipResult.innerHTML = 'Click the coin to try your luck for CONFIRMED upgrade!';
        }
    }
}

// Show loading
function showLoading(message = 'Loading...') {
    let loading = document.getElementById('loading');
    if (!loading) {
        loading = document.createElement('div');
        loading.id = 'loading';
        loading.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 20px;
            border-radius: 10px;
            z-index: 9999;
        `;
        document.body.appendChild(loading);
    }
    loading.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${message}`;
    loading.style.display = 'block';
}

// Hide loading
function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = 'none';
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#FF9800'};
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Reset and close modal
function resetAndCloseModal() {
    if (bookingModal) {
        bookingModal.style.display = 'none';
    }
    resetSearch();
}

// Reset search
function resetSearch() {
    if (sourceInput) sourceInput.value = '';
    if (destInput) destInput.value = '';
    if (resultsContainer) resultsContainer.innerHTML = '';
    if (luckySection) luckySection.hidden = true;
    currentBooking = null;
    selectedTrainId = null;
    
    // Reload all trains
    loadAllTrains();
}

// Add CSS animations
if (!document.getElementById('dynamic-styles')) {
    const style = document.createElement('style');
    style.id = 'dynamic-styles';
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fall {
            to {
                transform: translateY(110vh) rotate(360deg);
                opacity: 0;
            }
        }
        .flipping {
            color: var(--warning);
            font-weight: bold;
        }
        .flip-result {
            padding: 10px;
            border-radius: 10px;
            background: rgba(255,255,255,0.1);
        }
        .no-results {
            text-align: center;
            padding: 2rem;
            color: #ccc;
        }
        .fa-spinner {
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
}