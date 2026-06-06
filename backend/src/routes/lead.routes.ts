import { Router } from 'express';
import { getLeads, startScrape } from '../controllers/lead.controller';

const router = Router();

router.get('/', getLeads);
router.post('/scrape', startScrape);

export default router;
