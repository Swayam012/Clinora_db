import { NavLink, useNavigate } from 'react-router-dom';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '▦' },
  { path: '/patients', label: 'Patients', icon: '♡' },
  { path: '/documents', label: 'Documents', icon: '◰' },
  { path: '/analytics', label: 'Analytics', icon: '◔' },
  { path: '/ai-tools', label: 'AI Tools', icon: '✦' },
  { path: '/settings', label: 'Settings', icon: '⚙' },
];

export default function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('clinora_token');
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo" onClick={() => navigate('/dashboard')}>
        <div className="sidebar-logo-icon">C</div>
        <span className="sidebar-logo-text">Clinora</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
            }
          >
            <span className="sidebar-link-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="sidebar-logout" onClick={handleLogout}>
          ↗ Logout
        </button>
      </div>
    </aside>
  );
}
