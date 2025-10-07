const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'traintrek.db');

// Delete existing database
if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
}

const db = new sqlite3.Database(dbPath);

// Read and execute SQL
const sql = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf8');

db.exec(sql, (err) => {
    if (err) {
        console.error('Error initializing database:', err);
    } else {
        console.log('✅ Database initialized successfully!');
    }
    db.close();
});