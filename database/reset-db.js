const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'traintrek.db');

// Delete existing database
if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('🗑️  Old database deleted');
}

const db = new sqlite3.Database(dbPath);

// Create tables and insert data
const sql = `
-- Create trains table
CREATE TABLE IF NOT EXISTS trains (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    source TEXT NOT NULL,
    destination TEXT NOT NULL,
    total_seats INTEGER NOT NULL,
    available_seats INTEGER NOT NULL,
    departure_time TEXT NOT NULL,
    arrival_time TEXT NOT NULL,
    duration TEXT NOT NULL,
    fare INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    train_id INTEGER NOT NULL,
    user_name TEXT DEFAULT 'Guest',
    user_email TEXT,
    user_phone TEXT,
    journey_date DATE,
    status TEXT NOT NULL CHECK(status IN ('CONFIRMED', 'RAC', 'WL', 'CANCELLED')),
    coach TEXT,
    seat_number INTEGER,
    pnr TEXT UNIQUE,
    booking_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (train_id) REFERENCES trains (id)
);

-- Create upgrade_history table
CREATE TABLE IF NOT EXISTS upgrade_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER NOT NULL,
    old_status TEXT NOT NULL,
    new_status TEXT NOT NULL,
    upgrade_type TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings (id)
);

-- Insert sample trains data
INSERT INTO trains (name, source, destination, total_seats, available_seats, departure_time, arrival_time, duration, fare) VALUES
('Rajdhani Express', 'New Delhi', 'Mumbai', 50, 12, '16:30', '08:45', '16h 15m', 2845),
('Shatabdi Express', 'Chennai', 'Bangalore', 40, 5, '06:00', '11:00', '5h 00m', 1250),
('Duronto Express', 'Kolkata', 'Delhi', 60, 0, '22:15', '10:30', '12h 15m', 1980),
('Gatimaan Express', 'Delhi', 'Agra', 45, 20, '08:10', '09:50', '1h 40m', 750),
('Tejas Express', 'Mumbai', 'Goa', 55, 8, '05:30', '13:45', '8h 15m', 1560);

-- Insert some sample bookings
INSERT INTO bookings (train_id, user_name, user_email, user_phone, status, coach, seat_number, pnr) VALUES
(1, 'John Doe', 'john@example.com', '1234567890', 'CONFIRMED', 'A1', 15, 'PNR123456'),
(2, 'Jane Smith', 'jane@example.com', '9876543210', 'RAC', NULL, NULL, 'PNR789012'),
(3, 'Bob Wilson', 'bob@example.com', '5555555555', 'WL', NULL, NULL, 'PNR345678');
`;

db.exec(sql, (err) => {
    if (err) {
        console.error('Error initializing database:', err);
    } else {
        console.log('✅ Database initialized successfully with all tables!');
        
        // Verify tables were created
        db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
            if (err) {
                console.error('Error checking tables:', err);
            } else {
                console.log('📊 Tables created:', tables.map(t => t.name).join(', '));
            }
            db.close();
        });
    }
});