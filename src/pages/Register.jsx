import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read selected image.'));
    reader.readAsDataURL(file);
  });

function Register({ onAuthSuccess }) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatarDataUrl, setAvatarDataUrl] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const onAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setAvatarDataUrl('');
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setAvatarDataUrl(dataUrl);
    } catch (error) {
      setMessage(error.message);
      setAvatarDataUrl('');
    }
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const data = await authApi.register({ name, email, password, avatarDataUrl });
      onAuthSuccess(data.token, data.user);
      navigate('/profile');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page-grid" aria-label="Register page">
      <article className="card" style={{ maxWidth: 480, margin: '0 auto', width: '100%' }}>
        <h2 className="section-title">Register</h2>
        <form className="expense-form" onSubmit={onSubmit}>
          <input
            className="input"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Name"
            required
          />
          <input
            className="input"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            required
          />
          <input
            className="input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password (min 6 chars)"
            required
          />
          <input
            className="input"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={onAvatarChange}
          />
          {avatarDataUrl ? (
            <img
              src={avatarDataUrl}
              alt="Profile preview"
              style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '1px solid #cbd5e1' }}
            />
          ) : (
            <p className="expense-meta">Profile picture is optional</p>
          )}
          <button className="btn" type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Register'}
          </button>
          {message ? <p className="form-message error">{message}</p> : null}
        </form>
        <p className="expense-meta">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </article>
    </section>
  );
}

export default Register;
