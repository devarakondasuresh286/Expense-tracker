import { EXPENSE_TYPES } from '../constants/expenseConstants';

export const todayDateString = () => new Date().toISOString().split('T')[0];

export const normalizeSplitBetween = (splitBetween, fallbackMemberIds = []) => {
  const source = Array.isArray(splitBetween) && splitBetween.length > 0 ? splitBetween : fallbackMemberIds;
  return Array.from(new Set(source.filter(Boolean)));
};

export const getGroupExpenses = (expenses, groupId) =>
  expenses.filter((expense) => expense.type === EXPENSE_TYPES.GROUP && expense.groupId === groupId);

export const getPersonalExpenses = (expenses) =>
  expenses.filter((expense) => expense.type === EXPENSE_TYPES.PERSONAL);

export const getMonthlyTotal = (expenses) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  return expenses.reduce((sum, item) => {
    const parsedDate = new Date(item.date);

    if (Number.isNaN(parsedDate.getTime())) {
      return sum;
    }

    if (parsedDate.getFullYear() === currentYear && parsedDate.getMonth() === currentMonth) {
      return sum + Number(item.amount);
    }

    return sum;
  }, 0);
};

export const calculateGroupTotal = (expenses, groupId) =>
  getGroupExpenses(expenses, groupId).reduce((sum, expense) => sum + Number(expense.amount), 0);

export const calculateCurrentUserBalances = ({ expenses, groupId, currentUserId }) => {
  const balances = {};

  const applyBalanceDelta = (memberId, amount) => {
    if (!memberId || !Number.isFinite(Number(amount)) || Math.abs(Number(amount)) < 0.00001) {
      return;
    }

    balances[memberId] = (balances[memberId] ?? 0) + Number(amount);
  };

  getGroupExpenses(expenses, groupId).forEach((expense) => {
    const paidBy = expense.paidBy;
    const splitMode = expense.splitMode || 'equal';

    if (splitMode === 'custom') {
      const customRows = (expense.splitConfig || []).map((row) => ({
        userId: row.userId,
        amount: Number(row.amount || 0),
      }));

      const participantIds = customRows.filter((row) => row.amount > 0).map((row) => row.userId);
      if (!paidBy || (paidBy !== currentUserId && !participantIds.includes(currentUserId))) {
        return;
      }

      if (paidBy === currentUserId) {
        customRows.forEach((row) => {
          if (row.userId === currentUserId) {
            return;
          }

          applyBalanceDelta(row.userId, row.amount);
        });
      } else {
        const currentShare = customRows.find((row) => row.userId === currentUserId)?.amount || 0;
        applyBalanceDelta(paidBy, -currentShare);
      }
      return;
    }

    const participants = normalizeSplitBetween(expense.splitBetween, paidBy ? [paidBy] : []);

    if (!paidBy || participants.length === 0 || !participants.includes(currentUserId)) {
      return;
    }

    const share = Number(expense.amount) / participants.length;

    if (paidBy === currentUserId) {
      participants.forEach((participantId) => {
        if (participantId === currentUserId) {
          return;
        }

        applyBalanceDelta(participantId, share);
      });
      return;
    }

    applyBalanceDelta(paidBy, -share);
  });

  return Object.entries(balances).reduce((accumulator, [memberId, balance]) => {
    const normalized = Number(balance.toFixed(2));

    if (Math.abs(normalized) < 0.01) {
      accumulator[memberId] = 0;
      return accumulator;
    }

    accumulator[memberId] = normalized;
    return accumulator;
  }, {});
};

export const getBalanceStatus = (balance) => {
  if (balance > 0) {
    return 'Owes you';
  }

  if (balance < 0) {
    return 'You owe';
  }

  return 'Settled';
};
