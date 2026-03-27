import Expense from '../models/Expense.js';
import FriendRequest from '../models/FriendRequest.js';
import Group from '../models/Group.js';
import User from '../models/User.js';
import { createHttpError } from '../utils/httpError.js';

const MAX_ITEMS = 30;

const createNotification = ({ id, title, message, createdAt, kind }) => ({
  id,
  title,
  message,
  createdAt,
  kind,
});

export const listNotifications = async (currentUserId) => {
  const currentUser = await User.findById(currentUserId).select('notificationsReadAt');
  if (!currentUser) {
    throw createHttpError(404, 'User not found.');
  }

  const [incomingRequests, acceptedRequests, addedGroups, groupExpenses] = await Promise.all([
    FriendRequest.find({
      toUser: currentUserId,
      status: 'pending',
    })
      .populate('fromUser', 'name')
      .sort({ createdAt: -1 })
      .limit(MAX_ITEMS),

    FriendRequest.find({
      fromUser: currentUserId,
      status: 'accepted',
    })
      .populate('toUser', 'name')
      .sort({ updatedAt: -1 })
      .limit(MAX_ITEMS),

    Group.find({
      members: currentUserId,
      createdBy: { $ne: currentUserId },
    })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(MAX_ITEMS),

    Expense.find({
      type: 'group',
      splitBetween: currentUserId,
      paidBy: { $ne: currentUserId },
    })
      .populate('paidBy', 'name')
      .populate('group', 'name')
      .sort({ createdAt: -1 })
      .limit(MAX_ITEMS),
  ]);

  const notifications = [
    ...incomingRequests.map((request) =>
      createNotification({
        id: `fr-pending-${request._id}`,
        title: 'New friend request',
        message: `${request.fromUser?.name || 'Someone'} sent you a friend request.`,
        createdAt: request.createdAt,
        kind: 'friend-request',
      }),
    ),
    ...acceptedRequests.map((request) =>
      createNotification({
        id: `fr-accepted-${request._id}`,
        title: 'Friend request accepted',
        message: `${request.toUser?.name || 'A user'} accepted your friend request.`,
        createdAt: request.updatedAt || request.createdAt,
        kind: 'friend-accepted',
      }),
    ),
    ...addedGroups.map((group) =>
      createNotification({
        id: `group-added-${group._id}`,
        title: 'Added to group',
        message: `${group.createdBy?.name || 'Someone'} added you to ${group.name}.`,
        createdAt: group.createdAt,
        kind: 'group-added',
      }),
    ),
    ...groupExpenses.map((expense) =>
      createNotification({
        id: `expense-group-${expense._id}`,
        title: 'New group expense',
        message: `${expense.paidBy?.name || 'A member'} added ${expense.title} in ${expense.group?.name || 'a group'}.`,
        createdAt: expense.createdAt,
        kind: 'group-expense',
      }),
    ),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, MAX_ITEMS);

  const readTime = currentUser.notificationsReadAt ? new Date(currentUser.notificationsReadAt).getTime() : 0;

  return {
    notifications: notifications.map((item) => ({
      ...item,
      unread: new Date(item.createdAt).getTime() > readTime,
    })),
  };
};

export const markAllNotificationsRead = async (currentUserId) => {
  const user = await User.findById(currentUserId);
  if (!user) {
    throw createHttpError(404, 'User not found.');
  }

  user.notificationsReadAt = new Date();
  await user.save();
};
