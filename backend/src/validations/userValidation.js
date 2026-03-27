import { createHttpError } from '../utils/httpError.js';

export const validateAddFriendInput = ({ friendId, currentUserId }) => {
  if (!friendId) {
    throw createHttpError(400, 'friendId is required.');
  }

  if (String(friendId) === String(currentUserId)) {
    throw createHttpError(400, 'You cannot add yourself as a friend.');
  }
};

export const validateFriendRequestInput = ({ toUserId, currentUserId }) => {
  if (!toUserId) {
    throw createHttpError(400, 'toUserId is required.');
  }

  if (String(toUserId) === String(currentUserId)) {
    throw createHttpError(400, 'You cannot send a friend request to yourself.');
  }
};

export const validateFriendRequestActionInput = ({ requestId }) => {
  if (!requestId) {
    throw createHttpError(400, 'requestId is required.');
  }
};

export const validateUpdateProfileInput = ({ name, avatarDataUrl, removeAvatar }) => {
  if (name != null && typeof name !== 'string') {
    throw createHttpError(400, 'name should be a string.');
  }

  if (avatarDataUrl != null && typeof avatarDataUrl !== 'string') {
    throw createHttpError(400, 'avatarDataUrl should be a string.');
  }

  if (removeAvatar != null && typeof removeAvatar !== 'boolean') {
    throw createHttpError(400, 'removeAvatar should be a boolean.');
  }
};
