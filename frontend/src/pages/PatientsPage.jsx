import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import PatientFormModal from '../components/patients/PatientFormModal';
import { ChevronDown, Plus } from 'lucide-react';

export default function PatientsPage() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [statusFilter, setStatusFilter] = useState('Active');
  const [deptFilter, setDeptFilter] = useState('Oncology');
  const [visitFilter, setVisitFilter] = useState('30 Days');

  const patientsList = [
    {
      id: 'evelyn-carter',
      name: 'Evelyn Carter',
      mrn: 'MRN-902-18',
      dob: '11/24/1962',
      department: 'Oncology',
      lastVisit: 'Oct 24, 2026',
      status: 'Active Care',
    },
    {
      id: 'marcus-chen',
      name: 'Marcus Chen',
      mrn: 'MRN-334-09',
      dob: '04/12/1985',
      department: 'Cardiology',
      lastVisit: 'Oct 22, 2026',
      status: 'Active Care',
    },
    {
      id: 'clara-oswald',
      name: 'Clara Oswald',
      mrn: 'MRN-771-44',
      dob: '09/05/1991',
      department: 'Neurology',
      lastVisit: 'Oct 20, 2026',
      status: 'Discharged',
    },
    {
      id: 'arthur-dent',
      name: 'Arthur Dent',
      mrn: 'MRN-042-42',
      dob: '10/11/1979',
      department: 'Oncology',
      lastVisit: 'Oct 19, 2026',
      status: 'Active Care',
    },
    {
      id: 'sarah-connor',
      name: 'Sarah Connor',
      mrn: 'MRN-101-99',
      dob: '02/28/1965',
      department: 'Trauma/Oncology',
      lastVisit: 'Oct 15, 2026',
      status: 'Active Care',
    },
    {
      id: 'bruce-wayne',
      name: 'Bruce Wayne',
      mrn: 'MRN-808-00',
      dob: '05/19/1972',
      department: 'Cardiology',
      lastVisit: 'Oct 12, 2026',
      status: 'Discharged',
    },
    {
      id: 'dana-scully',
      name: 'Dana Scully',
      mrn: 'MRN-555-12',
      dob: '10/13/1964',
      department: 'Neurology',
      lastVisit: 'Oct 10, 2026',
      status: 'Active Care',
    },
    {
      id: 'walter-white',
      name: 'Walter White',
      mrn: 'MRN-303-10',
      dob: '09/07/1958',
      department: 'Oncology',
      lastVisit: 'Oct 05, 2026',
      status: 'Discharged',
    },
  ];

  return (
    <div className="flex min-h-screen bg-brand-surface font-sans text-slate-900">
      <Sidebar />

      <div className="flex flex-1 flex-col ml-60 min-w-0">
        <Topbar breadcrumb="CLINORA / PATIENTS" title="Patient Master Directory" />

        <main className="flex-1 space-y-6 p-8">
          {/* Filter Dropdowns and Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Status Filter */}
              <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50">
                <span>Status: {statusFilter}</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {/* Department Filter */}
              <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50">
                <span>Department: {deptFilter}</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {/* Last Visit Filter */}
              <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50">
                <span>Last Visit: {visitFilter}</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>
            </div>

            {/* + Enroll Patient Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-brand-purple px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-purpleDark transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Enroll Patient</span>
            </button>
          </div>

          {/* Patient Directory Table Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4 font-bold">PATIENT NAME</th>
                    <th className="py-3 px-4 font-bold">MRN</th>
                    <th className="py-3 px-4 font-bold">DOB</th>
                    <th className="py-3 px-4 font-bold">DEPARTMENT</th>
                    <th className="py-3 px-4 font-bold">LAST VISIT</th>
                    <th className="py-3 px-4 font-bold">STATUS</th>
                    <th className="py-3 px-4 text-right font-bold">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {patientsList.map((p, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      onClick={() => navigate(`/patients/${p.id}`, { state: { patient: p } })}
                    >
                      <td className="py-4 px-4 font-bold text-slate-900">
                        {p.name}
                      </td>
                      <td className="py-4 px-4 text-slate-600 font-medium">
                        {p.mrn}
                      </td>
                      <td className="py-4 px-4 text-slate-600 font-normal">
                        {p.dob}
                      </td>
                      <td className="py-4 px-4 text-slate-600 font-normal">
                        {p.department}
                      </td>
                      <td className="py-4 px-4 text-slate-600 font-normal">
                        {p.lastVisit}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            p.status === 'Active Care'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-red-50 text-red-600'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/patients/${p.id}`, { state: { patient: p } });
                          }}
                          className="text-xs font-medium text-slate-500 hover:text-brand-purple hover:underline"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
              <p>Showing 1-8 of 1,482 patients</p>
              <div className="flex items-center gap-1.5">
                <button className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-purpleLight font-bold text-brand-purple">
                  1
                </button>
                <button className="flex h-7 w-7 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100">
                  2
                </button>
                <button className="flex h-7 w-7 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100">
                  3
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      <PatientFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(data) => {
          setIsModalOpen(false);
        }}
      />
    </div>
  );
}
