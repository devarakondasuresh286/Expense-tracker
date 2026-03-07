import './App.css';
import { useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Groups from './pages/Groups';
import History from './pages/History';
import Dashboard from './pages/Dashboard';
import GroupDetails from './pages/GroupDetails';
import {
  CURRENT_USER,
  DEFAULT_FILTER_CATEGORY,
  DEFAULT_FRIENDS,
  DEFAULT_GROUPS,
  EXPENSE_TYPES,
  GROUPS_STORAGE_KEY,
  STORAGE_KEY,
} from './constants/expenseConstants';
import { getPersonalExpenses, normalizeSplitBetween, todayDateString } from './utils/finance';

const readStorageArray = (storageKey) => {
  const savedValue = localStorage.getItem(storageKey);

  if (!savedValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(savedValue);
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
};

const normalizeExpense = (expense, groups) => {
  const defaultGroupId = groups[0]?.id ?? null;
  const legacyGroupName = typeof expense.group === 'string' ? expense.group : '';

  let groupId = expense.groupId ?? null;
  if (!groupId && legacyGroupName) {
    const matchedGroup = groups.find((group) => group.name === legacyGroupName);
    groupId = matchedGroup?.id ?? defaultGroupId;
  }

  const inferredType = expense.type || (groupId ? EXPENSE_TYPES.GROUP : EXPENSE_TYPES.PERSONAL);
  const paidBy = expense.paidBy ?? CURRENT_USER.id;

  return {
    id: expense.id ?? Date.now(),
    title: expense.title ?? 'Expense',
    category: expense.category ?? 'Other',
    type: inferredType,
    groupId: inferredType === EXPENSE_TYPES.GROUP ? groupId : null,
    paidBy: inferredType === EXPENSE_TYPES.GROUP ? paidBy : CURRENT_USER.id,
    splitBetween:
      inferredType === EXPENSE_TYPES.GROUP
        ? normalizeSplitBetween(expense.splitBetween, paidBy ? [paidBy] : [])
        : [],
    amount: Number(expense.amount ?? 0),
    date: expense.date ?? todayDateString(),
  };
};

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [groups, setGroups] = useState(() => {
    const savedGroups = readStorageArray(GROUPS_STORAGE_KEY);
    return savedGroups.length > 0 ? savedGroups : DEFAULT_GROUPS;
  });

  const [expenses, setExpenses] = useState(() =>
    readStorageArray(STORAGE_KEY).map((expense) => normalizeExpense(expense, DEFAULT_GROUPS)),
  );
  const [filterCategory, setFilterCategory] = useState(DEFAULT_FILTER_CATEGORY);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(groups));
  }, [groups]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    setExpenses((prev) => prev.map((expense) => normalizeExpense(expense, groups)));
  }, [groups]);

  const personalExpenses = useMemo(() => getPersonalExpenses(expenses), [expenses]);
  const totalSpent = useMemo(
    () => personalExpenses.reduce((sum, item) => sum + Number(item.amount), 0),
    [personalExpenses],
  );

  const filteredExpenses = useMemo(() => {
    if (filterCategory === 'All') {
      return expenses;
    }

    return expenses.filter((item) => item.category === filterCategory);
  }, [expenses, filterCategory]);

  const categoriesUsed = useMemo(
    () => new Set(personalExpenses.map((item) => item.category)).size,
    [personalExpenses],
  );

  const latestExpense = personalExpenses[0] ?? null;
  const expenseCount = personalExpenses.length;
  const historyExpenseCount = expenses.length;

  const addExpense = (expenseData) => {
    const nextId = Date.now();
    const normalizedExpense = normalizeExpense(
      {
        ...expenseData,
        id: nextId,
      },
      groups,
    );

    const nextExpense = {
      id: nextId,
      ...normalizedExpense,
      splitBetween:
        normalizedExpense.type === EXPENSE_TYPES.GROUP
          ? normalizeSplitBetween(normalizedExpense.splitBetween, [normalizedExpense.paidBy])
          : [],
    };

    setExpenses((prev) => [nextExpense, ...prev]);
    setToastMessage('Expense added successfully');
  };

  const deleteExpense = (id) => {
    const shouldDelete = window.confirm('Are you sure you want to delete?');

    if (!shouldDelete) {
      return;
    }

    setExpenses((prev) => prev.filter((item) => item.id !== id));
  };

  const addMemberToGroup = (groupId, memberId) => {
    setGroups((prev) =>
      prev.map((group) => {
        if (group.id !== groupId || group.memberIds.includes(memberId)) {
          return group;
        }

        return {
          ...group,
          memberIds: [...group.memberIds, memberId],
        };
      }),
    );
    setToastMessage('Member added successfully');
  };

  const createGroup = ({ name, friendIds }) => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      return { ok: false, message: 'Group name is required.' };
    }

    const normalizedName = trimmedName.toLowerCase();
    const alreadyExists = groups.some((group) => group.name.trim().toLowerCase() === normalizedName);

    if (alreadyExists) {
      return { ok: false, message: 'A group with this name already exists.' };
    }

    if (!Array.isArray(friendIds) || friendIds.length === 0) {
      return { ok: false, message: 'Select at least one friend.' };
    }

    const idBase = trimmedName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const nextGroup = {
      id: `group-${idBase || 'custom'}-${Date.now()}`,
      name: trimmedName,
      memberIds: [CURRENT_USER.id, ...Array.from(new Set(friendIds))],
    };

    setGroups((prev) => [nextGroup, ...prev]);
    setToastMessage('Group created successfully');
    return { ok: true };
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
      <section className={`app-shell ${isSidebarOpen ? '' : 'app-shell-collapsed'}`}>
        {toastMessage ? (
          <p className="toast-message toast-success" role="status" aria-live="polite">
            {toastMessage}
          </p>
        ) : null}
        <Navbar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen((prev) => !prev)} />

        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route
            path="/home"
            element={
              <Home
                addExpense={addExpense}
                expenses={expenses}
                groups={groups}
                currentUser={CURRENT_USER}
                friends={DEFAULT_FRIENDS}
              />
            }
          />
          <Route
            path="/groups"
            element={
              <Groups
                groups={groups}
                expenses={expenses}
                currentUser={CURRENT_USER}
                friends={DEFAULT_FRIENDS}
                createGroup={createGroup}
              />
            }
          />
          <Route
            path="/history"
            element={
              <History
                deleteExpense={deleteExpense}
                filterCategory={filterCategory}
                setFilterCategory={setFilterCategory}
                filteredExpenses={filteredExpenses}
                expenseCount={historyExpenseCount}
                personalExpenses={personalExpenses}
                groups={groups}
                friends={DEFAULT_FRIENDS}
                currentUser={CURRENT_USER}
              />
            }
          />
          <Route
            path="/groups/:groupId"
            element={
              <GroupDetails
                expenses={expenses}
                groups={groups}
                currentUser={CURRENT_USER}
                addMemberToGroup={addMemberToGroup}
              />
            }
          />
          <Route
            path="/dashboard"
            element={
              <Dashboard
                expenses={personalExpenses}
                totalSpent={totalSpent}
                expenseCount={expenseCount}
                categoriesUsed={categoriesUsed}
                latestExpense={latestExpense}
              />
            }
          />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </section>
    </main>
  );
}

export default App;
