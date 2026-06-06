import { Router } from 'express';
import { scheduleMeeting } from '../controllers/meetingController';

const router = Router();

router.post('/meetings/schedule', scheduleMeeting);

export default router;
