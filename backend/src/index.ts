import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api';
import leadRoutes from './routes/leadRoutes';
import meetingRoutes from './routes/meetingRoutes';
import aiRoutes from './routes/aiRoutes';
import { initImapListener } from './services/imap.service';
import { initDripCampaignCron } from './services/drip.service';
import { initScheduler } from './services/scheduler.service';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api', apiRoutes);
app.use('/api', leadRoutes);
app.use('/api', meetingRoutes);
app.use('/api', aiRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Initialize background services
  initImapListener();
  initDripCampaignCron();
  initScheduler();
});
