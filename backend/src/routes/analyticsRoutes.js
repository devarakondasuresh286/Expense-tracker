import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getBalances, getSummary, settleUp } from '../controllers/analyticsController.js';

const router = Router();

router.get('/summary', requireAuth, asyncHandler(getSummary));
router.get('/balances', requireAuth, asyncHandler(getBalances));
router.post('/settle-up', requireAuth, asyncHandler(settleUp));

export default router;
