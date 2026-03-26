import { validateCreateExpenseInput } from '../validations/expenseValidation.js';
import * as expenseService from '../services/expenseService.js';

export const listExpenses = async (req, res) => {
  const expenses = await expenseService.listExpenses({
    currentUserId: req.user._id,
    query: req.query,
  });

  return res.json({ expenses });
};

export const createExpense = async (req, res) => {
  validateCreateExpenseInput(req.body || {});

  const expense = await expenseService.createExpense({
    currentUserId: req.user._id,
    payload: req.body,
  });

  return res.status(201).json({ expense });
};

export const deleteExpense = async (req, res) => {
  await expenseService.deleteExpense({
    currentUserId: req.user._id,
    expenseId: req.params.expenseId,
  });

  return res.json({ message: 'Expense deleted.' });
};
