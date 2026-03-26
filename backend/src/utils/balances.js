export const computeBalancesForCurrentUser = ({ expenses, currentUserId, groupId = null }) => {
  const balances = {};

  expenses.forEach((expense) => {
    if (expense.type !== 'group') {
      return;
    }

    if (groupId && String(expense.group?._id || expense.group) !== String(groupId)) {
      return;
    }

    const participants = (expense.splitBetween || []).map((id) => String(id));
    if (!participants.includes(String(currentUserId)) || participants.length === 0) {
      return;
    }

    const paidBy = String(expense.paidBy?._id || expense.paidBy);
    const share = Number(expense.amount) / participants.length;

    if (paidBy === String(currentUserId)) {
      participants.forEach((participantId) => {
        if (participantId === String(currentUserId)) {
          return;
        }

        balances[participantId] = (balances[participantId] || 0) + share;
      });
      return;
    }

    balances[paidBy] = (balances[paidBy] || 0) - share;
  });

  return Object.fromEntries(
    Object.entries(balances).map(([key, value]) => [key, Number(value.toFixed(2))]),
  );
};
