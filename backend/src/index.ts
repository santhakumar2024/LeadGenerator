import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api';
import leadRoutes from './routes/lead.routes';
import meetingRoutes from './routes/meetingRoutes';
import aiRoutes from './routes/aiRoutes';
import { initImapListener } from './services/imap.service';
import { initDripCampaignCron } from './services/drip.service';
import { initScheduler } from './services/scheduler.service';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Global Middlewares
app.use(cors());
app.use(express.json());

// Routes Registration
app.use('/api', apiRoutes);
app.use('/api', leadRoutes);
app.use('/api', meetingRoutes);
app.use('/api', aiRoutes);

// Global Error Handling Middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Global Error Handler] Error captured:', err);
  
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'An unexpected error occurred';
  const name = err.name || 'InternalServerError';

  res.status(statusCode).json({
    error: name,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Initialize background listeners, scheduling crons, and queues
  initImapListener();
  initDripCampaignCron();
  initScheduler();
});
