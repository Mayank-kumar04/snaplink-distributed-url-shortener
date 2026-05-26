// server.js
// Main entry point — sets up Express app, middleware, and routes

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const urlRoutes = require('./src/routes/urlRoutes');
const { redirectToUrl } = require('./src/controllers/urlController');
const { createUrlLimiter } = require('./src/middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────

// Parse JSON request bodies
app.use(express.json());

// CORS — allow frontend to talk to backend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'DELETE'],
}));

// ─── Routes ───────────────────────────────────────────────────────────────────

// Health check — useful for deployment/monitoring
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes — all URL management operations
app.use('/api/urls', urlRoutes);

// THE REDIRECT ROUTE — must come after /api routes
// When someone visits /:code, redirect them to the original URL
// Apply rate limiting to prevent redirect abuse
app.get('/:code', redirectToUrl);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
🚀 SnapLink Backend running on port ${PORT}
📡 API: http://localhost:${PORT}/api/urls
🔗 Redirects: http://localhost:${PORT}/:code
🏥 Health: http://localhost:${PORT}/health
  `);
});

module.exports = app;
