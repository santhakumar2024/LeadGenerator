import { Router } from 'express';
import { getCampaigns, createCampaign, updateCampaign, deleteCampaign } from '../controllers/campaigns.controller';
import { getDashboardStats } from '../controllers/dashboard.controller';

const router = Router();

// Dashboard
router.get('/dashboard/stats', getDashboardStats);

// Campaigns
router.get('/campaigns', getCampaigns);
router.post('/campaigns', createCampaign);
router.put('/campaigns/:id', updateCampaign);
router.delete('/campaigns/:id', deleteCampaign);

export default router;
