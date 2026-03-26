import User from '../models/User.js';
import FriendRequest from '../models/FriendRequest.js';
import { createHttpError } from '../utils/httpError.js';

export const listUsers = async (currentUserId) => {
  const users = await User.find({ _id: { $ne: currentUserId } })
    .select('_id name email')
    .sort({ name: 1 });

  return users.map((user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
  }));
};

export const addFriend = async ({ currentUserId, friendId }) => {
  const friend = await User.findById(friendId).select('_id');
  if (!friend) {
    throw createHttpError(404, 'Friend not found.');
  }

  await User.updateOne(
    { _id: currentUserId },
    {
      $addToSet: {
        friends: friend._id,
      },
    },
  );
};

const normalizeUser = (user) => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
});

export const getFriendNetwork = async (currentUserId) => {
  const currentUser = await User.findById(currentUserId).populate('friends', '_id name email');
  if (!currentUser) {
    throw createHttpError(404, 'User not found.');
  }

  const incoming = await FriendRequest.find({
    toUser: currentUserId,
    status: 'pending',
  })
    .populate('fromUser', '_id name email')
    .sort({ createdAt: -1 });

  const outgoing = await FriendRequest.find({
    fromUser: currentUserId,
    status: 'pending',
  })
    .populate('toUser', '_id name email')
    .sort({ createdAt: -1 });

  return {
    friends: (currentUser.friends || []).map((friend) => normalizeUser(friend)),
    incomingRequests: incoming.map((request) => ({
      requestId: String(request._id),
      fromUser: normalizeUser(request.fromUser),
      createdAt: request.createdAt,
    })),
    outgoingRequests: outgoing.map((request) => ({
      requestId: String(request._id),
      toUser: normalizeUser(request.toUser),
      createdAt: request.createdAt,
    })),
  };
};

export const searchUsers = async ({ currentUserId, query }) => {
  const currentUser = await User.findById(currentUserId).select('friends');
  if (!currentUser) {
    throw createHttpError(404, 'User not found.');
  }

  const pendingRequests = await FriendRequest.find({
    status: 'pending',
    $or: [{ fromUser: currentUserId }, { toUser: currentUserId }],
  }).select('fromUser toUser');

  const blockedIds = new Set([
    String(currentUserId),
    ...(currentUser.friends || []).map((id) => String(id)),
  ]);

  pendingRequests.forEach((request) => {
    blockedIds.add(String(request.fromUser));
    blockedIds.add(String(request.toUser));
  });

  const normalizedQuery = String(query || '').trim();
  const filter = {
    _id: { $nin: Array.from(blockedIds) },
  };

  if (normalizedQuery) {
    filter.$or = [
      { name: { $regex: normalizedQuery, $options: 'i' } },
      { email: { $regex: normalizedQuery, $options: 'i' } },
    ];
  }

  const users = await User.find(filter).select('_id name email').sort({ name: 1 }).limit(25);
  return users.map((user) => normalizeUser(user));
};

export const sendFriendRequest = async ({ fromUserId, toUserId }) => {
  const targetUser = await User.findById(toUserId).select('_id');
  if (!targetUser) {
    throw createHttpError(404, 'User not found.');
  }

  const me = await User.findById(fromUserId).select('friends');
  const alreadyFriends = (me?.friends || []).some((friendId) => String(friendId) === String(toUserId));
  if (alreadyFriends) {
    throw createHttpError(409, 'You are already friends.');
  }

  const existingPending = await FriendRequest.findOne({
    status: 'pending',
    $or: [
      { fromUser: fromUserId, toUser: toUserId },
      { fromUser: toUserId, toUser: fromUserId },
    ],
  }).select('_id');

  if (existingPending) {
    throw createHttpError(409, 'A pending friend request already exists.');
  }

  await FriendRequest.create({
    fromUser: fromUserId,
    toUser: toUserId,
    status: 'pending',
  });
};

export const acceptFriendRequest = async ({ currentUserId, requestId }) => {
  const request = await FriendRequest.findOne({
    _id: requestId,
    toUser: currentUserId,
    status: 'pending',
  });

  if (!request) {
    throw createHttpError(404, 'Friend request not found.');
  }

  request.status = 'accepted';
  await request.save();

  await User.updateOne(
    { _id: currentUserId },
    {
      $addToSet: {
        friends: request.fromUser,
      },
    },
  );

  await User.updateOne(
    { _id: request.fromUser },
    {
      $addToSet: {
        friends: currentUserId,
      },
    },
  );
};

export const rejectFriendRequest = async ({ currentUserId, requestId }) => {
  const request = await FriendRequest.findOne({
    _id: requestId,
    toUser: currentUserId,
    status: 'pending',
  });

  if (!request) {
    throw createHttpError(404, 'Friend request not found.');
  }

  request.status = 'rejected';
  await request.save();
};
