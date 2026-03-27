import { Link, useLocation } from 'react-router-dom';

function AuthHome() {
  const location = useLocation();
  const requiresAuth = Boolean(location.state?.requiresAuth);
  const attemptedPath = location.state?.attemptedPath;

  return (
    <section className="page-grid" aria-label="Authentication home page">
      <article className="card" style={{ maxWidth: 520, margin: '0 auto', width: '100%' }}>
        <h2 className="section-title">Expense Tracker</h2>
        <p className="expense-meta">Track personal and group expenses with shared balances.</p>
        {requiresAuth ? (
          <p className="form-message error" style={{ marginTop: 12 }}>
            Please login to access {attemptedPath || 'this page'}.
          </p>
        ) : null}
        <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
          <Link to="/login" className="btn" style={{ textAlign: 'center', textDecoration: 'none' }}>
            Login
          </Link>
          <Link to="/register" className="btn secondary-btn" style={{ textAlign: 'center', textDecoration: 'none' }}>
            Register
          </Link>
        </div>
      </article>
    </section>
  );
}

export default AuthHome;
