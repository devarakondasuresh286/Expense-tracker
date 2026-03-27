import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { listNotifications, markAllRead } from '../controllers/notificationController.js';

const router = Router();

router.get('/', requireAuth, asyncHandler(listNotifications));
router.post('/read-all', requireAuth, asyncHandler(markAllRead));

export default router;
