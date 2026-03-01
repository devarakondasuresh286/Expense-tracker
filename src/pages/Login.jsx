import { Link } from 'react-router-dom';

function Login() {
  return (
    <section className="page-grid" aria-label="Login page">
      <article className="card auth-card">
        <h2 className="section-title">Login</h2>
        <p className="subtitle">Access your expense tracker account.</p>

        <form className="expense-form" onSubmit={(event) => event.preventDefault()}>
          <input className="input" type="email" placeholder="Email" aria-label="Email" />
          <input className="input" type="password" placeholder="Password" aria-label="Password" />
          <button className="btn" type="submit">
            Login
          </button>
        </form>

        <p className="auth-switch-text">
          Don&apos;t have an account? <Link to="/register">Register</Link>
        </p>
      </article>
    </section>
  );
}

export default Login;
