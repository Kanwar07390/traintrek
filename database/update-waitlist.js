const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'traintrek.db');
const db = new sqlite3.Database(dbPath);

// Update trains to create waitlist scenarios
db.serialize(() => {
    db.run("UPDATE trains SET available_seats = 0 WHERE name = 'Duronto Express'");
    db.run("UPDATE trains SET available_seats = 0 WHERE name = 'Tejas Express'");
    db.run("UPDATE trains SET available_seats = 2 WHERE name = 'Shatabdi Express'");
    db.run("UPDATE trains SET available_seats = 1 WHERE name = 'Rajdhani Express'");
    
    db.all("SELECT name, available_seats FROM trains", (err, rows) => {
        if (err) {
            console.error('Error:', err);
        } else {
            console.log('Updated train seats:');
            rows.forEach(row => {
                console.log(`${row.name}: ${row.available_seats} seats`);
            });
            console.log('\n🎯 Test with: Duronto Express (0 seats) for WL/RAC status');
        }
        db.close();
    });
});

console.log('Updated trains for waitlist testing...');