import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import seedVillages from './config/seed.js';

// Route files
import authRoutes from './routes/auth.js';
import villageRoutes from './routes/villages.js';
import canRoutes from './routes/cans.js';

// Load env vars
dotenv.config();

// Connect to MongoDB Atlas
await connectDB();

// Pre-populate Telugu villages if collection is empty
await seedVillages();

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/villages', villageRoutes);
app.use('/api/cans', canRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`HydroFlow Server running on port ${PORT}`);
});
