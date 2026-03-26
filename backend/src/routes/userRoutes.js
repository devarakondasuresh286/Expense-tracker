import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
	acceptFriendRequest,
	addFriend,
	getFriendNetwork,
	listUsers,
	rejectFriendRequest,
	searchUsers,
	sendFriendRequest,
} from '../controllers/userController.js';

const router = Router();

router.get('/', requireAuth, asyncHandler(listUsers));
router.post('/friends', requireAuth, asyncHandler(addFriend));
router.get('/friends/network', requireAuth, asyncHandler(getFriendNetwork));
router.get('/search', requireAuth, asyncHandler(searchUsers));
router.post('/friend-requests', requireAuth, asyncHandler(sendFriendRequest));
router.post('/friend-requests/:requestId/accept', requireAuth, asyncHandler(acceptFriendRequest));
router.post('/friend-requests/:requestId/reject', requireAuth, asyncHandler(rejectFriendRequest));

export default router;
