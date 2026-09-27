import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import PatientFormModal from '../components/patients/PatientFormModal';
import { getPatient, updatePatient, deletePatient, getDocuments } from '../services/api';
import {
  Users,
  ArrowLeft,
  Edit,
  Phone,
  Mail,
  Calendar,
  Heart,
  FileText,
  Upload,
  AlertCircle,
  Clock,
  Shield,
  Trash2,
} from 'lucide-react';

export default function PatientProfilePage() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    import('../services/api').then((m) => m.getCurrentUser().then((u) => u && setUser(u)).catch(() => {}));
  }, []);
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [patient, setPatient] = useState(location.state?.patient || null);
  const [patientDocs, setPatientDocs] = useState([]);
  const [loading, setLoading] = useState(!patient);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const fetchPatientData = async () => {
      setLoading(true);
      try {
        const data = await getPatient(id);
        setPatient(data);
      } catch (err) {
        console.error('Failed to load patient profile:', err);
      } finally {
        setLoading(false);
      }
    };

    if (!patient) {
      fetchPatientData();
    }
  }, [id, patient]);

  // Load linked documents for this patient
  useEffect(() => {
    const fetchDocs = async () => {
      if (!patient?.id) return;
      try {
        const res = await getDocuments({ patientId: patient.id });
        if (res?.items) {
          setPatientDocs(res.items);
        }
      } catch (err) {
        console.debug('Failed to fetch patient documents:', err);
      }
    };
    fetchDocs();
  }, [patient?.id]);

  const handleUpdate = async (formData) => {
    try {
      const updated = await updatePatient(patient.id, formData);
      setPatient(updated);
    } catch (err) {
      alert(`Update failed: ${err.message}`);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete patient "${patient.first_name} ${patient.last_name}"? All linked records will be archived.`
    );
    if (!confirmed) return;

    try {
      await deletePatient(patient.id);
      navigate('/patients');
    } catch (err) {
      alert(`Failed to delete patient: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-950 text-slate-100">
        <Sidebar />
        <div className="flex flex-1 flex-col ml-64 min-w-0">
          <Topbar user={user} />
          <main className="flex-1 flex items-center justify-center">
            <p className="text-slate-500 text-xs">Loading patient dossier...</p>
          </main>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex min-h-screen bg-slate-950 text-slate-100">
        <Sidebar />
        <div className="flex flex-1 flex-col ml-64 min-w-0">
          <Topbar user={user} />
          <main className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
            <AlertCircle className="h-10 w-10 text-brand-coral" />
            <h2 className="text-lg font-bold text-white">Patient Record Not Found</h2>
            <Button variant="outline" size="sm" onClick={() => navigate('/patients')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Patients Directory
            </Button>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Sidebar />

      <div className="flex flex-1 flex-col ml-64 min-w-0">
        <Topbar user={user} />

        <main className="flex-1 space-y-6 p-8">
          {/* Breadcrumb & Action Buttons */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/patients')}
              className="text-xs h-8"
            >
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              Back to Patients
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              className="text-xs h-8 bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20"
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Delete Patient
            </Button>
          </div>

          {/* Profile Main Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left 4 Columns: Demographics Summary Card */}
            <Card className="lg:col-span-4 flex flex-col items-center text-center p-6 space-y-5">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-purple via-indigo-500 to-brand-coral text-white font-extrabold text-2xl shadow-xl shadow-brand-purple/20">
                {patient.first_name?.charAt(0)}
              </div>

              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {patient.first_name} {patient.last_name}
                </h2>
                <div className="mt-1 flex items-center justify-center gap-2">
                  <span className="font-mono text-xs text-brand-lavender bg-brand-purple/15 px-2.5 py-0.5 rounded-full border border-brand-purple/30">
                    {patient.patient_id}
                  </span>
                  <Badge variant={patient.is_active ? 'mint' : 'destructive'}>
                    {patient.is_active ? 'Active' : 'Archived'}
                  </Badge>
                </div>
              </div>

              {/* Demographic Details List */}
              <div className="w-full space-y-2.5 border-t border-white/[0.08] pt-4 text-left text-xs">
                <div className="flex justify-between py-1 border-b border-white/[0.04]">
                  <span className="text-slate-400">Gender:</span>
                  <span className="font-medium text-slate-200 capitalize">{patient.gender}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[0.04]">
                  <span className="text-slate-400">Date of Birth:</span>
                  <span className="font-medium text-slate-200">{patient.date_of_birth}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[0.04]">
                  <span className="text-slate-400">Blood Group:</span>
                  <span className="font-bold text-brand-coral">{patient.blood_group || '--'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[0.04]">
                  <span className="text-slate-400">Phone:</span>
                  <span className="font-medium text-slate-200">{patient.phone || '--'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[0.04]">
                  <span className="text-slate-400">Email:</span>
                  <span className="font-medium text-slate-200">{patient.email || '--'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[0.04]">
                  <span className="text-slate-400">Address:</span>
                  <span className="font-medium text-slate-200 text-right max-w-[200px] truncate">{patient.address || '--'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[0.04]">
                  <span className="text-slate-400">Emergency Contact:</span>
                  <span className="font-medium text-slate-200">{patient.emergency_contact_name || '--'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Emergency Phone:</span>
                  <span className="font-medium text-slate-200">{patient.emergency_contact_phone || '--'}</span>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => setIsEditModalOpen(true)}
              >
                <Edit className="mr-1.5 h-3.5 w-3.5" />
                Edit Demographics
              </Button>
            </Card>

            {/* Right 8 Columns: Medical Background & Linked Documents */}
            <div className="lg:col-span-8 space-y-6">
              {/* Medical History Card */}
              <Card>
                <CardHeader className="pb-3 border-b border-white/[0.04]">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-brand-coral" />
                    <CardTitle className="text-sm font-bold text-white">Clinical Background & Medical Notes</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="rounded-xl border border-white/[0.08] bg-slate-950/60 p-4 text-xs text-slate-300 leading-relaxed">
                    {patient.medical_notes || 'No active medical notes or known drug allergies recorded for this patient.'}
                  </div>
                </CardContent>
              </Card>

              {/* Linked Clinical Documents Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-white/[0.04]">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-brand-lavender" />
                    <CardTitle className="text-sm font-bold text-white">Linked Clinical Documents</CardTitle>
                  </div>
                  <Button
                    variant="coral"
                    size="sm"
                    onClick={() => navigate('/documents')}
                    className="h-7 text-xs"
                  >
                    <Upload className="mr-1.5 h-3 w-3" />
                    Upload Document
                  </Button>
                </CardHeader>

                <CardContent className="p-0">
                  {patientDocs.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500">
                      No clinical documents linked to this patient yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-white/[0.06]">
                          <tr>
                            <th className="py-3 px-5">Document Name</th>
                            <th className="py-3 px-5">Category</th>
                            <th className="py-3 px-5">Date</th>
                            <th className="py-3 px-5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                          {patientDocs.map((doc) => (
                            <tr
                              key={doc.id}
                              className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                              onClick={() => navigate(`/documents/${doc.id}`, { state: { document: doc } })}
                            >
                              <td className="py-3.5 px-5 font-medium text-slate-200">
                                {doc.title || doc.name || doc.original_filename}
                              </td>
                              <td className="py-3.5 px-5 text-slate-400 capitalize">
                                {(doc.document_type || doc.type || 'Clinical Note').replace('_', ' ')}
                              </td>
                              <td className="py-3.5 px-5 text-slate-400">
                                {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'Recent'}
                              </td>
                              <td className="py-3.5 px-5">
                                <Badge variant={doc.status === 'processed' ? 'mint' : 'amber'}>
                                  {doc.status === 'processed' ? 'Processed' : 'Pending'}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
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
