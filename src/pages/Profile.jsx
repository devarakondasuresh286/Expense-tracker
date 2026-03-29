import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read selected image.'));
    reader.readAsDataURL(file);
  });

function Profile({ currentUser, onLogout, onUpdateProfile }) {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser?.name || '');
  const [avatarDataUrl, setAvatarDataUrl] = useState(currentUser?.avatarDataUrl || '');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const options = [
    { icon: '🔔', title: 'Notifications', onClick: () => navigate('/notifications') },
    { icon: '⭐', title: 'Rate Expense Tracker', onClick: () => navigate('/rate-us') },
    { icon: '📞', title: 'Contact Us', onClick: () => navigate('/contact-us') },
  ];

  const onSelectAvatar = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setAvatarDataUrl(dataUrl);
      setMessage('');
    } catch (error) {
      setMessage(error.message);
    }
  };

  const onSave = async () => {
    setSaving(true);
    setMessage('');

    try {
      await onUpdateProfile({
        name,
        avatarDataUrl,
      });
      setIsEditing(false);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  const onDeleteAvatar = async () => {
    setSaving(true);
    setMessage('');

    try {
      await onUpdateProfile({ removeAvatar: true });
      setAvatarDataUrl('');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="profile-page" aria-label="Profile page">
      <article className="card profile-card" aria-label="Profile details">
        <div className="profile-top-row">
          <div className="profile-avatar" aria-hidden="true">
            {avatarDataUrl || currentUser?.avatarDataUrl ? (
              <img
                src={avatarDataUrl || currentUser?.avatarDataUrl}
                alt="Profile"
                className="profile-avatar-image"
              />
            ) : (
              '👤'
            )}
          </div>
          <button className="btn secondary-btn profile-edit-btn" type="button" onClick={() => setIsEditing((prev) => !prev)}>
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
        {isEditing ? (
          <input
            className="input"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your name"
          />
        ) : null}
        <h2 className="section-title profile-name">{isEditing ? name : currentUser?.name || 'User'}</h2>
        <p className="expense-meta profile-email">{currentUser?.email || 'No email available'}</p>

        {isEditing ? (
          <div className="profile-edit-actions">
            <input
              className="input"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={onSelectAvatar}
            />
            <div className="expense-actions">
              <button className="btn" type="button" onClick={onSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button className="btn secondary-btn" type="button" onClick={onDeleteAvatar} disabled={saving}>
                Delete Photo
              </button>
            </div>
          </div>
        ) : null}
        {message ? <p className="form-message error">{message}</p> : null}
      </article>

      <article className="card profile-options-card" aria-label="Profile options">
        <h3 className="section-title">Options</h3>
        <div className="profile-options-list">
          {options.map((item) => (
            <button
              key={item.title}
              className="profile-option-row"
              type="button"
              title={item.title}
              onClick={item.onClick}
            >
              <span className="profile-option-left">
                <span className="profile-option-icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="profile-option-title">{item.title}</span>
              </span>
              <span className="profile-option-arrow" aria-hidden="true">
                ›
              </span>
            </button>
          ))}
        </div>
      </article>

      <section className="profile-logout-section" aria-label="Logout section">
        <button className="profile-logout-btn" type="button" onClick={onLogout}>
          Logout
        </button>
      </section>
    </section>
  );
}

export default Profile;
