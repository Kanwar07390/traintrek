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
    status TEXT NOT NULL CHECK(status IN ('CONFIRMED', 'RAC', 'WL', 'CANCELLED')),
    coach TEXT,
    seat_number INTEGER,
    pnr TEXT UNIQUE,
    booking_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (train_id) REFERENCES trains (id)
);

-- Insert sample trains data
INSERT INTO trains (name, source, destination, total_seats, available_seats, departure_time, arrival_time, duration, fare) VALUES
('Rajdhani Express', 'New Delhi', 'Mumbai', 50, 12, '16:30', '08:45', '16h 15m', 2845),
('Shatabdi Express', 'Chennai', 'Bangalore', 40, 5, '06:00', '11:00', '5h 00m', 1250),
('Duronto Express', 'Kolkata', 'Delhi', 60, 0, '22:15', '10:30', '12h 15m', 1980),
('Gatimaan Express', 'Delhi', 'Agra', 45, 20, '08:10', '09:50', '1h 40m', 750),
('Tejas Express', 'Mumbai', 'Goa', 55, 8, '05:30', '13:45', '8h 15m', 1560);