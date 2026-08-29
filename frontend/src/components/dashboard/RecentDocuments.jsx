import StatusBadge from '../ui/StatusBadge';

export default function RecentDocuments({ documents }) {
  return (
    <div className="card recent-docs">
      <div className="card-header">
        <h3 className="card-title">Recent Documents</h3>
        <button className="card-filter-btn">
          Filter <span>▾</span>
        </button>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Document Name</th>
              <th>Patient ID</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id}>
                <td className="table-doc-name">{doc.name}</td>
                <td className="table-mono">{doc.patientId}</td>
                <td>
                  <StatusBadge status={doc.status} />
                </td>
                <td className="table-dim">{doc.date}</td>
                <td>
                  <button className="table-action-btn" title="View">
                    ◎
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
