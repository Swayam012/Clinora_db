import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import PatientFormModal from '../components/patients/PatientFormModal';
import { currentUser, mockPatients } from '../services/mockData';
import { getPatients, createPatient } from '../services/api';
import {
  Users,
  UserPlus,
  Search,
  ArrowRight,
  Phone,
  Droplet,
  Calendar,
  Filter,
} from 'lucide-react';

export default function PatientsPage() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadPatients = async (search = '') => {
    setLoading(true);
    try {
      const data = await getPatients(1, 50, search);
      if (data?.patients && data.patients.length > 0) {
        setPatients(data.patients);
      } else {
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
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Sidebar />

      <div className="flex flex-1 flex-col ml-64 min-w-0">
        <Topbar user={currentUser} />

        <main className="flex-1 space-y-6 p-8">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-brand-lavender" />
                <h1 className="text-xl font-bold text-white tracking-tight">Patients Directory</h1>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Manage demographic records, linked clinical documents, and medical history profiles.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-64">
                <Input
                  icon={Search}
                  placeholder="Search patient name, ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <Button
                variant="coral"
                size="sm"
                onClick={() => setIsModalOpen(true)}
                className="h-9 text-xs whitespace-nowrap font-semibold shadow-md"
              >
                <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                Register Patient
              </Button>
            </div>
          </div>

          {/* Patients Table Card */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-white/[0.06]">
                    <tr>
                      <th className="py-3.5 px-5">Patient Name</th>
                      <th className="py-3.5 px-5">Patient ID</th>
                      <th className="py-3.5 px-5">Gender</th>
                      <th className="py-3.5 px-5">Date of Birth</th>
                      <th className="py-3.5 px-5">Blood Group</th>
                      <th className="py-3.5 px-5">Contact</th>
                      <th className="py-3.5 px-5">Status</th>
                      <th className="py-3.5 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {loading ? (
                      <tr>
                        <td colSpan="8" className="py-10 text-center text-slate-500 text-xs">
                          Loading registered patients...
                        </td>
                      </tr>
                    ) : patients.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="py-10 text-center text-slate-500 text-xs">
                          No patients found matching "{searchTerm}".
                        </td>
                      </tr>
                    ) : (
                      patients.map((p) => (
                        <tr
                          key={p.id}
                          className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                          onClick={() => navigate(`/patients/${p.id}`, { state: { patient: p } })}
                        >
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-brand-purple/20 to-indigo-600/20 text-brand-lavender font-bold text-xs border border-brand-purple/30">
                                {p.first_name?.charAt(0)}
                              </div>
                              <div>
                                <span className="font-semibold text-slate-200">
                                  {p.first_name} {p.last_name}
                                </span>
                                <div className="text-[10px] text-slate-500">{p.email || 'No email'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-5 font-mono text-[11px] text-brand-lavender font-medium">
                            {p.patient_id}
                          </td>
                          <td className="py-3.5 px-5 capitalize text-slate-300">
                            {p.gender}
                          </td>
                          <td className="py-3.5 px-5 text-slate-400">
                            {p.date_of_birth}
                          </td>
                          <td className="py-3.5 px-5">
                            <span className="font-bold text-brand-coral bg-brand-coral/10 px-2 py-0.5 rounded border border-brand-coral/20">
                              {p.blood_group || '--'}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-slate-400">
                            {p.phone || '--'}
                          </td>
                          <td className="py-3.5 px-5">
                            <Badge variant={p.is_active ? 'mint' : 'destructive'}>
                              {p.is_active ? 'Active Profile' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-slate-400 hover:text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/patients/${p.id}`, { state: { patient: p } });
                              }}
                            >
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
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
