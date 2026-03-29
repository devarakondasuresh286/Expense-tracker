import { useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import CategoryPieChart from '../components/CategoryPieChart';
import { calculateCurrentUserBalances, getBalanceStatus, getGroupExpenses } from '../utils/finance';

function GroupDetails({ expenses, groups, currentUser, friends, addMemberToGroup, settleUpGroupBalance }) {
  const { groupId } = useParams();
  const selectedGroupId = decodeURIComponent(groupId ?? '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [settleMessage, setSettleMessage] = useState('');

  const friendsById = useMemo(
    () =>
      [currentUser, ...(friends || [])].reduce((accumulator, friend) => {
        accumulator[friend.id] = friend;
        return accumulator;
      }, {}),
    [currentUser, friends],
  );

  const selectedGroup = groups.find((group) => group.id === selectedGroupId);

  const selectedGroupExpenses = useMemo(() => {
    if (!selectedGroup) {
      return [];
    }

    return getGroupExpenses(expenses, selectedGroup.id);
  }, [expenses, selectedGroup]);

  const balancesMap = useMemo(
    () => {
      if (!selectedGroup) {
        return {};
      }

      return calculateCurrentUserBalances({
        expenses,
        groupId: selectedGroup.id,
        currentUserId: currentUser.id,
      });
    },
    [expenses, selectedGroup, currentUser.id],
  );

  if (!selectedGroup) {
    return <Navigate to="/groups" replace />;
  }

  const memberBalances = selectedGroup.memberIds
    .filter((memberId) => memberId !== currentUser.id)
    .map((memberId) => {
      const balance = balancesMap[memberId] ?? 0;
      return {
        memberId,
        name: friendsById[memberId]?.name ?? memberId,
        balance,
        status: getBalanceStatus(balance),
      };
    });

  const availableFriends = (friends || []).filter((friend) => !selectedGroup.memberIds.includes(friend.id));
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredFriends = availableFriends.filter((friend) => friend.name.toLowerCase().includes(normalizedQuery));

  const handleAddMember = (friendId) => {
    addMemberToGroup(selectedGroup.id, friendId);
    setSearchQuery('');
  };

  const handleSettleUp = async (memberId) => {
    const result = await settleUpGroupBalance?.(selectedGroup.id, memberId);
    if (!result?.ok) {
      setSettleMessage(result?.message || 'Unable to settle balance.');
      return;
    }

    setSettleMessage('Balance settled successfully.');
  };

  return (
    <section className="page-grid" aria-label={`${selectedGroup.name} details`}>
      <div className="group-workspace-header">
        <h2 className="section-title">{selectedGroup.name}</h2>
        <Link to="/groups" className="nav-link">
          Back to Groups
        </Link>
      </div>

      <section className="group-workspace-grid" aria-label="Group workspace content">
        <article className="card group-workspace-panel" aria-label="Members panel">
          <div className="list-header">
            <h3 className="section-title">Members</h3>
            <button className="btn" type="button" onClick={() => setIsModalOpen(true)}>
              + Add Member
            </button>
          </div>

          <ul className="expense-list">
            {selectedGroup.memberIds.map((memberId) => (
              <li key={memberId} className="expense-item">
                <div>
                  <p className="expense-title">{friendsById[memberId]?.name ?? memberId}</p>
                  <p className="expense-meta">{memberId === currentUser.id ? 'Current user' : 'Member'}</p>
                </div>
              </li>
            ))}
          </ul>
        </article>

        <article className="card group-workspace-panel" aria-label="Balances panel">
          <h3 className="section-title">Member Balances</h3>
          {memberBalances.length === 0 ? (
            <p className="empty-state">No member balances yet.</p>
          ) : (
            <ul className="balance-list">
              {memberBalances.map((member) => (
                <li key={member.memberId} className="balance-item">
                  <div>
                    <p className="expense-title">{member.name}</p>
                    <p className="expense-meta">{member.status}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`expense-amount ${member.balance < 0 ? 'home-metric-negative' : 'home-metric-positive'}`}>
                      ${Math.abs(member.balance).toFixed(2)}
                    </span>
                    {Math.abs(member.balance) >= 0.01 ? (
                      <button className="btn secondary-btn" type="button" onClick={() => handleSettleUp(member.memberId)}>
                        Settle Up
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {settleMessage ? <p className="form-message success">{settleMessage}</p> : null}

          <h3 className="section-title">Recent Expenses</h3>
          {selectedGroupExpenses.length === 0 ? (
            <p className="empty-state">No expenses in this group yet.</p>
          ) : (
            <ul className="expense-list">
              {selectedGroupExpenses.slice(0, 8).map((expense, index) => (
                <li key={expense.id} className="expense-item" style={{ '--item-index': index % 8 }}>
                  <div>
                    <p className="expense-title">{expense.title}</p>
                    <p className="expense-meta">Paid by {friendsById[expense.paidBy]?.name ?? expense.paidBy}</p>
                  </div>
                  <span className="expense-amount">${Number(expense.amount).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <CategoryPieChart expenses={selectedGroupExpenses} />

      {isModalOpen ? (
        <div className="member-modal-backdrop" role="presentation" onClick={() => setIsModalOpen(false)}>
          <section
            className="member-modal-card"
            role="dialog"
            aria-modal="true"
            aria-label="Add friend to group"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="list-header">
              <h3 className="section-title">Add Friend</h3>
              <button className="btn secondary-btn" type="button" onClick={() => setIsModalOpen(false)}>
                Close
              </button>
            </div>
            <input
              className="input"
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search friends"
              aria-label="Search friend"
            />

            {filteredFriends.length === 0 ? (
              <p className="empty-state">No friends available to add.</p>
            ) : (
              <ul className="expense-list">
                {filteredFriends.map((friend) => (
                  <li key={friend.id} className="expense-item">
                    <div>
                      <p className="expense-title">{friend.name}</p>
                      <p className="expense-meta">Friend</p>
                    </div>
                    <button className="btn" type="button" onClick={() => handleAddMember(friend.id)}>
                      Add
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : null}
    </section>
  );
}

export default GroupDetails;
