const express = require('express');
const db = require('../database/db');
const router = express.Router();

// Get all trains
router.get('/all', (req, res) => {
    db.all('SELECT * FROM trains', (err, trains) => {
        if (err) {
            console.error('Error fetching trains:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(trains);
    });
});

// Search trains by source and destination
router.get('/', (req, res) => {
    const { source, destination } = req.query;
    
    if (!source || !destination) {
        return res.status(400).json({ error: 'Source and destination are required' });
    }
    
    db.all(
        'SELECT * FROM trains WHERE source LIKE ? AND destination LIKE ?',
        [`%${source}%`, `%${destination}%`],
        (err, trains) => {
            if (err) {
                console.error('Error searching trains:', err);
                return res.status(500).json({ error: err.message });
            }
            res.json(trains);
        }
    );
});

module.exports = router;