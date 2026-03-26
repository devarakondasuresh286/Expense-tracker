import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';

function Login({ onAuthSuccess }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const data = await authApi.login({ email, password });
      onAuthSuccess(data.token, data.user);
      navigate('/home');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page-grid" aria-label="Login page">
      <article className="card" style={{ maxWidth: 480, margin: '0 auto', width: '100%' }}>
        <h2 className="section-title">Login</h2>
        <form className="expense-form" onSubmit={onSubmit}>
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
            placeholder="Password"
            required
          />
          <button className="btn" type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
          {message ? <p className="form-message error">{message}</p> : null}
        </form>
        <p className="expense-meta">
          New here? <Link to="/register">Create account</Link>
        </p>
      </article>
    </section>
  );
}

export default Login;
