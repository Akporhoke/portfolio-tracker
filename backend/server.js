const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB error:', err));

// Test Route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});


// Import routes
const portfolioRoutes = require('./routes/portfolio');
const stockRoutes = require('./routes/stocks');

// Use routes
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/stocks', stockRoutes);

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});