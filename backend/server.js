const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const assetRoutes = require('./routes/assetRoutes');
const assetRequestRoutes = require('./routes/assetRequestRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const repairRoutes = require('./routes/repairRoutes');
const lifecycleRoutes = require('./routes/lifecycleRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
// Parse allowed client origins supporting comma-separated lists and trailing slashes
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map((url) => url.trim().replace(/\/+$/, ''))
  .filter(Boolean);

// CORS configuration supporting local dev, Vercel preview/production, and custom domains
app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (Postman, curl, health checks)
    if (!origin) return callback(null, true);

    const normalizedOrigin = origin.replace(/\/+$/, '');
    const isExplicitlyAllowed = allowedOrigins.includes(normalizedOrigin) || allowedOrigins.includes('*');
    const isVercelDomain = /\.vercel\.app$/.test(new URL(origin).hostname);
    const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

    if (isExplicitlyAllowed || isVercelDomain || isLocalhost) {
      return callback(null, true);
    }

    // Permissive fallback reflects request origin with credentials enabled
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check API
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Asset Management System API is running smoothly',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/requests', assetRequestRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/repairs', repairRoutes);
app.use('/api/lifecycle', lifecycleRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/notifications', notificationRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('Asset Management System (AMS) Backend API is running.');
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[AMS Server] Running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
