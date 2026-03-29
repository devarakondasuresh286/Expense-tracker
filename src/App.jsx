import './App.css';
import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Groups from './pages/Groups';
import History from './pages/History';
import Dashboard from './pages/Dashboard';
import GroupDetails from './pages/GroupDetails';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import Login from './pages/Login';
import Register from './pages/Register';
import RateUs from './pages/RateUs';
import ContactUs from './pages/ContactUs';
import {
  DEFAULT_FILTER_CATEGORY,
  EXPENSE_TYPES,
} from './constants/expenseConstants';
import { getPersonalExpenses, normalizeSplitBetween } from './utils/finance';
import { authStorage } from './utils/authStorage';
import { analyticsApi, authApi, expensesApi, groupsApi, usersApi } from './services/api';

const THEME_STORAGE_KEY = 'expense_tracker_theme';

const normalizeExpense = (expense, currentUserId) => ({
  id: expense.id,
  title: expense.title,
  category: expense.category,
  type: expense.type || (expense.groupId ? EXPENSE_TYPES.GROUP : EXPENSE_TYPES.PERSONAL),
  groupId: expense.groupId ?? null,
  paidBy: expense.paidBy ?? currentUserId,
  splitBetween: normalizeSplitBetween(expense.splitBetween, expense.paidBy ? [expense.paidBy] : []),
  splitMode: expense.splitMode || 'equal',
  splitConfig: (expense.splitConfig || []).map((item) => ({
    userId: item.userId,
    amount: Number(item.amount || 0),
  })),
  amount: Number(expense.amount ?? 0),
  date: String(expense.date).split('T')[0],
  notes: expense.notes ?? '',
});

function App() {
  const location = useLocation();
  const initialToken = authStorage.getToken();
  const initialUser = authStorage.getUser();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem(THEME_STORAGE_KEY) === 'dark');
  const [token, setToken] = useState(initialToken);
  const [currentUser, setCurrentUser] = useState(initialUser);
  const [groups, setGroups] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [friends, setFriends] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [hasAttemptedAutoSeedFriends, setHasAttemptedAutoSeedFriends] = useState(false);
  const [balances, setBalances] = useState({ whoOwesYou: [], whoYouOwe: [], byGroup: [] });
  const [summary, setSummary] = useState({ totalMonthlySpending: 0, mostSpentCategory: null, categoryWise: [] });
  const [filterCategory, setFilterCategory] = useState(DEFAULT_FILTER_CATEGORY);
  const [toastMessage, setToastMessage] = useState('');
  const [isLoading, setIsLoading] = useState(Boolean(initialToken));
  const showGuestAuthTopNav = !token && !currentUser && location.pathname === '/home';
  const guestUser = useMemo(
    () => ({
      id: 'guest',
      name: 'Guest User',
      email: '',
    }),
    [],
  );

  useEffect(() => {
    document.body.classList.toggle('dark-theme', isDarkMode);
    localStorage.setItem(THEME_STORAGE_KEY, isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const refreshData = async (authToken, userId) => {
    const [groupsData, expensesData, networkData, summaryData, balancesData] = await Promise.all([
      groupsApi.list(authToken),
      expensesApi.list(authToken),
      usersApi.network(authToken),
      analyticsApi.summary(authToken),
      analyticsApi.balances(authToken),
    ]);

    setGroups(groupsData.groups || []);
    setExpenses((expensesData.expenses || []).map((expense) => normalizeExpense(expense, userId)));
    setFriends(networkData.friends || []);
    setIncomingRequests(networkData.incomingRequests || []);
    setOutgoingRequests(networkData.outgoingRequests || []);
    setSummary(summaryData);
    setBalances(balancesData);
  };

  useEffect(() => {
    const bootstrap = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const meData = await authApi.me(token);
        setCurrentUser(meData.user);
        authStorage.setUser(meData.user);
        await refreshData(token, meData.user.id);
      } catch (error) {
        if (error?.status === 401 || error?.status === 403) {
          authStorage.clearSession();
          setToken('');
          setCurrentUser(null);
          return;
        }

        setToastMessage('Backend restarting. Keeping your current session.');
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap();
  }, [token]);

  const personalExpenses = useMemo(() => getPersonalExpenses(expenses), [expenses]);
  const totalSpent = useMemo(
    () => personalExpenses.reduce((sum, item) => sum + Number(item.amount), 0),
    [personalExpenses],
  );

  const dashboardTotalSpent = useMemo(
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
    () => new Set(personalExpenses.map((item) => item.category)).size,
    [personalExpenses],
  );

  const dashboardCategoriesUsed = useMemo(
    () => new Set(expenses.map((item) => item.category)).size,
    [expenses],
  );

  const latestExpense = personalExpenses[0] ?? null;
  const expenseCount = personalExpenses.length;
  const dashboardLatestExpense = expenses[0] ?? null;
  const dashboardExpenseCount = expenses.length;
  const historyExpenseCount = expenses.length;

  const onAuthSuccess = async (nextToken, user) => {
    authStorage.setSession(nextToken, user);
    setToken(nextToken);
    setCurrentUser(user);
    await refreshData(nextToken, user.id);
  };

  const logout = () => {
    authStorage.clearSession();
    setToken('');
    setCurrentUser(null);
    setGroups([]);
    setExpenses([]);
    setFriends([]);
    setIncomingRequests([]);
    setOutgoingRequests([]);
    setHasAttemptedAutoSeedFriends(false);
    setBalances({ whoOwesYou: [], whoYouOwe: [], byGroup: [] });
  };

  const requireLogin = (message = 'Please login to continue.') => {
    setToastMessage(message);
  };

  const searchUsers = async (query) => {
    if (!token) {
      return [];
    }

    const data = await usersApi.search(token, query);
    return data.users || [];
  };

  const sendFriendRequest = async (toUserId) => {
    if (!token || !currentUser) {
      return;
    }

    await usersApi.sendFriendRequest(token, toUserId);
    await refreshData(token, currentUser.id);
    setToastMessage('Friend request sent');
  };

  const addFriend = async (friendId) => {
    if (!token || !currentUser) {
      return;
    }

    await usersApi.addFriend(token, friendId);
    await refreshData(token, currentUser.id);
    setToastMessage('Friend added successfully');
  };

  const acceptFriendRequest = async (requestId) => {
    if (!token || !currentUser) {
      return;
    }

    await usersApi.acceptFriendRequest(token, requestId);
    await refreshData(token, currentUser.id);
    setToastMessage('Friend request accepted');
  };

  const rejectFriendRequest = async (requestId) => {
    if (!token || !currentUser) {
      return;
    }

    await usersApi.rejectFriendRequest(token, requestId);
    await refreshData(token, currentUser.id);
    setToastMessage('Friend request rejected');
  };

  const updateProfile = async (payload) => {
    if (!token) {
      return;
    }

    const data = await usersApi.updateProfile(token, payload);
    setCurrentUser(data.user);
    authStorage.setUser(data.user);
    setToastMessage('Profile updated');
  };

  const addExpense = async (expenseData) => {
    if (!token || !currentUser) {
      return;
    }

    await expensesApi.create(token, expenseData);
    await refreshData(token, currentUser.id);
    setToastMessage('Expense added successfully');
  };

  const deleteExpense = async (id) => {
    const shouldDelete = window.confirm('Are you sure you want to delete?');

    if (!shouldDelete) {
      return;
    }

    if (!token || !currentUser) {
      return;
    }

    await expensesApi.remove(token, id);
    await refreshData(token, currentUser.id);
  };

  const addMemberToGroup = async (groupId, memberId) => {
    if (!token || !currentUser) {
      return;
    }

    await groupsApi.addMember(token, groupId, { memberId });
    await refreshData(token, currentUser.id);
    setToastMessage('Member added successfully');
  };

  const settleUpGroupBalance = async (groupId, userId) => {
    if (!token || !currentUser) {
      return { ok: false, message: 'Please login again.' };
    }

    try {
      const result = await analyticsApi.settleUp(token, { groupId, userId });
      await refreshData(token, currentUser.id);
      setToastMessage(result.message || 'Balance settled successfully');
      return { ok: true };
    } catch (error) {
      return { ok: false, message: error.message };
    }
  };

  const createGroup = async ({ name, friendIds }) => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      return { ok: false, message: 'Group name is required.' };
    }

    if (!Array.isArray(friendIds) || friendIds.length === 0) {
      return { ok: false, message: 'Select at least one friend.' };
    }

    if (!token || !currentUser) {
      return { ok: false, message: 'Please login again.' };
    }

    try {
      await groupsApi.create(token, {
        name: trimmedName,
        memberIds: friendIds,
      });
      await refreshData(token, currentUser.id);
    } catch (error) {
      return { ok: false, message: error.message };
    }

    setToastMessage('Group created successfully');
    return { ok: true };
  };

  const seedExampleFriends = async () => {
    if (!token || !currentUser) {
      return { ok: false, message: 'Please login again.' };
    }

    try {
      const result = await usersApi.seedExampleFriends(token);
      await refreshData(token, currentUser.id);
      setToastMessage(`Added ${result.addedCount || 0} example friends`);
      return { ok: true, count: result.addedCount || 0 };
    } catch (error) {
      return { ok: false, message: error.message };
    }
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

  useEffect(() => {
    const autoSeedFriends = async () => {
      if (!token || !currentUser || hasAttemptedAutoSeedFriends) {
        return;
      }

      if ((friends || []).length > 0) {
        setHasAttemptedAutoSeedFriends(true);
        return;
      }

      setHasAttemptedAutoSeedFriends(true);

      try {
        await usersApi.seedExampleFriends(token);
        await refreshData(token, currentUser.id);
        setToastMessage('Example friends added');
      } catch {
        // Keep silent if seeding fails; users can still add friends manually.
      }
    };

    autoSeedFriends();
  }, [token, currentUser, friends, hasAttemptedAutoSeedFriends]);

  if (isLoading) {
    return (
      <main className="app">
        <section className="app-shell">
          <article className="card">
            <p className="empty-state">Loading...</p>
          </article>
        </section>
      </main>
    );
  }

  if (!token || !currentUser) {
    return (
      <main className="app">
        <section className={`app-shell ${isSidebarOpen ? '' : 'app-shell-collapsed'}`}>
          {toastMessage ? (
            <p className="toast-message toast-success" role="status" aria-live="polite">
              {toastMessage}
            </p>
          ) : null}

          <Navbar
            isOpen={isSidebarOpen}
            onToggle={() => setIsSidebarOpen((prev) => !prev)}
            userName="Guest"
            isDarkMode={isDarkMode}
            onToggleTheme={() => setIsDarkMode((prev) => !prev)}
            isAuthenticated={false}
          />

          {showGuestAuthTopNav ? (
            <div className="auth-top-nav" aria-label="Authentication actions">
              <Link className="btn secondary-btn" to="/login">
                Login
              </Link>
              <Link className="btn" to="/register">
                Register
              </Link>
            </div>
          ) : null}

          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route
              path="/home"
              element={
                <Home
                  addExpense={() => requireLogin('Please login to add expense.')}
                  expenses={[]}
                  groups={[]}
                  currentUser={guestUser}
                  friends={[]}
                  searchUsers={async () => {
                    requireLogin('Please login to search users.');
                    return [];
                  }}
                  addFriend={async () => requireLogin('Please login to add friends.')}
                  balances={{ whoOwesYou: [], whoYouOwe: [], byGroup: [] }}
                  isAuthenticated={false}
                  onRequireLogin={requireLogin}
                />
              }
            />
            <Route path="/login" element={<Login onAuthSuccess={onAuthSuccess} />} />
            <Route path="/register" element={<Register onAuthSuccess={onAuthSuccess} />} />
            <Route
              path="/groups"
              element={
                <Groups
                  groups={[]}
                  expenses={[]}
                  currentUser={guestUser}
                  friends={[]}
                  createGroup={async () => ({ ok: false, message: 'Please login to create a group.' })}
                  isAuthenticated={false}
                  onRequireLogin={requireLogin}
                />
              }
            />
            <Route
              path="/history"
              element={
                <History
                  deleteExpense={() => requireLogin('Please login to delete expenses.')}
                  filterCategory={filterCategory}
                  setFilterCategory={setFilterCategory}
                  filteredExpenses={[]}
                  expenseCount={0}
                  personalExpenses={[]}
                  groups={[]}
                  friends={[]}
                  currentUser={guestUser}
                />
              }
            />
            <Route
              path="/dashboard"
              element={
                <Dashboard
                  expenses={[]}
                  totalSpent={0}
                  expenseCount={0}
                  categoriesUsed={0}
                  latestExpense={null}
                  analyticsSummary={{ totalMonthlySpending: 0, mostSpentCategory: null, categoryWise: [] }}
                />
              }
            />
            <Route path="/profile" element={<Navigate to="/login" replace />} />
            <Route path="/notifications" element={<Navigate to="/login" replace />} />
            <Route path="/rate-us" element={<Navigate to="/login" replace />} />
            <Route path="/contact-us" element={<Navigate to="/login" replace />} />
            <Route path="/groups/:groupId" element={<Navigate to="/groups" replace />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </section>
      </main>
    );
  }

  return (
    <main className="app">
      <section className={`app-shell ${isSidebarOpen ? '' : 'app-shell-collapsed'}`}>
        {toastMessage ? (
          <p className="toast-message toast-success" role="status" aria-live="polite">
            {toastMessage}
          </p>
        ) : null}
        <Navbar
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen((prev) => !prev)}
          onLogout={logout}
          userName={currentUser.name}
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode((prev) => !prev)}
        />

        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/login" element={<Navigate to="/profile" replace />} />
          <Route path="/register" element={<Navigate to="/profile" replace />} />
          <Route
            path="/home"
            element={
              <Home
                addExpense={addExpense}
                expenses={expenses}
                groups={groups}
                currentUser={currentUser}
                friends={friends}
                searchUsers={searchUsers}
                addFriend={addFriend}
                balances={balances}
              />
            }
          />
          <Route
            path="/groups"
            element={
              <Groups
                groups={groups}
                expenses={expenses}
                currentUser={currentUser}
                friends={friends}
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
                friends={friends}
                currentUser={currentUser}
              />
            }
          />
          <Route
            path="/groups/:groupId"
            element={
              <GroupDetails
                expenses={expenses}
                groups={groups}
                currentUser={currentUser}
                friends={friends}
                addMemberToGroup={addMemberToGroup}
                settleUpGroupBalance={settleUpGroupBalance}
              />
            }
          />
          <Route
            path="/dashboard"
            element={
              <Dashboard
                expenses={expenses}
                totalSpent={dashboardTotalSpent}
                expenseCount={dashboardExpenseCount}
                categoriesUsed={dashboardCategoriesUsed}
                latestExpense={dashboardLatestExpense}
                analyticsSummary={summary}
              />
            }
          />
          <Route
            path="/profile"
            element={
              <Profile
                currentUser={currentUser}
                onLogout={logout}
                onUpdateProfile={updateProfile}
              />
            }
          />
          <Route path="/notifications" element={<Notifications token={token} />} />
          <Route path="/rate-us" element={<RateUs />} />
          <Route path="/contact-us" element={<ContactUs />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </section>
    </main>
  );
}

export default App;
