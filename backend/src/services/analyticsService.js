import Expense from '../models/Expense.js';
import Group from '../models/Group.js';
import Settlement from '../models/Settlement.js';
import { createHttpError } from '../utils/httpError.js';
import { computeBalancesForCurrentUser } from '../utils/balances.js';

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

export const getSummary = async (currentUserId) => {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const personalExpenses = await Expense.find({
    createdBy: currentUserId,
    type: 'personal',
    date: {
      $gte: monthStart,
      $lte: monthEnd,
    },
  }).select('amount category');

  const totalMonthlySpending = personalExpenses.reduce((sum, item) => sum + Number(item.amount), 0);

  const categoryTotals = personalExpenses.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + Number(item.amount);
    return acc;
  }, {});

  const categoryWise = Object.entries(categoryTotals).map(([category, total]) => ({
    category,
    total: Number(total.toFixed(2)),
  }));

  const mostSpentCategory =
    categoryWise.length > 0
      ? categoryWise.reduce((max, current) => (current.total > max.total ? current : max), categoryWise[0])
      : null;

  return {
    totalMonthlySpending: Number(totalMonthlySpending.toFixed(2)),
    mostSpentCategory,
    categoryWise,
  };
};

export const getBalances = async (currentUserId) => {
  const groups = await Group.find({ members: currentUserId }).select('_id name');

  if (groups.length === 0) {
    return {
      whoOwesYou: [],
      whoYouOwe: [],
      byGroup: [],
    };
  }

  const groupIds = groups.map((group) => group._id);
  const groupExpenses = await Expense.find({
    type: 'group',
    group: { $in: groupIds },
  })
    .populate('group', '_id name')
    .populate('paidBy', '_id name')
    .populate('splitBetween', '_id name');

  const settlements = await Settlement.find({
    group: { $in: groupIds },
    $or: [{ fromUser: currentUserId }, { toUser: currentUserId }],
  }).select('group fromUser toUser amount');

  const settlementAdjustmentsByGroup = settlements.reduce((acc, entry) => {
    const groupKey = String(entry.group);
    const fromUser = String(entry.fromUser);
    const toUser = String(entry.toUser);
    const amount = Number(entry.amount || 0);

    if (!acc[groupKey]) {
      acc[groupKey] = {};
    }

    if (toUser === String(currentUserId) && fromUser !== String(currentUserId)) {
      acc[groupKey][fromUser] = (acc[groupKey][fromUser] || 0) - amount;
    }

    if (fromUser === String(currentUserId) && toUser !== String(currentUserId)) {
      acc[groupKey][toUser] = (acc[groupKey][toUser] || 0) + amount;
    }

    return acc;
  }, {});

  const byGroup = groups.map((group) => {
    const balances = computeBalancesForCurrentUser({
      expenses: groupExpenses,
      currentUserId,
      groupId: group._id,
    });

    const groupAdjustments = settlementAdjustmentsByGroup[String(group._id)] || {};
    Object.entries(groupAdjustments).forEach(([userId, delta]) => {
      balances[userId] = Number(((balances[userId] || 0) + Number(delta)).toFixed(2));
    });

    return {
      groupId: String(group._id),
      groupName: group.name,
      balances,
    };
  });

  const mergedBalances = byGroup.reduce((acc, groupEntry) => {
    Object.entries(groupEntry.balances).forEach(([userId, amount]) => {
      acc[userId] = (acc[userId] || 0) + Number(amount);
    });
    return acc;
  }, {});

  const userNames = {};
  groupExpenses.forEach((expense) => {
    if (expense.paidBy?._id) {
      userNames[String(expense.paidBy._id)] = expense.paidBy.name;
    }

    (expense.splitBetween || []).forEach((member) => {
      userNames[String(member._id)] = member.name;
    });
  });

  const whoOwesYou = [];
  const whoYouOwe = [];

  Object.entries(mergedBalances).forEach(([userId, amount]) => {
    const rounded = Number(amount.toFixed(2));

    if (rounded > 0) {
      whoOwesYou.push({ userId, name: userNames[userId] || userId, amount: rounded });
    }

    if (rounded < 0) {
      whoYouOwe.push({ userId, name: userNames[userId] || userId, amount: Math.abs(rounded) });
    }
  });

  return {
    whoOwesYou,
    whoYouOwe,
    byGroup,
  };
};

export const settleUp = async ({ currentUserId, groupId, userId }) => {
  const group = await Group.findOne({ _id: groupId, members: currentUserId }).select('_id members');
  if (!group) {
    throw createHttpError(404, 'Group not found.');
  }

  if (!group.members.some((memberId) => String(memberId) === String(userId))) {
    throw createHttpError(400, 'User is not a member of this group.');
  }

  if (String(userId) === String(currentUserId)) {
    throw createHttpError(400, 'Cannot settle up with yourself.');
  }

  const groupExpenses = await Expense.find({
    type: 'group',
    group: group._id,
  })
    .populate('group', '_id name')
    .populate('paidBy', '_id name')
    .populate('splitBetween', '_id name');

  const rawBalances = computeBalancesForCurrentUser({
    expenses: groupExpenses,
    currentUserId,
    groupId: group._id,
  });

  const settlements = await Settlement.find({
    group: group._id,
    $or: [{ fromUser: currentUserId }, { toUser: currentUserId }],
  }).select('fromUser toUser amount');

  const adjustedBalance = settlements.reduce((balance, entry) => {
    const fromUser = String(entry.fromUser);
    const toUser = String(entry.toUser);
    const amount = Number(entry.amount || 0);

    if (toUser === String(currentUserId) && fromUser === String(userId)) {
      return balance - amount;
    }

    if (fromUser === String(currentUserId) && toUser === String(userId)) {
      return balance + amount;
    }

    return balance;
  }, Number(rawBalances[String(userId)] || 0));

  const rounded = Number(adjustedBalance.toFixed(2));
  if (Math.abs(rounded) < 0.01) {
    return { message: 'Already settled.', settledAmount: 0 };
  }

  const settlementAmount = Number(Math.abs(rounded).toFixed(2));
  const fromUser = rounded < 0 ? currentUserId : userId;
  const toUser = rounded < 0 ? userId : currentUserId;

  await Settlement.create({
    group: group._id,
    fromUser,
    toUser,
    amount: settlementAmount,
  });

  return {
    message: 'Balance settled successfully.',
    settledAmount: settlementAmount,
  };
};
