import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { portfolioRouter } from './routes/portfolio';
import { chatRouter } from './routes/chat';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
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