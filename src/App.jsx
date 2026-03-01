import './App.css';
import { useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Groups from './pages/Groups';
import History from './pages/History';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import GroupDetails from './pages/GroupDetails';
import Login from './pages/Login';
import Register from './pages/Register';
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
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  }, [expenses]);

  const totalSpent = useMemo(
    () => expenses.reduce((sum, item) => sum + Number(item.amount), 0),
    [expenses],
  );

  const monthlyTotal = useMemo(() => {
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
  }, [expenses]);

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

  const totalGroupsJoined = useMemo(
    () => new Set(expenses.map((item) => item.group).filter(Boolean)).size,
    [expenses],
  );

  const highestSpendingCategory = useMemo(() => {
    if (expenses.length === 0) {
      return 'N/A';
    }

    const categoryTotals = expenses.reduce((accumulator, expense) => {
      const category = expense.category;
      const currentTotal = accumulator[category] ?? 0;
      accumulator[category] = currentTotal + Number(expense.amount);
      return accumulator;
    }, {});

    const highestCategoryEntry = Object.entries(categoryTotals).sort((first, second) => second[1] - first[1])[0];
    return highestCategoryEntry ? highestCategoryEntry[0] : 'N/A';
  }, [expenses]);

  const latestExpense = expenses[0] ?? null;
  const expenseCount = expenses.length;

  const addExpense = (expenseData) => {
    const nextExpense = {
      id: Date.now(),
      ...expenseData,
    };

    setExpenses((prev) => [nextExpense, ...prev]);
    setToastMessage('Expense added successfully');
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
    const shouldDelete = window.confirm('Are you sure you want to delete?');

    if (!shouldDelete) {
      return;
    }

    setExpenses((prev) => prev.filter((item) => item.id !== id));

    if (editingExpense?.id === id) {
      setEditingExpense(null);
    }
  };

  const cancelEditing = () => {
    setEditingExpense(null);
  };

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const toastTimeout = window.setTimeout(() => {
      setToastMessage('');
    }, 2200);

    return () => window.clearTimeout(toastTimeout);
  }, [toastMessage]);

  return (
    <main className="app">
      <section className="app-shell">
        {toastMessage ? (
          <p className="toast-message toast-success" role="status" aria-live="polite">
            {toastMessage}
          </p>
        ) : null}
        <Navbar />

        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route
            path="/home"
            element={<Home expenseCount={expenseCount} monthlyTotal={monthlyTotal} totalSpent={totalSpent} />}
          />
          <Route path="/groups" element={<Groups expenses={expenses} />} />
          <Route
            path="/history"
            element={
              <History
                addExpense={addExpense}
                editExpense={editExpense}
                deleteExpense={deleteExpense}
                editingExpense={editingExpense}
                cancelEditing={cancelEditing}
                filterCategory={filterCategory}
                setFilterCategory={setFilterCategory}
                filteredExpenses={filteredExpenses}
                expenseCount={expenseCount}
              />
            }
          />
          <Route path="/groups/:groupName" element={<GroupDetails expenses={expenses} />} />
          <Route
            path="/dashboard"
            element={
              <Dashboard
                expenses={expenses}
                totalSpent={totalSpent}
                expenseCount={expenseCount}
                categoriesUsed={categoriesUsed}
                latestExpense={latestExpense}
              />
            }
          />
          <Route
            path="/profile"
            element={
              <Profile
                expenseCount={expenseCount}
                totalSpent={totalSpent}
                totalGroupsJoined={totalGroupsJoined}
                highestSpendingCategory={highestSpendingCategory}
              />
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </section>
    </main>
  );
}

export default App;
