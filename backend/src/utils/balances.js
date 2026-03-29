export const computeBalancesForCurrentUser = ({ expenses, currentUserId, groupId = null }) => {
  const balances = {};

  const applyBalanceDelta = (userId, amount) => {
    const normalizedUserId = String(userId);
    if (!normalizedUserId || !Number.isFinite(Number(amount)) || Math.abs(Number(amount)) < 0.00001) {
      return;
    }

    balances[normalizedUserId] = (balances[normalizedUserId] || 0) + Number(amount);
  };

  expenses.forEach((expense) => {
    if (expense.type !== 'group') {
      return;
    }

    if (groupId && String(expense.group?._id || expense.group) !== String(groupId)) {
      return;
    }

    const participants = (expense.splitBetween || []).map((member) =>
      String(member?._id || member),
    );
    const paidBy = String(expense.paidBy?._id || expense.paidBy);
    const splitMode = expense.splitMode || 'equal';

    if (splitMode === 'custom') {
      const customRows = (expense.splitConfig || []).map((row) => ({
        userId: String(row?.user?._id || row?.user),
        amount: Number(row?.amount || 0),
      }));

      const participantIds = customRows.filter((row) => row.amount > 0).map((row) => row.userId);
      if (paidBy !== String(currentUserId) && !participantIds.includes(String(currentUserId))) {
        return;
      }

      if (paidBy === String(currentUserId)) {
        customRows.forEach((row) => {
          if (row.userId === String(currentUserId)) {
            return;
          }

          applyBalanceDelta(row.userId, row.amount);
        });
      } else {
        const currentShare = customRows.find((row) => row.userId === String(currentUserId))?.amount || 0;
        applyBalanceDelta(paidBy, -currentShare);
      }
      return;
    }

    if (!participants.includes(String(currentUserId)) || participants.length === 0) {
      return;
    }

    const share = Number(expense.amount) / participants.length;

    if (paidBy === String(currentUserId)) {
      participants.forEach((participantId) => {
        if (participantId === String(currentUserId)) {
          return;
        }

        applyBalanceDelta(participantId, share);
      });
      return;
    }

    applyBalanceDelta(paidBy, -share);
  });

  return Object.fromEntries(
    Object.entries(balances).map(([key, value]) => [key, Number(value.toFixed(2))]),
  );
};
