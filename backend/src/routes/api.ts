import { Router } from 'express';
import { getLeads, updateLeadStatus, scrapeGmaps, deleteLeads } from '../controllers/leads.controller';
import { getCampaigns, createCampaign, updateCampaign, deleteCampaign } from '../controllers/campaigns.controller';
import { getDashboardStats } from '../controllers/dashboard.controller';

const router = Router();

// Dashboard
router.get('/dashboard/stats', getDashboardStats);

// Leads
router.get('/leads', getLeads);
router.patch('/leads/:id/status', updateLeadStatus);
router.post('/leads/scrape-gmaps', scrapeGmaps);
router.delete('/leads', deleteLeads);

// Campaigns
router.get('/campaigns', getCampaigns);
router.post('/campaigns', createCampaign);
router.put('/campaigns/:id', updateCampaign);
router.delete('/campaigns/:id', deleteCampaign);

export default router;
