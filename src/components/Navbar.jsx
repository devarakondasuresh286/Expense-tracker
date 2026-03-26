import { NavLink } from 'react-router-dom';

const navItems = [
  { icon: '🏠', label: 'Home', path: '/home' },
  { icon: '👥', label: 'Groups', path: '/groups' },
  { icon: '📜', label: 'History', path: '/history' },
  { icon: '📊', label: 'Dashboard', path: '/dashboard' },
];

function Navbar({ isOpen, onToggle, onLogout, userName, isDarkMode, onToggleTheme }) {
  const renderNavLink = (item) => (
    <NavLink
      key={item.path}
      to={item.path}
      end={item.path === '/home'}
      className={({ isActive }) =>
        isActive ? 'nav-link nav-link-active' : 'nav-link'
      }
      title={item.label}
    >
      <span className="nav-icon" aria-hidden="true">{item.icon}</span>
      {isOpen ? <span className="nav-label">{item.label}</span> : null}
    </NavLink>
  );

  return (
    <aside className={`navbar-card ${isOpen ? '' : 'navbar-card-collapsed'}`} aria-label="Sidebar navigation">
      <button className="navbar-toggle" type="button" onClick={onToggle} aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}>
        ☰
      </button>
      {isOpen ? <h1 className="title">Expense Tracker</h1> : null}
      {isOpen ? <p className="expense-meta">{userName}</p> : null}
      <nav className="navbar navbar-sidebar" aria-label="Primary navigation">
        {navItems.map(renderNavLink)}
      </nav>
      {isOpen ? (
        <button className="btn secondary-btn" type="button" onClick={onToggleTheme}>
          {isDarkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
      ) : null}
      {isOpen ? (
        <button className="btn secondary-btn" type="button" onClick={onLogout}>
          Logout
        </button>
      ) : null}
    </aside>
  );
}

export default Navbar;
