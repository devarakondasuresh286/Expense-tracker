import { useMemo } from 'react';
import CategoryFilter from '../components/CategoryFilter';
import MonthlySummary from '../components/MonthlySummary';
import { EXPENSE_TYPES } from '../constants/expenseConstants';

function History({
  deleteExpense,
  filterCategory,
  setFilterCategory,
  filteredExpenses,
  expenseCount,
  personalExpenses,
  groups,
  friends,
  currentUser,
}) {
  const groupsById = useMemo(
    () =>
      groups.reduce((accumulator, group) => {
        accumulator[group.id] = group;
        return accumulator;
      }, {}),
    [groups],
  );

  const usersById = useMemo(() => {
    const map = {
      [currentUser.id]: currentUser,
    };

    friends.forEach((friend) => {
      map[friend.id] = friend;
    });

    return map;
  }, [friends, currentUser]);

  const formatDate = (dateValue) => {
    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const historyItems = filteredExpenses.map((expense) => {
    const actorName = usersById[expense.paidBy]?.name ?? expense.paidBy ?? currentUser.name;

    if (expense.type === EXPENSE_TYPES.GROUP && expense.groupId) {
      const groupName = groupsById[expense.groupId]?.name ?? 'Unknown';
      return {
        ...expense,
        activityText: `${actorName} added ${expense.title} to ${groupName} group`,
      };
    }

    return {
      ...expense,
      activityText: `${actorName} added ${expense.title} as personal expense`,
    };
  });

  return (
    <section className="page-grid" aria-label="Expense history page">
      <article className="card list-card">
        <div className="list-header">
          <h2 className="section-title">Expense History</h2>
          <CategoryFilter filterCategory={filterCategory} setFilterCategory={setFilterCategory} />
        </div>

        {expenseCount === 0 ? (
          <p className="empty-state">No expenses yet. Add expense from Home page.</p>
        ) : historyItems.length === 0 ? (
          <p className="empty-state">No expenses found for the selected category.</p>
        ) : (
          <ul className="expense-list">
            {historyItems.map((item, index) => (
              <li key={item.id} className="expense-item" style={{ '--item-index': index % 8 }}>
                <div>
                  <p className="expense-title">{item.activityText}</p>
                  <p className="expense-meta">
                    {item.category} • {formatDate(item.date)}
                  </p>
                </div>
                <div className="expense-actions">
                  <span className="expense-amount">${Number(item.amount).toFixed(2)}</span>
                  <button className="delete-btn" type="button" onClick={() => deleteExpense(item.id)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </article>

      <MonthlySummary expenses={personalExpenses} />
    </section>
  );
}

export default History;
