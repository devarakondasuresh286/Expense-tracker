import './App.css';
import { useEffect, useMemo, useState } from 'react';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import StatsCards from './components/StatsCards';
import CategoryFilter from './components/CategoryFilter';
import CategoryPieChart from './components/CategoryPieChart';
import { DEFAULT_FILTER_CATEGORY, STORAGE_KEY } from './constants/expenseConstants';

function App() {
  const [expenses, setExpenses] = useState(() => {
    const savedExpenses = localStorage.getItem(STORAGE_KEY);

    if (!savedExpenses) {
      return [];
    }

    try {
      const parsedExpenses = JSON.parse(savedExpenses);
      return Array.isArray(parsedExpenses) ? parsedExpenses : [];
    } catch {
      return [];
    }
  });
  const [filterCategory, setFilterCategory] = useState(DEFAULT_FILTER_CATEGORY);
  const [editingExpense, setEditingExpense] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  }, [expenses]);

  const totalSpent = useMemo(
    () => expenses.reduce((sum, item) => sum + Number(item.amount), 0),
    [expenses],
  );

  const filteredExpenses = useMemo(() => {
    if (filterCategory === 'All') {
      return expenses;
    }

    return expenses.filter((item) => item.category === filterCategory);
  }, [expenses, filterCategory]);

  const categoriesUsed = useMemo(
    () => new Set(expenses.map((item) => item.category)).size,
    [expenses],
  );

  const latestExpense = expenses[0] ?? null;
  const expenseCount = expenses.length;

  const addExpense = (expenseData) => {
    const nextExpense = {
      id: Date.now(),
      ...expenseData,
    };

    setExpenses((prev) => [nextExpense, ...prev]);
  };

  const editExpense = (expenseOrId, updatedExpenseData) => {
    if (!updatedExpenseData) {
      setEditingExpense(expenseOrId);
      return;
    }

    setExpenses((prev) =>
      prev.map((item) =>
        item.id === expenseOrId
          ? {
              ...item,
              ...updatedExpenseData,
            }
          : item,
      ),
    );
    setEditingExpense(null);
  };

  const deleteExpense = (id) => {
    setExpenses((prev) => prev.filter((item) => item.id !== id));

    if (editingExpense?.id === id) {
      setEditingExpense(null);
    }
  };

  const cancelEditing = () => {
    setEditingExpense(null);
  };

  return (
    <main className="app">
      <section className="app-shell">
        <header className="hero-card">
          <div>
            <h1 className="title">Expense Tracker</h1>
            <p className="subtitle">Track daily spending with a cleaner dashboard layout.</p>
          </div>
          <div className="hero-badge">{expenseCount} entries saved</div>
        </header>

        <StatsCards
          totalSpent={totalSpent}
          expenseCount={expenseCount}
          categoriesUsed={categoriesUsed}
          latestExpense={latestExpense}
        />

        <section className="content-grid">
          <article className="card form-card">
            <h2 className="section-title">Add or Edit Expense</h2>
            <ExpenseForm
              addExpense={addExpense}
              editExpense={editExpense}
              editingExpense={editingExpense}
              cancelEditing={cancelEditing}
            />
          </article>

          <article className="card list-card">
            <div className="list-header">
              <h2 className="section-title">Expense History</h2>
              <CategoryFilter
                filterCategory={filterCategory}
                setFilterCategory={setFilterCategory}
              />
            </div>

            <ul className="expense-list">
              <ExpenseList
                expenses={filteredExpenses}
                hasAnyExpenses={expenseCount > 0}
                editExpense={editExpense}
                deleteExpense={deleteExpense}
              />
            </ul>
          </article>
        </section>

        <CategoryPieChart expenses={expenses} />
      </section>
    </main>
  );
}

export default App;
