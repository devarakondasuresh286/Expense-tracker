import { Link } from 'react-router-dom';

function Register() {
  return (
    <section className="page-grid" aria-label="Register page">
      <article className="card auth-card">
        <h2 className="section-title">Register</h2>
        <p className="subtitle">Create a new account to start tracking expenses.</p>

        <form className="expense-form" onSubmit={(event) => event.preventDefault()}>
          <input className="input" type="text" placeholder="Full name" aria-label="Full name" />
          <input className="input" type="email" placeholder="Email" aria-label="Email" />
          <input className="input" type="password" placeholder="Password" aria-label="Password" />
          <button className="btn" type="submit">
            Register
          </button>
        </form>

        <p className="auth-switch-text">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </article>
    </section>
  );
}

export default Register;
