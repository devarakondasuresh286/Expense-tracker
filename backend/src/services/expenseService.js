import Expense from '../models/Expense.js';
import Group from '../models/Group.js';
import { createHttpError } from '../utils/httpError.js';

const normalizeExpense = (expenseDoc) => ({
  id: expenseDoc._id,
  title: expenseDoc.title,
  amount: expenseDoc.amount,
  category: expenseDoc.category,
  type: expenseDoc.type,
  notes: expenseDoc.notes,
  date: expenseDoc.date,
  groupId: expenseDoc.group ? String(expenseDoc.group._id || expenseDoc.group) : null,
  paidBy: String(expenseDoc.paidBy?._id || expenseDoc.paidBy),
  splitBetween: (expenseDoc.splitBetween || []).map((member) => String(member._id || member)),
  splitMode: expenseDoc.splitMode || 'equal',
  splitConfig: (expenseDoc.splitConfig || []).map((item) => ({
    userId: String(item.user?._id || item.user),
    amount: Number(item.amount || 0),
  })),
  createdBy: String(expenseDoc.createdBy?._id || expenseDoc.createdBy),
});

export const listExpenses = async ({ currentUserId, query }) => {
  const { type, groupId, category, search } = query;

  const filters = {
    $or: [{ createdBy: currentUserId }, { splitBetween: currentUserId }, { paidBy: currentUserId }],
  };

  if (type === 'personal' || type === 'group') {
    filters.type = type;
  }

  if (groupId) {
    filters.group = groupId;
  }

  if (category) {
    filters.category = category;
  }

  if (search?.trim()) {
    filters.title = { $regex: search.trim(), $options: 'i' };
  }

  const expenses = await Expense.find(filters)
    .populate('group', '_id name')
    .populate('paidBy', '_id name email')
    .sort({ date: -1, createdAt: -1 });

  return expenses.map(normalizeExpense);
};

export const createExpense = async ({ currentUserId, payload }) => {
  const {
    title,
    amount,
    category,
    type,
    notes = '',
    date,
    groupId = null,
    paidBy,
    splitBetween = [],
    splitMode = 'equal',
    splitConfig = [],
  } = payload;

  let validatedGroupId = null;
  let validatedPaidBy = String(paidBy || currentUserId);
  let validatedSplitBetween = Array.from(new Set((splitBetween || []).map(String)));
  let validatedSplitMode = 'equal';
  let validatedSplitConfig = [];

  if (type === 'group') {
    const group = await Group.findOne({ _id: groupId, members: currentUserId }).select('_id members');
    if (!group) {
      throw createHttpError(404, 'Group not found or access denied.');
    }

    const groupMemberIds = new Set(group.members.map((memberId) => String(memberId)));
    if (!groupMemberIds.has(validatedPaidBy)) {
      throw createHttpError(400, 'paidBy should be a member of this group.');
    }

    if (splitMode === 'custom') {
      validatedSplitMode = 'custom';

      const normalizedCustomRows = (splitConfig || [])
        .map((item) => ({
          userId: String(item?.userId || ''),
          amount: Number(item?.amount || 0),
        }))
        .filter((item) => item.userId && item.amount >= 0 && groupMemberIds.has(item.userId));

      const customByUser = normalizedCustomRows.reduce((acc, item) => {
        acc[item.userId] = (acc[item.userId] || 0) + item.amount;
        return acc;
      }, {});

      const totalCustom = Object.values(customByUser).reduce((sum, value) => sum + Number(value), 0);
      if (Math.abs(totalCustom - Number(amount)) > 0.01) {
        throw createHttpError(400, 'Custom split total must equal expense amount.');
      }

      validatedSplitConfig = Object.entries(customByUser).map(([userId, splitAmount]) => ({
        user: userId,
        amount: Number(splitAmount.toFixed(2)),
      }));

      validatedSplitBetween = validatedSplitConfig
        .filter((item) => item.amount > 0)
        .map((item) => String(item.user));
    } else {
      validatedSplitBetween = validatedSplitBetween.filter((memberId) => groupMemberIds.has(memberId));
      if (validatedSplitBetween.length === 0) {
        validatedSplitBetween = Array.from(groupMemberIds);
      }

      if (!validatedSplitBetween.includes(validatedPaidBy)) {
        validatedSplitBetween.push(validatedPaidBy);
      }

      validatedSplitMode = 'equal';
      validatedSplitConfig = [];
    }

    validatedGroupId = group._id;
  } else {
    validatedPaidBy = String(currentUserId);
    validatedSplitBetween = [];
    validatedSplitMode = 'equal';
    validatedSplitConfig = [];
  }

  const created = await Expense.create({
    title: title.trim(),
    amount: Number(amount),
    category: category.trim(),
    type,
    notes: String(notes || '').trim(),
    date: new Date(date),
    createdBy: currentUserId,
    group: validatedGroupId,
    paidBy: validatedPaidBy,
    splitBetween: validatedSplitBetween,
    splitMode: validatedSplitMode,
    splitConfig: validatedSplitConfig,
  });

  const populated = await Expense.findById(created._id)
    .populate('group', '_id name')
    .populate('paidBy', '_id name email');

  return normalizeExpense(populated);
};

export const deleteExpense = async ({ currentUserId, expenseId }) => {
  const expense = await Expense.findById(expenseId);

  if (!expense) {
    throw createHttpError(404, 'Expense not found.');
  }

  const canDelete =
    String(expense.createdBy) === String(currentUserId) || String(expense.paidBy) === String(currentUserId);

  if (!canDelete) {
    throw createHttpError(403, 'You are not allowed to delete this expense.');
  }

  await expense.deleteOne();
};
