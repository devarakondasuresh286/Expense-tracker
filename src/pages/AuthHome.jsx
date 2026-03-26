import { Link } from 'react-router-dom';

function AuthHome() {
  return (
    <section className="page-grid" aria-label="Authentication home page">
      <article className="card" style={{ maxWidth: 520, margin: '0 auto', width: '100%' }}>
        <h2 className="section-title">Expense Tracker</h2>
        <p className="expense-meta">Track personal and group expenses with shared balances.</p>
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
