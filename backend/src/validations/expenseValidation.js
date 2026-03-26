import { createHttpError } from '../utils/httpError.js';

export const validateCreateExpenseInput = (payload) => {
  const { title, amount, category, type, date } = payload;

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
};
