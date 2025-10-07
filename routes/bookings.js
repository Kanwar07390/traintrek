const express = require('express');
const db = require('../database/db');
const router = express.Router();

// Generate random PNR
function generatePNR() {
    return 'PNR' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

// Create booking
router.post('/', async (req, res) => {
    try {
        const { trainId, userName } = req.body;
        
        if (!trainId) {
            return res.status(400).json({ error: 'Train ID is required' });
        }

        // Get train details
        const train = await db.get('SELECT * FROM trains WHERE id = ?', [trainId]);
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
            await db.run(
                'UPDATE trains SET available_seats = available_seats - 1 WHERE id = ?',
                [trainId]
            );
        } else if (Math.random() > 0.5) {
            status = 'RAC';
        } else {
            status = 'WL';
        }

        const pnr = generatePNR();

        // Insert booking
        const result = await db.run(
            'INSERT INTO bookings (train_id, user_name, status, coach, seat_number, pnr) VALUES (?, ?, ?, ?, ?, ?)',
            [trainId, userName || 'Guest', status, coach, seat_number, pnr]
        );

        // Get complete booking details
        const booking = await db.get(`
            SELECT b.*, t.name as train_name, t.source, t.destination, t.departure_time, t.arrival_time
            FROM bookings b 
            JOIN trains t ON b.train_id = t.id 
            WHERE b.id = ?
        `, [result.lastID]);

        res.json(booking);
        
    } catch (error) {
        console.error('Booking error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 🎰 GAMIFICATION: Lucky Confirm Coin Flip for both RAC and WL
router.post('/lucky-confirm', async (req, res) => {
    try {
        const { bookingId, currentStatus } = req.body;
        
        if (!bookingId) {
            return res.status(400).json({ error: 'Booking ID is required' });
        }

        // Check if booking exists and is WL or RAC status
        const booking = await db.get(`
            SELECT b.*, t.name as train_name 
            FROM bookings b 
            JOIN trains t ON b.train_id = t.id 
            WHERE b.id = ? AND (b.status = 'WL' OR b.status = 'RAC')
        `, [bookingId]);

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
        
        if (isLucky) {
            if (booking.status === 'WL') {
                // Upgrade from WL to RAC
                newStatus = 'RAC';
                message = '🎉 Congratulations! You got lucky! Your ticket has been upgraded from Waitlist to RAC!';
                
                await db.run(
                    "UPDATE bookings SET status=? WHERE id=?",
                    [newStatus, bookingId]
                );
            } else if (booking.status === 'RAC') {
                // Upgrade from RAC to CONFIRMED
                newStatus = 'CONFIRMED';
                // Assign coach and seat
                coach = 'A' + Math.floor(Math.random() * 5 + 1);
                seat_number = Math.floor(Math.random() * 50 + 1);
                
                await db.run(
                    "UPDATE bookings SET status=?, coach=?, seat_number=? WHERE id=?",
                    [newStatus, coach, seat_number, bookingId]
                );
                message = '🎉 Amazing! You got lucky! Your ticket has been upgraded from RAC to CONFIRMED!';
            }
        } else {
            if (booking.status === 'WL') {
                message = '😢 Better luck next time! Your ticket remains Waitlisted.';
            } else {
                message = '😢 Better luck next time! Your ticket remains RAC.';
            }
        }

        // Get updated booking
        const updatedBooking = await db.get(`
            SELECT b.*, t.name as train_name, t.source, t.destination
            FROM bookings b 
            JOIN trains t ON b.train_id = t.id 
            WHERE b.id = ?
        `, [bookingId]);

        res.json({
            success: isLucky,
            message: message,
            booking: updatedBooking,
            newStatus: newStatus,
            coinResult: isLucky ? 'HEADS' : 'TAILS'
        });
        
    } catch (error) {
        console.error('Lucky Confirm error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Cancel booking and trigger WL upgrades
router.post('/cancel', async (req, res) => {
    try {
        const { bookingId } = req.body;
        
        if (!bookingId) {
            return res.status(400).json({ error: 'Booking ID is required' });
        }

        // Get booking details before cancellation
        const booking = await db.get('SELECT * FROM bookings WHERE id = ?', [bookingId]);
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        // Cancel the booking
        await db.run(
            "UPDATE bookings SET status='CANCELLED' WHERE id=?",
            [bookingId]
        );

        // 🎯 GAMIFICATION: Trigger upgrade chain when someone cancels
        if (booking.status === 'CONFIRMED') {
            // Free up the seat
            await db.run(
                'UPDATE trains SET available_seats = available_seats + 1 WHERE id = ?',
                [booking.train_id]
            );
            
            // Try to upgrade one RAC to CONFIRMED
            const racUpgrade = await db.run(`
                UPDATE bookings 
                SET status='CONFIRMED', 
                    coach='A' || (ABS(RANDOM()) % 5 + 1),
                    seat_number=(ABS(RANDOM()) % 50 + 1)
                WHERE status='RAC' AND train_id=?
                LIMIT 1
            `, [booking.train_id]);

            // If RAC was upgraded, try to upgrade one WL to RAC
            if (racUpgrade.changes > 0) {
                await db.run(`
                    UPDATE bookings 
                    SET status='RAC' 
                    WHERE status='WL' AND train_id=?
                    LIMIT 1
                `, [booking.train_id]);
            }
        }

        res.json({
            success: true,
            message: 'Booking cancelled successfully. Waitlisted passengers got upgrade chances!',
            cancelledBooking: booking
        });
        
    } catch (error) {
        console.error('Cancel error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all bookings
router.get('/', async (req, res) => {
    try {
        const bookings = await db.all(`
            SELECT b.*, t.name as train_name, t.source, t.destination 
            FROM bookings b 
            JOIN trains t ON b.train_id = t.id 
            ORDER BY b.booking_time DESC
        `);
        res.json(bookings);
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get booking by ID
router.get('/:id', async (req, res) => {
    try {
        const booking = await db.get(`
            SELECT b.*, t.name as train_name, t.source, t.destination, t.departure_time, t.arrival_time
            FROM bookings b 
            JOIN trains t ON b.train_id = t.id 
            WHERE b.id = ?
        `, [req.params.id]);
        
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        
        res.json(booking);
    } catch (error) {
        console.error('Error fetching booking:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;