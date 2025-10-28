const express = require('express');
const db = require('../database/db');
const router = express.Router();

// Generate random PNR
function generatePNR() {
    return 'PNR' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

// Track upgrade history
function trackUpgrade(bookingId, oldStatus, newStatus, upgradeType) {
    db.run(
        'INSERT INTO upgrade_history (booking_id, old_status, new_status, upgrade_type) VALUES (?, ?, ?, ?)',
        [bookingId, oldStatus, newStatus, upgradeType],
        (err) => {
            if (err) {
                console.error('Error tracking upgrade:', err);
            } else {
                console.log(`📊 Upgrade tracked: ${oldStatus} → ${newStatus} for booking ${bookingId}`);
            }
        }
    );
}

// BOOKING HISTORY ENDPOINT
router.get('/history', (req, res) => {
    const { email, phone } = req.query;
    
    if (!email && !phone) {
        return res.status(400).json({ 
            success: false, 
            message: 'Email or phone number is required' 
        });
    }

    db.all(`
        SELECT b.*, t.name as train_name, t.source, t.destination,
               (SELECT COUNT(*) FROM upgrade_history uh WHERE uh.booking_id = b.id) as upgrade_count
        FROM bookings b 
        JOIN trains t ON b.train_id = t.id 
        WHERE b.user_email = ? OR b.user_phone = ? 
        ORDER BY b.booking_time DESC
    `, [email, phone], (err, bookings) => {
        if (err) {
            console.error('Error fetching booking history:', err);
            return res.status(500).json({ error: err.message });
        }
        
        res.json({
            success: true,
            bookings: bookings
        });
    });
});

// UPGRADE HISTORY ENDPOINT
router.get('/:id/upgrade-history', (req, res) => {
    db.all(`
        SELECT uh.*, b.user_name, b.pnr, t.name as train_name
        FROM upgrade_history uh
        JOIN bookings b ON uh.booking_id = b.id
        JOIN trains t ON b.train_id = t.id
        WHERE uh.booking_id = ?
        ORDER BY uh.created_at DESC
    `, [req.params.id], (err, upgradeHistory) => {
        if (err) {
            console.error('Error fetching upgrade history:', err);
            return res.status(500).json({ error: err.message });
        }
        
        res.json({
            success: true,
            upgradeHistory: upgradeHistory
        });
    });
});

// Create booking (FIXED with callbacks)
router.post('/', (req, res) => {
    const { trainId, userName, userEmail, userPhone, journeyDate } = req.body;
    
    if (!trainId) {
        return res.status(400).json({ error: 'Train ID is required' });
    }

    // Get train details first
    db.get('SELECT * FROM trains WHERE id = ?', [trainId], (err, train) => {
        if (err) {
            console.error('Error fetching train:', err);
            return res.status(500).json({ error: err.message });
        }
        
        if (!train) {
            return res.status(404).json({ error: 'Train not found' });
        }

        // Determine booking status
        let status;
        let coach = null;
        let seat_number = null;
        
        if (train.available_seats > 0) {
            status = 'CONFIRMED';
            coach = 'A' + Math.floor(Math.random() * 5 + 1);
            seat_number = Math.floor(Math.random() * 50 + 1);
            
            // Decrease available seats
            db.run(
                'UPDATE trains SET available_seats = available_seats - 1 WHERE id = ?',
                [trainId],
                (err) => {
                    if (err) console.error('Error updating seats:', err);
                }
            );
        } else if (Math.random() > 0.5) {
            status = 'RAC';
        } else {
            status = 'WL';
        }

        const pnr = generatePNR();

        // Insert booking with new fields
        db.run(
            'INSERT INTO bookings (train_id, user_name, user_email, user_phone, journey_date, status, coach, seat_number, pnr) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [trainId, userName || 'Guest', userEmail || '', userPhone || '', journeyDate || null, status, coach, seat_number, pnr],
            function(err) {
                if (err) {
                    console.error('Booking error:', err);
                    return res.status(500).json({ error: err.message });
                }

                const bookingId = this.lastID;

                // Get complete booking details
                db.get(`
                    SELECT b.*, t.name as train_name, t.source, t.destination, t.departure_time, t.arrival_time
                    FROM bookings b 
                    JOIN trains t ON b.train_id = t.id 
                    WHERE b.id = ?
                `, [bookingId], (err, booking) => {
                    if (err) {
                        console.error('Error fetching booking details:', err);
                        return res.status(500).json({ error: err.message });
                    }
                    
                    res.json(booking);
                });
            }
        );
    });
});

// 🎰 GAMIFICATION: Lucky Confirm Coin Flip
router.post('/lucky-confirm', (req, res) => {
    const { bookingId, currentStatus } = req.body;
    
    if (!bookingId) {
        return res.status(400).json({ error: 'Booking ID is required' });
    }

    // Check if booking exists and is WL or RAC status
    db.get(`
        SELECT b.*, t.name as train_name 
        FROM bookings b 
        JOIN trains t ON b.train_id = t.id 
        WHERE b.id = ? AND (b.status = 'WL' OR b.status = 'RAC')
    `, [bookingId], (err, booking) => {
        if (err) {
            console.error('Error fetching booking:', err);
            return res.status(500).json({ error: err.message });
        }

        if (!booking) {
            return res.status(400).json({ 
                error: 'Booking not found or not eligible for Lucky Confirm (must be Waitlisted or RAC)' 
            });
        }

        // 🎯 GAMIFICATION LOGIC: 50% chance to upgrade
        const isLucky = Math.random() > 0.5; // 50% success rate
        let message = '';
        let newStatus = booking.status;
        let coach = booking.coach;
        let seat_number = booking.seat_number;
        let upgradeType = 'lucky_confirm';
        
        if (isLucky) {
            if (booking.status === 'WL') {
                // Upgrade from WL to RAC
                newStatus = 'RAC';
                message = '🎉 Congratulations! You got lucky! Your ticket has been upgraded from Waitlist to RAC!';
                
                db.run(
                    "UPDATE bookings SET status=? WHERE id=?",
                    [newStatus, bookingId],
                    (err) => {
                        if (err) {
                            console.error('Error updating booking:', err);
                            return res.status(500).json({ error: err.message });
                        }
                        
                        // Track the upgrade
                        trackUpgrade(bookingId, 'WL', 'RAC', upgradeType);
                        sendUpdatedBooking();
                    }
                );
                
            } else if (booking.status === 'RAC') {
                // Upgrade from RAC to CONFIRMED
                newStatus = 'CONFIRMED';
                coach = 'A' + Math.floor(Math.random() * 5 + 1);
                seat_number = Math.floor(Math.random() * 50 + 1);
                
                db.run(
                    "UPDATE bookings SET status=?, coach=?, seat_number=? WHERE id=?",
                    [newStatus, coach, seat_number, bookingId],
                    (err) => {
                        if (err) {
                            console.error('Error updating booking:', err);
                            return res.status(500).json({ error: err.message });
                        }
                        
                        // Track the upgrade
                        trackUpgrade(bookingId, 'RAC', 'CONFIRMED', upgradeType);
                        sendUpdatedBooking();
                    }
                );
                
                message = '🎉 Amazing! You got lucky! Your ticket has been upgraded from RAC to CONFIRMED!';
            }
        } else {
            if (booking.status === 'WL') {
                message = '😢 Better luck next time! Your ticket remains Waitlisted.';
            } else {
                message = '😢 Better luck next time! Your ticket remains RAC.';
            }
            sendResponse();
        }

        function sendUpdatedBooking() {
            // Get updated booking
            db.get(`
                SELECT b.*, t.name as train_name, t.source, t.destination
                FROM bookings b 
                JOIN trains t ON b.train_id = t.id 
                WHERE b.id = ?
            `, [bookingId], (err, updatedBooking) => {
                if (err) {
                    console.error('Error fetching updated booking:', err);
                    return res.status(500).json({ error: err.message });
                }
                
                res.json({
                    success: isLucky,
                    message: message,
                    booking: updatedBooking,
                    newStatus: newStatus,
                    coinResult: isLucky ? 'HEADS' : 'TAILS'
                });
            });
        }

        function sendResponse() {
            res.json({
                success: isLucky,
                message: message,
                booking: booking,
                newStatus: newStatus,
                coinResult: isLucky ? 'HEADS' : 'TAILS'
            });
        }
    });
});

// Get all bookings
router.get('/', (req, res) => {
    db.all(`
        SELECT b.*, t.name as train_name, t.source, t.destination 
        FROM bookings b 
        JOIN trains t ON b.train_id = t.id 
        ORDER BY b.booking_time DESC
    `, (err, bookings) => {
        if (err) {
            console.error('Error fetching bookings:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(bookings);
    });
});

// Get booking by ID
router.get('/:id', (req, res) => {
    db.get(`
        SELECT b.*, t.name as train_name, t.source, t.destination, t.departure_time, t.arrival_time
        FROM bookings b 
        JOIN trains t ON b.train_id = t.id 
        WHERE b.id = ?
    `, [req.params.id], (err, booking) => {
        if (err) {
            console.error('Error fetching booking:', err);
            return res.status(500).json({ error: err.message });
        }
        
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        
        res.json(booking);
    });
});

module.exports = router;