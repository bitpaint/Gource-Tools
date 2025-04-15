const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const Database = require('../utils/Database');

// Get all logs
router.get('/', (req, res) => {
  try {
    const db = Database.getDatabase();
    // ... existing code ...
  } catch (error) {
    console.error('Error retrieving logs:', error);
    res.status(500).json({ error: 'Error retrieving logs' });
  }
});

module.exports = router; 