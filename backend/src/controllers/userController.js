import {
  validateAddFriendInput,
  validateFriendRequestActionInput,
  validateFriendRequestInput,
} from '../validations/userValidation.js';
import * as userService from '../services/userService.js';

export const listUsers = async (req, res) => {
  const users = await userService.listUsers(req.user._id);
  return res.json({ users });
};

export const addFriend = async (req, res) => {
  validateAddFriendInput({
    friendId: req.body?.friendId,
    currentUserId: req.user._id,
  });

  await userService.addFriend({
    currentUserId: req.user._id,
    friendId: req.body.friendId,
  });

  return res.status(201).json({ message: 'Friend added.' });
};

export const getFriendNetwork = async (req, res) => {
  const network = await userService.getFriendNetwork(req.user._id);
  return res.json(network);
};

export const searchUsers = async (req, res) => {
  const users = await userService.searchUsers({
    currentUserId: req.user._id,
    query: req.query?.q || req.query?.query || '',
  });

  return res.json({ users });
};

export const sendFriendRequest = async (req, res) => {
  validateFriendRequestInput({
    toUserId: req.body?.toUserId,
    currentUserId: req.user._id,
  });

  await userService.sendFriendRequest({
    fromUserId: req.user._id,
    toUserId: req.body.toUserId,
  });

  return res.status(201).json({ message: 'Friend request sent.' });
};

export const acceptFriendRequest = async (req, res) => {
  validateFriendRequestActionInput({ requestId: req.params.requestId });

  await userService.acceptFriendRequest({
    currentUserId: req.user._id,
    requestId: req.params.requestId,
  });

  return res.json({ message: 'Friend request accepted.' });
};

export const rejectFriendRequest = async (req, res) => {
  validateFriendRequestActionInput({ requestId: req.params.requestId });

  await userService.rejectFriendRequest({
    currentUserId: req.user._id,
    requestId: req.params.requestId,
  });

  return res.json({ message: 'Friend request rejected.' });
};
