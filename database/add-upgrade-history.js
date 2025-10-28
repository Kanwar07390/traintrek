const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'traintrek.db');
const db = new sqlite3.Database(dbPath);

// Add upgrade history table
const addUpgradeHistory = () => {
    const query = `
        CREATE TABLE IF NOT EXISTS upgrade_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_id INTEGER NOT NULL,
            old_status TEXT NOT NULL,
            new_status TEXT NOT NULL,
            upgrade_type TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (booking_id) REFERENCES bookings (id)
        )
    `;

    db.run(query, (err) => {
        if (err) {
            console.error('Error creating upgrade_history table:', err);
        } else {
            console.log('✅ upgrade_history table created successfully!');
            
            // Also add the missing columns to bookings table if they don't exist
            const alterQueries = [
                `ALTER TABLE bookings ADD COLUMN user_email TEXT`,
                `ALTER TABLE bookings ADD COLUMN user_phone TEXT`,
                `ALTER TABLE bookings ADD COLUMN journey_date DATE`,
                `ALTER TABLE bookings ADD COLUMN pnr_number TEXT UNIQUE`
            ];

            let completed = 0;
            alterQueries.forEach((query, index) => {
                db.run(query, (err) => {
                    if (err && !err.message.includes('duplicate column name')) {
                        console.log(`Error adding column ${index + 1}:`, err.message);
                    } else {
                        console.log(`✅ Column ${index + 1} added or already exists`);
                    }
                    completed++;
                    
                    if (completed === alterQueries.length) {
                        console.log('🎉 Database schema updated successfully!');
                        db.close();
                    }
                });
            });
        }
    });
};

addUpgradeHistory();