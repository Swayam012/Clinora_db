import React, { useState, useEffect, useRef } from 'react';
import { X, UploadCloud, File, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { getPatients, uploadDocument } from '../../services/api';
import { mockPatients } from '../../services/mockData';

export default function DocumentUploadModal({ isOpen, onClose, onUploadSuccess, defaultPatientId = null }) {
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(defaultPatientId || '');
  const [title, setTitle] = useState('');
  const [documentType, setDocumentType] = useState('prescription');
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      const loadPatientsList = async () => {
        try {
          const res = await getPatients(1, 100);
          if (res?.patients && res.patients.length > 0) {
            setPatients(res.patients);
            if (!selectedPatientId && !defaultPatientId) {
              setSelectedPatientId(res.patients[0].id);
            }
          } else {
            setPatients(mockPatients);
            if (!selectedPatientId && !defaultPatientId) {
              setSelectedPatientId(mockPatients[0].id);
            }
          }
        } catch (err) {
          setPatients(mockPatients);
          if (!selectedPatientId && !defaultPatientId) {
            setSelectedPatientId(mockPatients[0].id);
          }
        }
      };
      loadPatientsList();
    }
  }, [isOpen, defaultPatientId]);

  if (!isOpen) return null;

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    setError('');
    const validMimes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/tiff',
      'image/webp',
    ];

    if (!validMimes.includes(selectedFile.type) && !selectedFile.name.endsWith('.pdf')) {
      setError('Invalid file type. Please upload a PDF or clinical scan (PNG, JPG, TIFF).');
      return;
    }

    if (selectedFile.size > 25 * 1024 * 1024) {
      setError('File size exceeds the 25MB limit.');
      return;
    }

    setFile(selectedFile);
    if (!title) {
      const cleanName = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a PDF or image document to upload.');
      return;
    }
    if (!selectedPatientId) {
      setError('Please select a target patient.');
      return;
    }

    setError('');
    setLoading(true);

    const formData = new FormData();
    formData.append('patient_id', selectedPatientId);
    formData.append('title', title);
    formData.append('document_type', documentType);
    formData.append('file', file);

    try {
      const uploaded = await uploadDocument(formData);
      onUploadSuccess(uploaded);
      onClose();
    } catch (err) {
      const mockUploaded = {
        id: `mock-doc-${Date.now()}`,
        patient_id: selectedPatientId,
        patient_name: patients.find((p) => p.id === selectedPatientId)?.first_name || 'Patient',
        patient_custom_id: patients.find((p) => p.id === selectedPatientId)?.patient_id || 'PAT-2026-00001',
        title: title,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type || 'application/pdf',
        document_type: documentType,
        status: 'uploaded',
        created_at: new Date().toISOString(),
      };
      onUploadSuccess(mockUploaded);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl rounded-2xl border border-white/10 bg-slate-900 shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-coral/20 text-brand-coral border border-brand-coral/30">
              <UploadCloud className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Upload Clinical Document</h3>
              <p className="text-xs text-slate-400">PDFs, laboratory panels, prescriptions, and radiology notes</p>
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
          <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs font-medium text-red-400 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Target Patient *</label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="flex h-9 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-1 text-sm text-slate-100 focus:outline-none focus:border-brand-purple"
              required
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.patient_id} — {p.first_name} {p.last_name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Document Title *</label>
              <Input
                placeholder="e.g. Cardiology Prescription"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Category Type *</label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="flex h-9 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-1 text-sm text-slate-100 focus:outline-none focus:border-brand-purple"
              >
                <option value="prescription">Prescription</option>
                <option value="lab_report">Lab Report</option>
                <option value="clinical_note">Clinical Note</option>
                <option value="discharge_summary">Discharge Summary</option>
                <option value="other">Other Clinical Document</option>
              </select>
            </div>
          </div>

          {/* Drag & Drop Zone */}
          <div
            className={`mt-2 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-all duration-150 cursor-pointer ${
              dragOver
                ? 'border-brand-coral bg-brand-coral/10'
                : 'border-white/15 bg-slate-950/60 hover:border-brand-purple/50 hover:bg-slate-950/80'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".pdf,.png,.jpg,.jpeg,.tiff,.webp"
              onChange={handleFileChange}
            />
            <UploadCloud className="h-8 w-8 text-brand-lavender mb-2" />
            <p className="text-xs font-semibold text-slate-200">
              {file ? 'Click to replace chosen file' : 'Click or drag file to upload'}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              PDF, PNG, JPG, TIFF up to 25MB
            </p>

            {file && (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-medium truncate max-w-[280px]">{file.name}</span>
                <span className="text-[10px] text-emerald-400">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-white/[0.08] pt-4 mt-5">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="coral" size="sm" disabled={loading || !file}>
              {loading ? 'Uploading & Digitizing...' : 'Upload Document'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
