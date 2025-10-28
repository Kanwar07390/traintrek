// DOM Elements (will be initialized later)
let searchBtn, sourceInput, destInput, resultsContainer, luckySection, luckyCoin;
let flipResult, bookingModal, closeModal, bookingStatusBadge, bookingDetails;
let downloadTicketBtn, newBookingBtn, userModal, userNameInput, confirmBookingBtn;
let bookingHistoryBtn, bookingHistoryModal, closeHistoryModal, bookingHistoryContent;
let searchHistoryBtn, historyEmailInput, historyPhoneInput, userEmailInput, userPhoneInput, journeyDateInput;

// Global variables
let currentBooking = null;
let selectedTrainId = null;

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeDOMElements();
    setupEventListeners();
    loadAllTrains(); // This should only be called once
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
    
    // Booking History Elements
    bookingHistoryBtn = document.getElementById('bookingHistoryBtn');
    bookingHistoryModal = document.getElementById('bookingHistoryModal');
    closeHistoryModal = document.querySelector('.close-history-modal');
    bookingHistoryContent = document.getElementById('bookingHistoryContent');
    searchHistoryBtn = document.getElementById('searchHistoryBtn');
    historyEmailInput = document.getElementById('historyEmailInput');
    historyPhoneInput = document.getElementById('historyPhoneInput');
    userEmailInput = document.getElementById('userEmailInput');
    userPhoneInput = document.getElementById('userPhoneInput');
    journeyDateInput = document.getElementById('journeyDateInput');
    
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
    
    // Booking History Event Listeners
    if (bookingHistoryBtn) bookingHistoryBtn.addEventListener('click', showBookingHistoryModal);
    if (closeHistoryModal) closeHistoryModal.addEventListener('click', () => {
        if (bookingHistoryModal) bookingHistoryModal.style.display = 'none';
    });
    if (searchHistoryBtn) searchHistoryBtn.addEventListener('click', searchBookingHistory);
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (bookingModal && e.target === bookingModal) bookingModal.style.display = 'none';
        if (userModal && e.target === userModal) userModal.style.display = 'none';
        if (bookingHistoryModal && e.target === bookingHistoryModal) bookingHistoryModal.style.display = 'none';
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
    
    if (!trains || trains.length === 0) {
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

// Confirm booking with user details
async function confirmBooking() {
    const userName = userNameInput ? userNameInput.value.trim() : '';
    const userEmail = userEmailInput ? userEmailInput.value.trim() : '';
    const userPhone = userPhoneInput ? userPhoneInput.value.trim() : '';
    const journeyDate = journeyDateInput ? journeyDateInput.value : '';
    
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
                userName: userName,
                userEmail: userEmail,
                userPhone: userPhone,
                journeyDate: journeyDate
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
        ${booking.user_email ? `<p>Email: <strong>${booking.user_email}</strong></p>` : ''}
        ${booking.user_phone ? `<p>Phone: <strong>${booking.user_phone}</strong></p>` : ''}
        ${booking.journey_date ? `<p>Journey Date: <strong>${new Date(booking.journey_date).toLocaleDateString()}</strong></p>` : ''}
    `;
    
    // Show upgrade info for WL/RAC tickets
    if (booking.status === 'WL' || booking.status === 'RAC') {
        const upgradeInfo = document.createElement('p');
        upgradeInfo.className = 'upgrade-info';
        upgradeInfo.innerHTML = `
            <i class="fas fa-rocket"></i> 
            Use <strong>Lucky Confirm</strong> below to try upgrading your ${booking.status} status!
        `;
        bookingDetails.appendChild(upgradeInfo);
    }
    
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
    let detailsHTML = `
        <p>Passenger: <strong>${currentBooking.user_name}</strong></p>
        <p>Train: <strong>${currentBooking.train_name}</strong></p>
        <p>From: <strong>${currentBooking.source}</strong> To: <strong>${currentBooking.destination}</strong></p>
        <p>Booking ID: <strong>${currentBooking.id}</strong></p>
        <p>PNR: <strong>${currentBooking.pnr}</strong></p>
    `;
    
    if (currentBooking.status === 'CONFIRMED' && currentBooking.coach) {
        detailsHTML += `<p>Coach: <strong>${currentBooking.coach}</strong>, Seat: <strong>${currentBooking.seat_number}</strong></p>`;
    }
    
    if (currentBooking.user_email) {
        detailsHTML += `<p>Email: <strong>${currentBooking.user_email}</strong></p>`;
    }
    
    if (currentBooking.user_phone) {
        detailsHTML += `<p>Phone: <strong>${currentBooking.user_phone}</strong></p>`;
    }
    
    if (currentBooking.journey_date) {
        detailsHTML += `<p>Journey Date: <strong>${new Date(currentBooking.journey_date).toLocaleDateString()}</strong></p>`;
    }
    
    bookingDetails.innerHTML = detailsHTML;
    
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

// BOOKING HISTORY FUNCTIONS

// Show booking history modal
function showBookingHistoryModal() {
    if (!bookingHistoryModal) {
        console.error('Booking history modal not found');
        return;
    }
    
    bookingHistoryModal.style.display = 'flex';
    
    // Clear previous results
    if (bookingHistoryContent) {
        bookingHistoryContent.innerHTML = '<p class="no-results">Enter your email or phone number to view booking history</p>';
    }
    
    // Clear inputs
    if (historyEmailInput) historyEmailInput.value = '';
    if (historyPhoneInput) historyPhoneInput.value = '';
}

// Search booking history
async function searchBookingHistory() {
    const email = historyEmailInput ? historyEmailInput.value.trim() : '';
    const phone = historyPhoneInput ? historyPhoneInput.value.trim() : '';
    
    if (!email && !phone) {
        alert('Please enter either email or phone number');
        return;
    }
    
    showLoading('Searching your booking history...');
    
    try {
        const response = await fetch(`/api/bookings/history?email=${email}&phone=${phone}`);
        const data = await response.json();
        
        hideLoading();
        
        if (data.success) {
            await displayBookingHistory(data.bookings);
        } else {
            if (bookingHistoryContent) {
                bookingHistoryContent.innerHTML = `<p class="no-results">${data.message}</p>`;
            }
        }
    } catch (error) {
        console.error('Error fetching booking history:', error);
        hideLoading();
        if (bookingHistoryContent) {
            bookingHistoryContent.innerHTML = '<p class="no-results">Error fetching booking history. Please try again.</p>';
        }
    }
}

// Show upgrade history for a booking
async function showUpgradeHistory(bookingId) {
    try {
        const response = await fetch(`/api/bookings/${bookingId}/upgrade-history`);
        const data = await response.json();
        
        if (data.success && data.upgradeHistory.length > 0) {
            return data.upgradeHistory;
        }
        return [];
    } catch (error) {
        console.error('Error fetching upgrade history:', error);
        return [];
    }
}

// Display booking history with upgrade info
async function displayBookingHistory(bookings) {
    if (!bookingHistoryContent) return;
    
    bookingHistoryContent.innerHTML = '';
    
    if (!bookings || bookings.length === 0) {
        bookingHistoryContent.innerHTML = '<p class="no-results">No bookings found for this email/phone number</p>';
        return;
    }
    
    for (const booking of bookings) {
        const upgradeHistory = await showUpgradeHistory(booking.id);
        const bookingCard = document.createElement('div');
        bookingCard.className = 'booking-history-card animate-in';
        
        let statusClass = 'status-confirmed';
        if (booking.status === 'RAC') statusClass = 'status-rac';
        if (booking.status === 'WL') statusClass = 'status-wl';
        if (booking.status === 'CANCELLED') statusClass = 'status-cancelled';
        
        // Add special class if booking was upgraded
        if (upgradeHistory.length > 0) {
            bookingCard.classList.add('booking-upgraded');
        }
        
        bookingCard.innerHTML = `
            <div class="booking-history-header">
                <span class="booking-pnr">PNR: ${booking.pnr || 'N/A'}</span>
                <span class="status-badge ${statusClass}">${booking.status}</span>
            </div>
            <div class="booking-history-details">
                <p><strong>Passenger:</strong> ${booking.user_name}</p>
                <p><strong>Train:</strong> ${booking.train_name}</p>
                <p><strong>Route:</strong> ${booking.source} → ${booking.destination}</p>
                <p><strong>Journey Date:</strong> ${booking.journey_date ? new Date(booking.journey_date).toLocaleDateString() : 'Not specified'}</p>
                <p><strong>Booked On:</strong> ${new Date(booking.booking_time).toLocaleString()}</p>
                ${booking.coach ? `<p><strong>Coach:</strong> ${booking.coach}, <strong>Seat:</strong> ${booking.seat_number}</p>` : ''}
                ${booking.user_email ? `<p><strong>Email:</strong> ${booking.user_email}</p>` : ''}
                ${booking.user_phone ? `<p><strong>Phone:</strong> ${booking.user_phone}</p>` : ''}
                
                ${upgradeHistory.length > 0 ? `
                    <div class="upgrade-history-section">
                        <p class="upgrade-title"><strong>🎉 Upgrade History:</strong></p>
                        ${upgradeHistory.map(upgrade => `
                            <div class="upgrade-item">
                                <span class="upgrade-arrow">${getStatusEmoji(upgrade.old_status)} → ${getStatusEmoji(upgrade.new_status)}</span>
                                <span class="upgrade-details">${formatUpgradeType(upgrade.upgrade_type)} on ${new Date(upgrade.created_at).toLocaleString()}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                
                ${booking.upgrade_count > 0 && upgradeHistory.length === 0 ? `
                    <p class="upgrade-info">✨ This booking was upgraded ${booking.upgrade_count} time(s)</p>
                ` : ''}
            </div>
        `;
        
        bookingHistoryContent.appendChild(bookingCard);
    }
}

// Helper functions for upgrade history
function getStatusEmoji(status) {
    const emojis = {
        'WL': '⏳',
        'RAC': '🔄', 
        'CONFIRMED': '✅',
        'CANCELLED': '❌'
    };
    return emojis[status] || status;
}

function formatUpgradeType(type) {
    const types = {
        'lucky_confirm': 'Lucky Coin Flip',
        'auto_upgrade': 'Automatic Upgrade',
        'cancellation_upgrade': 'Cancellation Chain'
    };
    return types[type] || type;
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

// Reset search - FIXED: Remove the recursive call to loadAllTrains
function resetSearch() {
    if (sourceInput) sourceInput.value = '';
    if (destInput) destInput.value = '';
    if (resultsContainer) resultsContainer.innerHTML = '';
    if (luckySection) luckySection.hidden = true;
    currentBooking = null;
    selectedTrainId = null;
    
    // Just clear the results, don't reload trains automatically
    resultsContainer.innerHTML = '<p class="no-results">Search for trains to see results</p>';
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