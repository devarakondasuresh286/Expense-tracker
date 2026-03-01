import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { EXPENSE_GROUPS } from '../constants/expenseConstants';

const GROUPS = EXPENSE_GROUPS;

function getGroupForExpense(expense, fallbackIndex) {
  if (GROUPS.includes(expense.group)) {
    return expense.group;
  }

  const numericId = Number(expense.id);

  if (Number.isFinite(numericId)) {
    return GROUPS[Math.abs(numericId) % GROUPS.length];
  }

  return GROUPS[fallbackIndex % GROUPS.length];
}

function Groups({ expenses }) {
  const navigate = useNavigate();

  const groupedExpenses = useMemo(() => {
    const buckets = GROUPS.reduce((accumulator, group) => {
      accumulator[group] = [];
      return accumulator;
    }, {});

    expenses.forEach((expense, index) => {
      const group = getGroupForExpense(expense, index);
      buckets[group].push(expense);
    });

    return buckets;
  }, [expenses]);

  return (
    <section className="page-grid" aria-label="Groups page">
      <article className="card groups-card">
        <h2 className="section-title">Expense Groups</h2>
        <p className="expense-meta">Select a group to open its workspace.</p>

        <ul className="group-list" aria-label="Groups list">
          {GROUPS.map((group) => (
            <li key={group} className="group-item">
              <button
                type="button"
                className="group-select-btn"
                onClick={() => navigate(`/groups/${encodeURIComponent(group)}`)}
              >
                <p className="expense-title">{group}</p>
                <p className="expense-meta">{groupedExpenses[group].length} expense{groupedExpenses[group].length === 1 ? '' : 's'}</p>
              </button>
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}

export default Groups;
