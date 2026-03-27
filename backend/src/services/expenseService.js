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
  const { title, amount, category, type, notes = '', date, groupId = null, paidBy, splitBetween = [] } = payload;

  let validatedGroupId = null;
  let validatedPaidBy = String(paidBy || currentUserId);
  let validatedSplitBetween = Array.from(new Set((splitBetween || []).map(String)));

  if (type === 'group') {
    const group = await Group.findOne({ _id: groupId, members: currentUserId }).select('_id members');
    if (!group) {
      throw createHttpError(404, 'Group not found or access denied.');
    }

    const groupMemberIds = new Set(group.members.map((memberId) => String(memberId)));
    if (!groupMemberIds.has(validatedPaidBy)) {
      throw createHttpError(400, 'paidBy should be a member of this group.');
    }

    validatedSplitBetween = validatedSplitBetween.filter((memberId) => groupMemberIds.has(memberId));
    if (validatedSplitBetween.length === 0) {
      validatedSplitBetween = Array.from(groupMemberIds);
    }

    if (!validatedSplitBetween.includes(validatedPaidBy)) {
      validatedSplitBetween.push(validatedPaidBy);
    }

    validatedGroupId = group._id;
  } else {
    validatedPaidBy = String(currentUserId);
    validatedSplitBetween = [];
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
