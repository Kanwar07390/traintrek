const express = require('express');
const db = require('../database/db');
const router = express.Router();

// Get all trains
router.get('/all', async (req, res) => {
    try {
        const trains = await db.all('SELECT * FROM trains');
        res.json(trains);
    } catch (error) {
        console.error('Error fetching trains:', error);
        res.status(500).json({ error: error.message });
    }
});

// Search trains by source and destination
router.get('/', async (req, res) => {
    try {
        const { source, destination } = req.query;
        
        if (!source || !destination) {
            return res.status(400).json({ error: 'Source and destination are required' });
        }
        
        const trains = await db.all(
            'SELECT * FROM trains WHERE source LIKE ? AND destination LIKE ?',
            [`%${source}%`, `%${destination}%`]
        );
        
        res.json(trains);
    } catch (error) {
        console.error('Error searching trains:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get train by ID
router.get('/:id', async (req, res) => {
    try {
        const train = await db.get('SELECT * FROM trains WHERE id = ?', [req.params.id]);
        
        if (!train) {
            return res.status(404).json({ error: 'Train not found' });
        }
        
        res.json(train);
    } catch (error) {
        console.error('Error fetching train:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;