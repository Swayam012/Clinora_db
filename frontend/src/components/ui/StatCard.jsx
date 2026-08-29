export default function StatCard({ label, value, trend, trendUp, color }) {
  const colorMap = {
    purple: 'var(--accent-purple)',
    blue: 'var(--accent-blue)',
    amber: 'var(--accent-amber)',
    mint: 'var(--accent-mint)',
  };

  const bgMap = {
    purple: 'var(--accent-purple-subtle)',
    blue: 'rgba(96, 165, 250, 0.10)',
    amber: 'var(--accent-amber-subtle)',
    mint: 'var(--accent-mint-subtle)',
  };

  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <span className="stat-card-label">{label}</span>
        {trend && (
          <span
            className="stat-card-trend"
            style={{
              color: trendUp ? 'var(--accent-mint)' : 'var(--accent-coral)',
              background: trendUp ? 'var(--accent-mint-subtle)' : 'var(--accent-coral-subtle)',
            }}
          >
            {trend}
          </span>
        )}
        {!trend && (
          <button className="stat-card-more" title="Options">⋯</button>
        )}
      </div>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-bar">
        <div
          className="stat-card-bar-fill"
          style={{ background: colorMap[color] || colorMap.purple, width: '65%' }}
        ></div>
      </div>
    </div>
  );
}
