import { useState } from 'react';

export default function PatientFormModal({ isOpen, onClose, onSubmit, initialData = null }) {
  const [formData, setFormData] = useState({
    first_name: initialData?.first_name || '',
    last_name: initialData?.last_name || '',
    date_of_birth: initialData?.date_of_birth || '',
    gender: initialData?.gender || 'male',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    blood_group: initialData?.blood_group || 'O+',
    address: initialData?.address || '',
    emergency_contact_name: initialData?.emergency_contact_name || '',
    emergency_contact_phone: initialData?.emergency_contact_phone || '',
    medical_notes: initialData?.medical_notes || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save patient record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{initialData ? 'Edit Patient Record' : 'Register New Patient'}</h3>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {error && <div className="login-error" style={{ marginBottom: '1.25rem' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-grid-2">
            <div className="form-group">
              <label>First Name *</label>
              <input
                type="text"
                name="first_name"
                className="form-input"
                style={{ paddingLeft: '0.85rem' }}
                placeholder="e.g. Rajesh"
                value={formData.first_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Last Name *</label>
              <input
                type="text"
                name="last_name"
                className="form-input"
                style={{ paddingLeft: '0.85rem' }}
                placeholder="e.g. Kumar"
                value={formData.last_name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>Date of Birth *</label>
              <input
                type="date"
                name="date_of_birth"
                className="form-input"
                style={{ paddingLeft: '0.85rem' }}
                value={formData.date_of_birth}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Gender *</label>
              <select
                name="gender"
                className="form-input"
                style={{ paddingLeft: '0.85rem' }}
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                name="phone"
                className="form-input"
                style={{ paddingLeft: '0.85rem' }}
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Blood Group</label>
              <select
                name="blood_group"
                className="form-input"
                style={{ paddingLeft: '0.85rem' }}
                value={formData.blood_group}
                onChange={handleChange}
              >
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              className="form-input"
              style={{ paddingLeft: '0.85rem' }}
              placeholder="patient@example.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Address</label>
            <input
              type="text"
              name="address"
              className="form-input"
              style={{ paddingLeft: '0.85rem' }}
              placeholder="Full address"
              value={formData.address}
              onChange={handleChange}
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>Emergency Contact Name</label>
              <input
                type="text"
                name="emergency_contact_name"
                className="form-input"
                style={{ paddingLeft: '0.85rem' }}
                placeholder="Relative / Guardian"
                value={formData.emergency_contact_name}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Emergency Contact Phone</label>
              <input
                type="tel"
                name="emergency_contact_phone"
                className="form-input"
                style={{ paddingLeft: '0.85rem' }}
                placeholder="+91 98765 00000"
                value={formData.emergency_contact_phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Medical History / Clinical Notes</label>
            <textarea
              name="medical_notes"
              className="form-input"
              style={{ paddingLeft: '0.85rem', minHeight: '80px' }}
              placeholder="Known conditions, allergies, regular medications..."
              value={formData.medical_notes}
              onChange={handleChange}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-add-patient" disabled={loading}>
              {loading ? 'Saving...' : initialData ? 'Save Changes' : 'Register Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
