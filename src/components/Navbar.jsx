import { NavLink } from 'react-router-dom';

const centerNavItems = [
  { label: 'Home', path: '/home' },
  { label: 'Groups', path: '/groups' },
  { label: 'History', path: '/history' },
  { label: 'Dashboard', path: '/dashboard' },
];

const rightNavItems = [
  { label: 'Profile', path: '/profile' },
  { label: 'Login', path: '/login' },
  { label: 'Register', path: '/register' },
];

function Navbar() {
  const renderNavLink = (item) => (
    <NavLink
      key={item.path}
      to={item.path}
      end={item.path === '/home'}
      className={({ isActive }) =>
        isActive ? 'nav-link nav-link-active' : 'nav-link'
      }
    >
      {item.label}
    </NavLink>
  );

  return (
    <header className="navbar-card">
      <h1 className="title">Expense Tracker</h1>
      <div className="navbar-main">
        <nav className="navbar navbar-center" aria-label="Primary navigation">
          {centerNavItems.map(renderNavLink)}
        </nav>
        <nav className="navbar navbar-right" aria-label="Secondary navigation">
          {rightNavItems.map(renderNavLink)}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
