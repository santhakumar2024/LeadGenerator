import { Router } from 'express';
import { 
  getLeads, 
  createLead, 
  updateLeadStatus, 
  deleteLeads, 
  scrapeGmaps,
  inboundForm,
  socialWebhook,
  triggerScraper
} from '../controllers/lead.controller';

const router = Router();

// Leads endpoints
router.get('/leads', getLeads);
router.post('/leads', createLead);
router.patch('/leads/:id/status', updateLeadStatus);
router.delete('/leads', deleteLeads);
router.post('/leads/scrape-gmaps', scrapeGmaps);
router.post('/leads/inbound', inboundForm);
router.post('/leads/scrape', triggerScraper);

// Webhook endpoints
router.post('/webhooks/social', socialWebhook);

export default router;
