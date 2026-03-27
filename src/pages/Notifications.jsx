import { useEffect, useMemo, useState } from 'react';
import { notificationsApi } from '../services/api';

const formatRelativeTime = (dateValue) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) {
    return 'Just now';
  }

  if (diffMins < 60) {
    return `${diffMins}m ago`;
  }

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

function Notifications({ token }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const unreadCount = useMemo(
    () => notifications.filter((item) => item.unread).length,
    [notifications],
  );

  const fetchNotifications = async () => {
    if (!token) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const data = await notificationsApi.list(token);
      setNotifications(data.notifications || []);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [token]);

  const onMarkAllRead = async () => {
    if (!token || unreadCount === 0) {
      return;
    }

    setBusy(true);
    setMessage('');
    try {
      await notificationsApi.markAllRead(token);
      await fetchNotifications();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="page-grid" aria-label="Notifications page">
      <article className="card list-card notifications-card">
        <div className="list-header">
          <h2 className="section-title">Notifications</h2>
          <button className="btn secondary-btn" type="button" onClick={onMarkAllRead} disabled={busy || unreadCount === 0}>
            {busy ? 'Please wait...' : `Mark all as read${unreadCount ? ` (${unreadCount})` : ''}`}
          </button>
        </div>

        {message ? <p className="form-message error">{message}</p> : null}

        {loading ? (
          <p className="empty-state">Loading notifications...</p>
        ) : notifications.length === 0 ? (
          <p className="empty-state">No notifications yet.</p>
        ) : (
          <ul className="expense-list notifications-list">
            {notifications.map((item, index) => (
              <li
                key={item.id}
                className={`expense-item notifications-item ${item.unread ? 'notifications-item-unread' : ''}`}
                style={{ '--item-index': index % 8 }}
              >
                <div>
                  <p className="expense-title">{item.title}</p>
                  <p className="expense-meta">{item.message}</p>
                </div>
                <p className="expense-meta notifications-time">{formatRelativeTime(item.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </article>
    </section>
  );
}

export default Notifications;
