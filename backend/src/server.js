const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');
const { initDatabase } = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Root Welcome Route
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Welcome to AutoCare System Backend API Server!',
    status: 'online',
    health: `http://localhost:${PORT}/health`,
    api: `http://localhost:${PORT}/api`,
  });
});

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'AutoCareSystem API (JS)', timestamp: new Date() });
});

// API Routes
app.use('/api', apiRoutes);

// Initialize DB and start server
initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`========================================`);
      console.log(`🚀 AutoCare JS Backend running on port ${PORT}`);
      console.log(`URL: http://localhost:${PORT}`);
      console.log(`Health Check: http://localhost:${PORT}/health`);
      console.log(`========================================`);
    });
  })
  .catch((error) => {
    console.error('Failed to start server due to database init error:', error);
  });
