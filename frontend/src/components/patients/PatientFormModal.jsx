import React, { useState } from 'react';
import { X, UserPlus, Save } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl rounded-2xl border border-white/10 bg-slate-900 shadow-2xl p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-purple/20 text-brand-lavender border border-brand-purple/30">
              <UserPlus className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {initialData ? 'Edit Patient Profile' : 'Register New Patient'}
              </h3>
              <p className="text-xs text-slate-400">Clinical demographic & emergency records</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs font-medium text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">First Name *</label>
              <Input
                name="first_name"
                placeholder="e.g. Rajesh"
                value={formData.first_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Last Name *</label>
              <Input
                name="last_name"
                placeholder="e.g. Kumar"
                value={formData.last_name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Date of Birth *</label>
              <Input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Gender *</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="flex h-9 w-full rounded-lg border border-white/10 bg-slate-900/80 px-3 py-1 text-sm text-slate-100 focus:outline-none focus:border-brand-purple"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Phone Number</label>
              <Input
                type="tel"
                name="phone"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Blood Group</label>
              <select
                name="blood_group"
                value={formData.blood_group}
                onChange={handleChange}
                className="flex h-9 w-full rounded-lg border border-white/10 bg-slate-900/80 px-3 py-1 text-sm text-slate-100 focus:outline-none focus:border-brand-purple"
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

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Email Address</label>
            <Input
              type="email"
              name="email"
              placeholder="patient@domain.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Address</label>
            <Input
              name="address"
              placeholder="Residential address..."
              value={formData.address}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Emergency Contact Name</label>
              <Input
                name="emergency_contact_name"
                placeholder="Relative / Guardian"
                value={formData.emergency_contact_name}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Emergency Contact Phone</label>
              <Input
                type="tel"
                name="emergency_contact_phone"
                placeholder="+91 98765 00000"
                value={formData.emergency_contact_phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Medical Notes & History</label>
            <textarea
              name="medical_notes"
              rows={3}
              value={formData.medical_notes}
              onChange={handleChange}
              placeholder="Known conditions, allergies, or previous surgical background..."
              className="w-full rounded-lg border border-white/10 bg-slate-900/80 p-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-brand-purple"
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-white/[0.08] pt-4 mt-5">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="coral" size="sm" disabled={loading}>
              <Save className="mr-1.5 h-3.5 w-3.5" />
              {loading ? 'Saving...' : initialData ? 'Update Profile' : 'Register Patient'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
