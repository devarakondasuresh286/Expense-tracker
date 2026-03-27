import * as notificationService from '../services/notificationService.js';

export const listNotifications = async (req, res) => {
  const result = await notificationService.listNotifications(req.user._id);
  return res.json(result);
};

export const markAllRead = async (req, res) => {
  await notificationService.markAllNotificationsRead(req.user._id);
  return res.json({ message: 'All notifications marked as read.' });
};
