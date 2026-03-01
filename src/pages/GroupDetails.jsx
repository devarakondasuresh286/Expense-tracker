import { useMemo } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { EXPENSE_GROUPS } from '../constants/expenseConstants';
import CategoryPieChart from '../components/CategoryPieChart';
import MonthlySummary from '../components/MonthlySummary';

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

function GroupDetails({ expenses }) {
  const { groupName } = useParams();
  const selectedGroup = decodeURIComponent(groupName ?? '');

  if (!GROUPS.includes(selectedGroup)) {
    return <Navigate to="/groups" replace />;
  }

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

  const selectedGroupExpenses = groupedExpenses[selectedGroup] ?? [];

  return (
    <section className="page-grid" aria-label={`${selectedGroup} workspace`}>
      <div className="group-workspace-header">
        <h2 className="section-title">{selectedGroup} Workspace</h2>
        <Link to="/groups" className="nav-link">
          Back to Groups
        </Link>
      </div>

      <section className="group-workspace-grid" aria-label="Group workspace content">
        <article className="card group-workspace-panel" aria-label="History panel">
          <h3 className="section-title">History</h3>
          {selectedGroupExpenses.length === 0 ? (
            <p className="empty-state">No expenses in this group yet.</p>
          ) : (
            <ul className="expense-list">
              {selectedGroupExpenses.map((expense, index) => (
                <li key={expense.id} className="expense-item" style={{ '--item-index': index % 8 }}>
                  <div>
                    <p className="expense-title">{expense.title}</p>
                    <p className="expense-meta">
                      {expense.category} • {expense.date}
                    </p>
                  </div>
                  <span className="expense-amount">${Number(expense.amount).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="card group-workspace-panel" aria-label="Insights panel">
          <h3 className="section-title">Insights</h3>
          <CategoryPieChart expenses={selectedGroupExpenses} />
          <MonthlySummary expenses={selectedGroupExpenses} />
        </article>
      </section>
    </section>
  );
}

export default GroupDetails;
