import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { calculateCurrentUserBalances, calculateGroupTotal } from '../utils/finance';

function Groups({ groups, expenses, currentUser, friends, createGroup, isAuthenticated = true, onRequireLogin }) {
  const navigate = useNavigate();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedFriendIds, setSelectedFriendIds] = useState([]);
  const [createMessage, setCreateMessage] = useState({ type: '', text: '' });

  const groupSummaries = useMemo(() => {
    return groups.map((group) => {
      const groupTotal = calculateGroupTotal(expenses, group.id);
      const balancesMap = calculateCurrentUserBalances({
        expenses,
        groupId: group.id,
        currentUserId: currentUser.id,
      });

      const netBalance = Object.values(balancesMap).reduce((sum, value) => sum + Number(value), 0);

      return {
        group,
        memberCount: group.memberIds.length,
        groupTotal,
        netBalance,
      };
    });
  }, [groups, expenses, currentUser.id]);

  const toggleFriend = (friendId) => {
    setSelectedFriendIds((prev) => {
      if (prev.includes(friendId)) {
        return prev.filter((id) => id !== friendId);
      }

      return [...prev, friendId];
    });
  };

  const handleCreateGroup = async (event) => {
    event.preventDefault();

    const result = await createGroup({
      name: groupName,
      friendIds: selectedFriendIds,
    });

    if (!result.ok) {
      setCreateMessage({ type: 'error', text: result.message });
      return;
    }

    setCreateMessage({ type: 'success', text: 'Group created successfully.' });
    setGroupName('');
    setSelectedFriendIds([]);
    setIsCreateOpen(false);
  };

  return (
    <section className="page-grid" aria-label="Groups page">
      <article className="card groups-card">
        <div className="groups-header-row">
          <h2 className="section-title">Groups</h2>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button
              className="btn"
              type="button"
              onClick={() => {
                if (!isAuthenticated) {
                  onRequireLogin?.('Please login to create a group.');
                  return;
                }

                setIsCreateOpen((prev) => !prev);
              }}
            >
              {isCreateOpen ? 'Close' : 'Create Group'}
            </button>
          </div>
        </div>
        <p className="expense-meta">Select a group to open details, balances, and members.</p>

        {isCreateOpen ? (
          <form className="groups-create-form" onSubmit={handleCreateGroup}>
            <input
              className="input"
              type="text"
              value={groupName}
              onChange={(event) => setGroupName(event.target.value)}
              placeholder="Add group name"
              aria-label="Add group name"
            />

            <fieldset className="split-members-fieldset">
              <legend className="split-members-legend">Add friends from your friend list</legend>
              <div className="split-members-grid">
                {friends.map((friend) => (
                  <label key={friend.id} className="split-member-option">
                    <input
                      type="checkbox"
                      checked={selectedFriendIds.includes(friend.id)}
                      onChange={() => toggleFriend(friend.id)}
                    />
                    <span>{friend.name}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <button className="btn" type="submit">
              Create Group
            </button>
          </form>
        ) : null}

        {createMessage.text ? (
          <p className={`form-message ${createMessage.type}`} role="status" aria-live="polite">
            {createMessage.text}
          </p>
        ) : null}

        <ul className="group-list" aria-label="Groups list">
          {groupSummaries.map(({ group, memberCount, groupTotal, netBalance }) => (
            <li key={group.id} className="group-item">
              <button
                className="group-select-btn"
                onClick={() => navigate(`/groups/${encodeURIComponent(group.id)}`)}
              >
                <p className="expense-title">{group.name}</p>
                <p className="expense-meta">
                  {memberCount} members · Group total ${groupTotal.toFixed(2)} · Balance {netBalance >= 0 ? '+' : '-'}
                  ${Math.abs(netBalance).toFixed(2)}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}

export default Groups;
