import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import StatusBadge from '../components/ui/StatusBadge';
import PatientFormModal from '../components/patients/PatientFormModal';
import { currentUser, mockPatients, recentDocuments } from '../services/mockData';
import { getPatient, updatePatient } from '../services/api';
import '../styles/dashboard.css';
import '../styles/patients.css';

export default function PatientProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [patient, setPatient] = useState(location.state?.patient || null);
  const [loading, setLoading] = useState(!patient);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    if (!patient) {
      const fetchPatientData = async () => {
        setLoading(true);
        try {
          const data = await getPatient(id);
          setPatient(data);
        } catch (err) {
          // Fallback to mock search
          const found = mockPatients.find((p) => p.id === id || p.patient_id === id);
          if (found) setPatient(found);
        } finally {
          setLoading(false);
        }
      };
      fetchPatientData();
    }
  }, [id, patient]);

  const handleUpdate = async (formData) => {
    try {
      const updated = await updatePatient(patient.id, formData);
      setPatient(updated);
    } catch (err) {
      setPatient((prev) => ({ ...prev, ...formData }));
    }
  };

  // Filter linked documents for this patient
  const patientDocs = recentDocuments.filter(
    (d) => d.patientId === patient?.patient_id || d.patientName?.includes(patient?.first_name || '')
  );

  if (loading) {
    return (
      <div className="app-layout">
        <Sidebar />
        <div className="app-main">
          <Topbar user={currentUser} />
          <main className="app-content" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--text-dim)' }}>Loading patient record...</p>
          </main>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="app-layout">
        <Sidebar />
        <div className="app-main">
          <Topbar user={currentUser} />
          <main className="app-content" style={{ textAlign: 'center', padding: '3rem' }}>
            <h3 style={{ color: 'var(--accent-coral)', marginBottom: '1rem' }}>Patient Not Found</h3>
            <button className="btn-secondary" onClick={() => navigate('/patients')}>
              ← Back to Patients Directory
            </button>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <Topbar user={currentUser} />

        <main className="app-content">
          {/* Breadcrumb & Navigation */}
          <div style={{ marginBottom: '1.25rem' }}>
            <button
              className="btn-secondary"
              style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}
              onClick={() => navigate('/patients')}
            >
              ← Back to Patients
            </button>
          </div>

          <div className="patient-profile-layout">
            {/* Left Demographics Panel */}
            <div className="profile-sidebar-card">
              <div className="profile-avatar-large">
                {patient.first_name?.charAt(0)}
              </div>
              <h2 className="profile-name">{patient.first_name} {patient.last_name}</h2>
              <span className="profile-id-tag">{patient.patient_id}</span>

              <div style={{ marginBottom: '1.25rem' }}>
                <StatusBadge status={patient.is_active ? 'processed' : 'failed'} />
              </div>

              <div className="profile-info-list">
                <div className="profile-info-item">
                  <span className="profile-info-label">Gender:</span>
                  <span className="profile-info-value" style={{ textTransform: 'capitalize' }}>
                    {patient.gender}
                  </span>
                </div>
                <div className="profile-info-item">
                  <span className="profile-info-label">Date of Birth:</span>
                  <span className="profile-info-value">{patient.date_of_birth}</span>
                </div>
                <div className="profile-info-item">
                  <span className="profile-info-label">Blood Group:</span>
                  <span className="profile-info-value" style={{ color: 'var(--accent-coral)', fontWeight: 700 }}>
                    {patient.blood_group || '--'}
                  </span>
                </div>
                <div className="profile-info-item">
                  <span className="profile-info-label">Phone:</span>
                  <span className="profile-info-value">{patient.phone || '--'}</span>
                </div>
                <div className="profile-info-item">
                  <span className="profile-info-label">Email:</span>
                  <span className="profile-info-value" style={{ fontSize: '0.8rem' }}>
                    {patient.email || '--'}
                  </span>
                </div>
                <div className="profile-info-item">
                  <span className="profile-info-label">Emergency Contact:</span>
                  <span className="profile-info-value">
                    {patient.emergency_contact_name || '--'}
                  </span>
                </div>
              </div>

              <button
                className="btn-secondary"
                style={{ width: '100%', marginTop: '1.5rem' }}
                onClick={() => setIsEditModalOpen(true)}
              >
                ✎ Edit Patient Profile
              </button>
            </div>

            {/* Right Clinical & Document Details */}
            <div className="profile-content-area">
              {/* Medical History Section */}
              <div className="profile-section-card">
                <div className="profile-section-title">
                  <span>Clinical Background & Medical Notes</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                    Last updated recently
                  </span>
                </div>
                <div className="notes-box">
                  {patient.medical_notes || 'No active medical notes or known drug allergies recorded for this patient.'}
                </div>
              </div>

              {/* Linked Clinical Documents */}
              <div className="profile-section-card">
                <div className="profile-section-title">
                  <span>Linked Clinical Documents</span>
                  <button
                    className="btn-add-patient"
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                    onClick={() => alert('Document upload pipeline will be active in Phase 4.')}
                  >
                    + Upload New Document
                  </button>
                </div>

                {patientDocs.length === 0 ? (
                  <p style={{ color: 'var(--text-dim)', fontSize: '0.88rem', padding: '1rem 0' }}>
                    No clinical documents currently uploaded for this patient.
                  </p>
                ) : (
                  <div className="table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Document</th>
                          <th>Type</th>
                          <th>Date</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {patientDocs.map((doc) => (
                          <tr key={doc.id}>
                            <td className="table-doc-name">{doc.name}</td>
                            <td className="table-dim">{doc.type}</td>
                            <td className="table-dim">{doc.date}</td>
                            <td>
                              <StatusBadge status={doc.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      <PatientFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleUpdate}
        initialData={patient}
      />
    </div>
  );
}
