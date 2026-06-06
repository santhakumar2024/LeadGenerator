import { Router } from 'express';
import { 
  inboundForm, 
  socialWebhook, 
  getLeads, 
  triggerGmapsScraper,
  triggerScraper 
} from '../controllers/leadController';

const router = Router();

router.get('/leads', getLeads);
router.post('/leads/inbound', inboundForm);
router.post('/webhooks/social', socialWebhook);
router.post('/leads/scrape', triggerScraper);
router.post('/leads/scrape-gmaps', triggerGmapsScraper);

export default router;
