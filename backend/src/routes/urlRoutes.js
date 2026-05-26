// src/routes/urlRoutes.js
// Defines all API routes and maps them to controller functions

const express = require('express');
const router = express.Router();
const {
  createShortUrl,
  listUrls,
  deleteUrl,
  getAnalytics,
  getStats,
} = require('../controllers/urlController');

// POST   /api/urls          → create a new short URL
router.post('/', createShortUrl);

// GET    /api/urls           → list all URLs (paginated)
router.get('/', listUrls);

// GET    /api/urls/stats     → system-wide stats
router.get('/stats', getStats);

// GET    /api/urls/:code/analytics  → analytics for one URL
router.get('/:code/analytics', getAnalytics);

// DELETE /api/urls/:code     → deactivate a URL
router.delete('/:code', deleteUrl);

module.exports = router;
