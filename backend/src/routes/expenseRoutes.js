import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createExpense, deleteExpense, listExpenses } from '../controllers/expenseController.js';

const router = Router();

router.get('/', requireAuth, asyncHandler(listExpenses));
router.post('/', requireAuth, asyncHandler(createExpense));
router.delete('/:expenseId', requireAuth, asyncHandler(deleteExpense));

export default router;
