import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import DocumentUploadModal from '../components/documents/DocumentUploadModal';
import {
  UploadCloud,
  FileText,
  ChevronDown,
} from 'lucide-react';

export default function DocumentsPage() {
  const navigate = useNavigate();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [docTypeFilter, setDocTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('Processing');

  const docs = [
    {
      id: 'doc-001',
      filename: 'Pathology_Report_Biopsy_L.pdf',
      patientName: 'Evelyn Carter',
      docType: 'Pathology',
      status: 'completed',
      uploadDate: 'Oct 24, 2026',
    },
    {
      id: 'doc-002',
      filename: 'Genomic_Sequencing_BRAF_Marcus.json',
      patientName: 'Marcus Chen',
      docType: 'Genomics',
      status: 'parsing',
      statusLabel: 'Parsing structures (65%)',
      progress: 65,
      uploadDate: 'Oct 24, 2026',
    },
    {
      id: 'doc-003',
      filename: 'Discharge_VUMC_102026.txt',
      patientName: 'Clara Oswald',
      docType: 'EHR Sync',
      status: 'completed',
      uploadDate: 'Oct 23, 2026',
    },
    {
      id: 'doc-004',
      filename: 'MRI_Brain_T2_Arthur.dicom',
      patientName: 'Arthur Dent',
      docType: 'Imaging',
      status: 'pending',
      uploadDate: 'Oct 23, 2026',
    },
    {
      id: 'doc-005',
      filename: 'Oncology_Cons_Vance.docx',
      patientName: 'Evelyn Carter',
      docType: 'Clinical Note',
      status: 'completed',
      uploadDate: 'Oct 22, 2026',
    },
    {
      id: 'doc-006',
      filename: 'Mammogram_Screening_Sep.pdf',
      patientName: 'Sarah Connor',
      docType: 'Imaging',
      status: 'completed',
      uploadDate: 'Sep 15, 2026',
    },
    {
      id: 'doc-007',
      filename: 'Cardiology_ECG_Oct2026.pdf',
      patientName: 'Marcus Chen',
      docType: 'Clinical Note',
      status: 'failed',
      uploadDate: 'Oct 12, 2026',
    },
  ];

  return (
    <div className="flex min-h-screen bg-brand-surface font-sans text-slate-900">
      <Sidebar />

      <div className="flex flex-1 flex-col ml-60 min-w-0">
        <Topbar
          breadcrumb="CLINORA / DOCUMENTS"
          title="Clinical Document Workspace"
        />

        <main className="flex-1 space-y-6 p-8">
          {/* Upload Dropzone Container */}
          <div
            onClick={() => setIsUploadOpen(true)}
            className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 text-center cursor-pointer hover:border-brand-purple hover:bg-slate-50/50 transition-all shadow-sm"
          >
            <div className="mb-2 text-brand-purple">
              <UploadCloud className="h-8 w-8" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Upload Clinical Documents
            </h3>
            <p className="mt-1 text-xs text-slate-500 font-normal">
              Drag and drop Pathology PDFs, DICOM files, Genomic JSON, or EHR discharges. Max 50MB. HIPAA Encrypted.
            </p>
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50">
              <span>Document Type: {docTypeFilter}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50">
              <span>Status: {statusFilter}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>
          </div>

          {/* Documents Table Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4 font-bold">FILENAME</th>
                    <th className="py-3 px-4 font-bold">PATIENT NAME</th>
                    <th className="py-3 px-4 font-bold">DOC TYPE</th>
                    <th className="py-3 px-4 font-bold">PROCESSING STATUS</th>
                    <th className="py-3 px-4 font-bold">UPLOAD DATE</th>
                    <th className="py-3 px-4 text-right font-bold">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {docs.map((doc, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      onClick={() => navigate(`/documents/${doc.id}`, { state: { document: doc } })}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2.5">
                          <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                          <span className="font-bold text-slate-900 truncate">
                            {doc.filename}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-600 font-normal">
                        {doc.patientName}
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700">
                          {doc.docType}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {doc.status === 'parsing' ? (
                          <div className="space-y-1">
                            <span className="text-[11px] font-bold text-amber-700">
                              {doc.statusLabel}
                            </span>
                            <div className="h-1 w-28 rounded-full bg-amber-100 overflow-hidden">
                              <div
                                style={{ width: `${doc.progress}%` }}
                                className="h-full bg-amber-600 rounded-full"
                              />
                            </div>
                          </div>
                        ) : (
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                              doc.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-700'
                                : doc.status === 'pending'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-red-50 text-red-600'
                            }`}
                          >
                            {doc.status}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-slate-600 font-normal">
                        {doc.uploadDate}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/documents/${doc.id}`, { state: { document: doc } });
                          }}
                          className="text-xs font-medium text-slate-500 hover:text-brand-purple hover:underline"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      <DocumentUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() => setIsUploadOpen(false)}
      />
    </div>
  );
}
