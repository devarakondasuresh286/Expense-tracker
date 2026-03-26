import { useMemo, useState } from 'react';
import CategoryFilter from '../components/CategoryFilter';
import MonthlySummary from '../components/MonthlySummary';
import { EXPENSE_TYPES } from '../constants/expenseConstants';
import { downloadExpensesCsv } from '../utils/exportCsv';

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
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

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

  const searchedItems = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return historyItems.filter((item) => {
      if (typeFilter !== 'all' && item.type !== typeFilter) {
        return false;
      }

      if (dateFrom && String(item.date) < dateFrom) {
        return false;
      }

      if (dateTo && String(item.date) > dateTo) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const haystack = `${item.title} ${item.category} ${item.notes || ''} ${item.activityText}`.toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [historyItems, searchText, typeFilter, dateFrom, dateTo]);

  const exportCsv = () => {
    const dateLabel = new Date().toISOString().split('T')[0];
    downloadExpensesCsv(searchedItems, `expense-report-${dateLabel}.csv`);
  };

  const clearFilters = () => {
    setSearchText('');
    setTypeFilter('all');
    setDateFrom('');
    setDateTo('');
    setFilterCategory('All');
  };

  return (
    <section className="page-grid" aria-label="Expense history page">
      <article className="card list-card">
        <div className="list-header">
          <h2 className="section-title">Expense History</h2>
          <CategoryFilter filterCategory={filterCategory} setFilterCategory={setFilterCategory} />
        </div>

        <section className="history-toolbar" aria-label="History tools">
          <input
            className="input"
            type="search"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search title, category, notes"
            aria-label="Search expenses"
          />
          <select
            className="input"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            aria-label="Filter by expense type"
          >
            <option value="all">All types</option>
            <option value="personal">Personal</option>
            <option value="group">Group</option>
          </select>
          <input
            className="input"
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            aria-label="Start date"
          />
          <input
            className="input"
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            aria-label="End date"
          />
          <button className="btn secondary-btn" type="button" onClick={clearFilters}>
            Clear
          </button>
          <button className="btn" type="button" onClick={exportCsv} disabled={searchedItems.length === 0}>
            Export CSV
          </button>
        </section>

        {expenseCount === 0 ? (
          <p className="empty-state">No expenses yet. Add expense from Home page.</p>
        ) : searchedItems.length === 0 ? (
          <p className="empty-state">No expenses found for the selected category.</p>
        ) : (
          <ul className="expense-list">
            {searchedItems.map((item, index) => (
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
