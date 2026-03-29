import { createHttpError } from '../utils/httpError.js';

export const validateCreateExpenseInput = (payload) => {
  const { title, amount, category, type, date, splitMode, splitConfig } = payload;

  if (!title?.trim() || !amount || !category?.trim() || !type || !date) {
    throw createHttpError(400, 'title, amount, category, type, and date are required.');
  }

  if (!['personal', 'group'].includes(type)) {
    throw createHttpError(400, 'Invalid expense type.');
  }

  if (Number(amount) <= 0) {
    throw createHttpError(400, 'Amount should be greater than 0.');
  }

  if (type === 'group' && !payload.groupId) {
    throw createHttpError(400, 'groupId is required for group expense.');
  }

  if (type === 'group' && splitMode && !['equal', 'custom'].includes(splitMode)) {
    throw createHttpError(400, 'splitMode must be either equal or custom.');
  }

  if (type === 'group' && splitMode === 'custom') {
    if (!Array.isArray(splitConfig) || splitConfig.length === 0) {
      throw createHttpError(400, 'splitConfig is required for custom split.');
    }

    const hasInvalidRow = splitConfig.some((item) => !item?.userId || Number(item.amount) < 0);
    if (hasInvalidRow) {
      throw createHttpError(400, 'Each splitConfig item must include userId and non-negative amount.');
    }

    const totalSplit = splitConfig.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    if (Math.abs(totalSplit - Number(amount)) > 0.01) {
      throw createHttpError(400, 'Custom split total must equal expense amount.');
    }
  }
};
