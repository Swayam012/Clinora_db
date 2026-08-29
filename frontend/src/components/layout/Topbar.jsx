export default function Topbar({ user }) {
  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <header className="topbar">
      <div className="topbar-greeting">
        <span className="topbar-greeting-text">{greeting()},</span>
        <h2 className="topbar-username">{user?.full_name || 'Doctor'}</h2>
      </div>

      <div className="topbar-actions">
        <div className="topbar-search">
          <span className="topbar-search-icon">⌕</span>
          <input
            type="text"
            placeholder="Search"
            className="topbar-search-input"
          />
        </div>

        <button className="topbar-icon-btn" title="Notifications">
          <span>🔔</span>
          <span className="topbar-notif-dot"></span>
        </button>

        <div className="topbar-user">
          <div className="topbar-avatar">
            {user?.full_name?.charAt(0) || 'D'}
          </div>
          <span className="topbar-user-name">{user?.full_name || 'Doctor'}</span>
        </div>
      </div>
    </header>
  );
}
