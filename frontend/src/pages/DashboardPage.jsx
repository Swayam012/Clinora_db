import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import StatCard from '../components/ui/StatCard';
import RecentDocuments from '../components/dashboard/RecentDocuments';
import AIChatWidget from '../components/dashboard/AIChatWidget';
import { currentUser, dashboardStats, recentDocuments } from '../services/mockData';
import '../styles/dashboard.css';

export default function DashboardPage() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <Topbar user={currentUser} />

        <main className="app-content">
          {/* Statistics Row */}
          <section className="stats-row">
            {dashboardStats.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </section>

          {/* Bottom Grid: Documents Table + Activity Chart + AI Widget */}
          <section className="dashboard-grid">
            <RecentDocuments documents={recentDocuments} />

            <div className="card activity-chart">
              <div className="card-header">
                <h3 className="card-title">Document Processing Activity</h3>
                <span className="card-dots">⋯</span>
              </div>
              <div className="chart-placeholder">
                <div className="chart-bars">
                  {[65, 45, 80, 55, 70, 90, 60, 75, 50].map((h, i) => (
                    <div key={i} className="chart-bar-group">
                      <div
                        className="chart-bar chart-bar-coral"
                        style={{ height: `${h}%` }}
                      ></div>
                      <div
                        className="chart-bar chart-bar-purple"
                        style={{ height: `${h * 0.6}%` }}
                      ></div>
                    </div>
                  ))}
                </div>
                <div className="chart-labels">
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'].map(
                    (m) => (
                      <span key={m}>{m}</span>
                    )
                  )}
                </div>
              </div>
            </div>

            <AIChatWidget />
          </section>
        </main>
      </div>
    </div>
  );
}
