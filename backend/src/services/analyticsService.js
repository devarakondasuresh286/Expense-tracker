import Expense from '../models/Expense.js';
import Group from '../models/Group.js';
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

  const byGroup = groups.map((group) => {
    const balances = computeBalancesForCurrentUser({
      expenses: groupExpenses,
      currentUserId,
      groupId: group._id,
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
