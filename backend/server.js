require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { RATE_LIMIT } = require('./config/constants');
const { initBlockchain } = require('./services/blockchain');
const { initIPFS } = require('./services/ipfs');

// Import routes
const authRoutes = require('./routes/auth.routes');
const nftRoutes = require('./routes/nft.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false
}));

// CORS — allow frontend
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000'],
  credentials: true
}));

// Rate limiting
app.use(rateLimit(RATE_LIMIT));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/nft', nftRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'VaultTag API is running',
    blockchain: require('./services/blockchain').isBlockchainReady(),
    ipfs: require('./services/ipfs').isIPFSReady(),
    timestamp: new Date().toISOString()
  });
});

// Serve frontend for any non-API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
  }
});

// Error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  // Connect MongoDB
  await connectDB();

  // Initialize blockchain (non-blocking — server starts even if chain is down)
  initBlockchain();

  // Initialize IPFS
  initIPFS();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 VaultTag server running on http://localhost:${PORT}`);
    console.log(`📡 API available at http://localhost:${PORT}/api`);
    console.log(`🌐 Frontend at http://localhost:${PORT}\n`);
  });
};

startServer().catch(err => {
  console.error('❌ Failed to start server:', err.message);
  process.exit(1);
});
