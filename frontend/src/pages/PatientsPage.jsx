import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import StatusBadge from '../components/ui/StatusBadge';
import PatientFormModal from '../components/patients/PatientFormModal';
import { currentUser, mockPatients } from '../services/mockData';
import { getPatients, createPatient } from '../services/api';
import '../styles/dashboard.css';
import '../styles/patients.css';

export default function PatientsPage() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');

  const loadPatients = async (search = '') => {
    setLoading(true);
    setError('');
    try {
      const data = await getPatients(1, 50, search);
      if (data?.patients && data.patients.length > 0) {
        setPatients(data.patients);
      } else {
        // If DB is empty, use mock fallback for initial demonstration
        const filteredMock = search
          ? mockPatients.filter((p) =>
              `${p.first_name} ${p.last_name} ${p.patient_id}`
                .toLowerCase()
                .includes(search.toLowerCase())
            )
          : mockPatients;
        setPatients(filteredMock);
      }
    } catch (err) {
      // Fallback to mock data if backend not connected or token expired
      const filteredMock = search
        ? mockPatients.filter((p) =>
            `${p.first_name} ${p.last_name} ${p.patient_id}`
              .toLowerCase()
              .includes(search.toLowerCase())
          )
        : mockPatients;
      setPatients(filteredMock);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients(searchTerm);
  }, [searchTerm]);

  const handleCreatePatient = async (formData) => {
    try {
      const created = await createPatient(formData);
      setPatients((prev) => [created, ...prev]);
    } catch (err) {
      // If offline, add locally with generated mock ID
      const newMock = {
        ...formData,
        id: `mock-${Date.now()}`,
        patient_id: `PAT-2026-${String(patients.length + 1).padStart(5, '0')}`,
        is_active: true,
        created_at: new Date().toISOString(),
      };
      setPatients((prev) => [newMock, ...prev]);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <Topbar user={currentUser} />

        <main className="app-content">
          <div className="page-header-actions">
            <div>
              <h2 className="page-header-title">Patients Directory</h2>
              <p className="page-header-subtitle">
                Manage registered patients, demographic records, and linked clinical documents.
              </p>
            </div>

            <div className="search-filter-bar">
              <div className="search-input-box">
                <span className="search-icon">⌕</span>
                <input
                  type="text"
                  placeholder="Search by name, ID or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <button className="btn-add-patient" onClick={() => setIsModalOpen(true)}>
                + Register Patient
              </button>
            </div>
          </div>

          <div className="card">
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Patient Name</th>
                    <th>Patient ID</th>
                    <th>Gender</th>
                    <th>Date of Birth</th>
                    <th>Blood Group</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>
                        Loading patient records...
                      </td>
                    </tr>
                  ) : patients.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>
                        No patients found matching "{searchTerm}"
                      </td>
                    </tr>
                  ) : (
                    patients.map((p) => (
                      <tr
                        key={p.id}
                        className="clickable-row"
                        onClick={() => navigate(`/patients/${p.id}`, { state: { patient: p } })}
                      >
                        <td>
                          <div className="patient-name-cell">
                            <div className="patient-avatar-mini">
                              {p.first_name?.charAt(0)}
                            </div>
                            <span>{p.first_name} {p.last_name}</span>
                          </div>
                        </td>
                        <td className="table-mono">{p.patient_id}</td>
                        <td style={{ textTransform: 'capitalize' }}>{p.gender}</td>
                        <td className="table-dim">{p.date_of_birth}</td>
                        <td>
                          <span style={{ color: 'var(--accent-coral)', fontWeight: 600 }}>
                            {p.blood_group || '--'}
                          </span>
                        </td>
                        <td className="table-dim">{p.phone || '--'}</td>
                        <td>
                          <StatusBadge status={p.is_active ? 'processed' : 'pending'} />
                        </td>
                        <td>
                          <button
                            className="table-action-btn"
                            title="View Profile"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/patients/${p.id}`, { state: { patient: p } });
                            }}
                          >
                            →
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      <PatientFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreatePatient}
      />
    </div>
  );
}
