import { useEffect, useMemo, useRef, useState } from 'react';
import ExpenseForm from '../components/ExpenseForm';
import { EXPENSE_TYPES } from '../constants/expenseConstants';

function Home({
  addExpense,
  expenses,
  groups,
  currentUser,
  friends,
  searchUsers,
  addFriend,
  balances,
  isAuthenticated = true,
  onRequireLogin,
}) {
  const [isExpenseTypeModalOpen, setIsExpenseTypeModalOpen] = useState(false);
  const [selectedExpenseType, setSelectedExpenseType] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFindFriendsOpen, setIsFindFriendsOpen] = useState(false);
  const [friendActionMessage, setFriendActionMessage] = useState('');
  const expenseFormSectionRef = useRef(null);

  useEffect(() => {
    if (!selectedExpenseType || !expenseFormSectionRef.current) {
      return;
    }

    const formSection = expenseFormSectionRef.current;

    // Move new users directly to the newly opened form section.
    formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    const focusTimer = window.setTimeout(() => {
      const firstField = formSection.querySelector('input[name="title"]')
        || formSection.querySelector('input, select, textarea, button');
      firstField?.focus();
    }, 220);

    return () => window.clearTimeout(focusTimer);
  }, [selectedExpenseType]);

  const membersById = useMemo(() => {
    const map = {
      [currentUser.id]: currentUser,
    };

    friends.forEach((friend) => {
      map[friend.id] = friend;
    });

    groups.forEach((group) => {
      group.memberIds.forEach((memberId) => {
        if (!map[memberId]) {
          map[memberId] = { id: memberId, name: memberId };
        }
      });
    });

    return map;
  }, [groups, currentUser, friends]);

  const allFriends = useMemo(() => friends.map((friend) => ({ id: friend.id, name: friend.name })), [friends]);

  const friendBalanceMap = useMemo(() => {
    const map = {};

    (balances?.whoOwesYou || []).forEach((entry) => {
      map[entry.userId] = { type: 'owes-you', amount: Number(entry.amount) };
    });

    (balances?.whoYouOwe || []).forEach((entry) => {
      map[entry.userId] = { type: 'you-owe', amount: Number(entry.amount) };
    });

    return map;
  }, [balances]);

  const totalExpense = useMemo(
    () => expenses.reduce((sum, expense) => sum + Number(expense.amount ?? 0), 0),
    [expenses],
  );

  const monthlyExpense = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return expenses.reduce((sum, expense) => {
      const date = new Date(expense.date);

      if (Number.isNaN(date.getTime())) {
        return sum;
      }

      if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
        return sum + Number(expense.amount ?? 0);
      }

      return sum;
    }, 0);
  }, [expenses]);

  const handleExpenseTypeSelect = (type) => {
    setSelectedExpenseType(type);
    setIsExpenseTypeModalOpen(false);
  };

  const handleSearchUsers = async () => {
    if (!isAuthenticated) {
      onRequireLogin?.('Please login to search users.');
      return;
    }

    const query = searchQuery.trim();
    if (!query) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setFriendActionMessage('');

    try {
      const results = await searchUsers(query);
      setSearchResults(results);
    } catch (error) {
      setFriendActionMessage(error.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddFriend = async (userId) => {
    if (!isAuthenticated) {
      onRequireLogin?.('Please login to add friends.');
      return;
    }

    try {
      await addFriend(userId);
      setSearchResults((prev) => prev.filter((item) => item.id !== userId));
      setFriendActionMessage('Friend added successfully!');
    } catch (error) {
      setFriendActionMessage(error.message);
    }
  };

  const openFindFriends = () => {
    if (!isAuthenticated) {
      onRequireLogin?.('Please login to manage friends and groups.');
      return;
    }

    setIsFindFriendsOpen(true);
  };

  const closeFindFriends = () => {
    setIsFindFriendsOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    setFriendActionMessage('');
  };

  return (
    <section className="home-page home-clean-layout" aria-label="Home page">
      <header className="home-header">
        <div>
          <h2 className="title">Welcome {currentUser?.name || 'User'}</h2>
        </div>
      </header>

      <section className="home-summary-cards" aria-label="Expense summary">
        <article className="card home-summary-card">
          <p className="home-summary-label">Total Expense</p>
          <p className="home-summary-value">${totalExpense.toFixed(0)}</p>
        </article>
        <article className="card home-summary-card">
          <p className="home-summary-label">Monthly Expense</p>
          <p className="home-summary-value">${monthlyExpense.toFixed(0)}</p>
        </article>
      </section>

      <article className="card home-simple-section home-friends-card" aria-label="Friends list">
        <h3 className="section-title">Friends</h3>
        {allFriends.length === 0 ? (
          <p className="home-empty-copy">No friends in your account yet.</p>
        ) : (
          <ul className="home-name-list">
            {allFriends.map((friend) => (
              <li key={friend.id} className="home-name-item">
                <p className="expense-title">{friend.name}</p>
                <p className="expense-meta">
                  {friendBalanceMap[friend.id]?.type === 'owes-you'
                    ? `${friend.name} owes you $${friendBalanceMap[friend.id].amount.toFixed(2)}`
                    : friendBalanceMap[friend.id]?.type === 'you-owe'
                      ? `You owe ${friend.name} $${friendBalanceMap[friend.id].amount.toFixed(2)}`
                      : 'Settled up'}
                </p>
              </li>
            ))}
          </ul>
        )}

        <button
          className="btn secondary-btn home-add-friend-btn"
          type="button"
          onClick={openFindFriends}
        >
          + Add Friends
        </button>
      </article>

      {isFindFriendsOpen ? (
        <article className="card home-simple-section" aria-label="Find friends">
          <div className="home-form-close-row">
            <button
              className="btn secondary-btn home-form-close-btn"
              type="button"
              onClick={closeFindFriends}
              aria-label="Close find friends"
            >
              ×
            </button>
          </div>
          <h3 className="section-title">Find Friends</h3>
          <div className="history-toolbar">
            <input
              className="input"
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search users by name or email"
              aria-label="Search users"
            />
            <button className="btn" type="button" onClick={handleSearchUsers} disabled={isSearching}>
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>
          {searchResults.length === 0 ? (
            <p className="home-empty-copy">Search to discover users you can add.</p>
          ) : (
            <ul className="expense-list">
              {searchResults.map((user) => (
                <li key={user.id} className="expense-item">
                  <div>
                    <p className="expense-title">{user.name}</p>
                    <p className="expense-meta">{user.email}</p>
                  </div>
                  <button className="btn primary-btn" type="button" onClick={() => handleAddFriend(user.id)}>
                    Add Friend
                  </button>
                </li>
              ))}
            </ul>
          )}
          {friendActionMessage ? <p className="form-message success">{friendActionMessage}</p> : null}
        </article>
      ) : null}

      <div className="home-centered-actions" aria-label="Main actions">
        <button
          className="btn home-big-action-btn"
          type="button"
          onClick={() => {
            if (!isAuthenticated) {
              onRequireLogin?.('Please login to add expenses.');
              return;
            }

            setIsExpenseTypeModalOpen(true);
          }}
        >
          Add Expense
        </button>
      </div>

      {isExpenseTypeModalOpen ? (
        <div className="member-modal-backdrop" role="presentation" onClick={() => setIsExpenseTypeModalOpen(false)}>
          <article className="member-modal-card home-expense-type-modal" role="dialog" aria-label="Select expense type" onClick={(event) => event.stopPropagation()}>
            <h3 className="section-title">Select Expense Type</h3>
            <button className="btn" type="button" onClick={() => handleExpenseTypeSelect(EXPENSE_TYPES.PERSONAL)}>
              Personal Expense
            </button>
            <button className="btn secondary-btn" type="button" onClick={() => handleExpenseTypeSelect(EXPENSE_TYPES.GROUP)}>
              Group Expense
            </button>
          </article>
        </div>
      ) : null}

      {selectedExpenseType ? (
        <article ref={expenseFormSectionRef} className="card home-simple-section" aria-label="Add expense form">
          <div className="home-form-close-row">
            <button
              className="btn secondary-btn home-form-close-btn"
              type="button"
              onClick={() => setSelectedExpenseType(null)}
              aria-label="Close add expense form"
            >
              ×
            </button>
          </div>
          <div className="home-group-form-wrap">
            <ExpenseForm
              mode={selectedExpenseType}
              addExpense={addExpense}
              groups={groups}
              membersById={membersById}
              currentUser={currentUser}
              defaultGroupId={groups[0]?.id ?? ''}
            />
          </div>
        </article>
      ) : null}
    </section>
  );
}

export default Home;
