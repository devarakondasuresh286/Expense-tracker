import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { addMemberToGroup, createGroup, listGroups } from '../controllers/groupController.js';

const router = Router();

router.get('/', requireAuth, asyncHandler(listGroups));
router.post('/', requireAuth, asyncHandler(createGroup));
router.post('/:groupId/members', requireAuth, asyncHandler(addMemberToGroup));

export default router;
