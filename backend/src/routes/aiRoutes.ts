import { Router } from 'express';
import { generateIcebreaker } from '../controllers/aiController';

const router = Router();

router.post('/ai/icebreaker', generateIcebreaker);

export default router;
