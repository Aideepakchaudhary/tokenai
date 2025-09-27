import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { portfolioRouter } from './routes/portfolio';
import { chatRouter } from './routes/chat';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware - Allow multiple frontend ports
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:8080', 
  'http://localhost:8081',
  'http://localhost:8082',
  'http://localhost:3000',
  'http://localhost:3001'
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // For development, allow any localhost origin
      if (origin.startsWith('http://localhost:')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/portfolio', portfolioRouter);
app.use('/api/chat', chatRouter);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    data: null,
    timestamp: new Date().toISOString(),
    error: 'Internal server error'
  });
});

// 404 handler
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({
    success: false,
    data: null,
    timestamp: new Date().toISOString(),
    error: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 ChainMate API Server running on port ${PORT}`);
  console.log(`📊 Portfolio API: http://localhost:${PORT}/api/portfolio`);
  console.log(`🤖 Chat API: http://localhost:${PORT}/api/chat`);
  console.log(`❤️ Health Check: http://localhost:${PORT}/health`);
});

export default app;