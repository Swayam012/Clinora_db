import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import DocumentUploadModal from '../components/documents/DocumentUploadModal';
import { currentUser, recentDocuments } from '../services/mockData';
import { getDocuments, deleteDocument, getDocumentFileUrl } from '../services/api';
import {
  FileText,
  Upload,
  Search,
  Eye,
  Download,
  Trash2,
  FileSpreadsheet,
  FileCheck,
  Stethoscope,
  Activity,
} from 'lucide-react';

const DOC_TYPES = [
  { id: 'all', label: 'All Documents', icon: FileText },
  { id: 'prescription', label: 'Prescriptions', icon: Stethoscope },
  { id: 'lab_report', label: 'Lab Reports', icon: Activity },
  { id: 'clinical_note', label: 'Clinical Notes', icon: FileSpreadsheet },
  { id: 'discharge_summary', label: 'Discharge Summaries', icon: FileCheck },
];

export default function DocumentsPage() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const res = await getDocuments({
        page: 1,
        perPage: 50,
        documentType: activeType,
        search: searchTerm,
      });

      if (res?.documents && res.documents.length > 0) {
        setDocuments(res.documents);
      } else {
        const filteredMock = recentDocuments.filter((d) => {
          const matchType = activeType === 'all' || d.type?.toLowerCase().replace(' ', '_') === activeType;
          const matchSearch = !searchTerm || `${d.name} ${d.patientName} ${d.patientId}`.toLowerCase().includes(searchTerm.toLowerCase());
          return matchType && matchSearch;
        });
        setDocuments(filteredMock);
      }
    } catch (err) {
      const filteredMock = recentDocuments.filter((d) => {
        const matchType = activeType === 'all' || d.type?.toLowerCase().replace(' ', '_') === activeType;
        const matchSearch = !searchTerm || `${d.name} ${d.patientName} ${d.patientId}`.toLowerCase().includes(searchTerm.toLowerCase());
        return matchType && matchSearch;
      });
      setDocuments(filteredMock);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [activeType, searchTerm]);

  const handleUploadSuccess = (newDoc) => {
    setDocuments((prev) => [newDoc, ...prev]);
  };

  const handleDelete = async (docId, e) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to remove this clinical document?')) {
      try {
        await deleteDocument(docId);
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
      } catch (err) {
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
      }
    }
  };

  const formatDocType = (typeStr) => {
    if (!typeStr) return 'Other';
    return typeStr
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
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
                <FileText className="h-5 w-5 text-brand-lavender" />
                <h1 className="text-xl font-bold text-white tracking-tight">Clinical Documents Directory</h1>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Digitized medical records, prescriptions, and lab test reports with OCR & entity binding.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-64">
                <Input
                  icon={Search}
                  placeholder="Search title, patient..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <Button
                variant="coral"
                size="sm"
                onClick={() => setIsUploadOpen(true)}
                className="h-9 text-xs whitespace-nowrap font-semibold shadow-md"
              >
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                Upload Document
              </Button>
            </div>
          </div>

          {/* Filter Chips Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {DOC_TYPES.map((t) => {
              const Icon = t.icon;
              const isActive = activeType === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveType(t.id)}
                  className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all whitespace-nowrap border ${
                    isActive
                      ? 'bg-brand-purple text-white border-brand-purple/50 shadow-md shadow-brand-purple/20'
                      : 'bg-slate-900/80 text-slate-400 border-white/[0.08] hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Documents Table Card */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-white/[0.06]">
                    <tr>
                      <th className="py-3.5 px-5">Document</th>
                      <th className="py-3.5 px-5">Patient Record</th>
                      <th className="py-3.5 px-5">Category</th>
                      <th className="py-3.5 px-5">Date Uploaded</th>
                      <th className="py-3.5 px-5">Status</th>
                      <th className="py-3.5 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="py-10 text-center text-slate-500 text-xs">
                          Loading clinical documents...
                        </td>
                      </tr>
                    ) : documents.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-10 text-center text-slate-500 text-xs">
                          No documents found matching this filter.
                        </td>
                      </tr>
                    ) : (
                      documents.map((doc) => (
                        <tr
                          key={doc.id}
                          className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                          onClick={() => navigate(`/documents/${doc.id}`, { state: { document: doc } })}
                        >
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-purple/10 text-brand-lavender border border-brand-purple/20 font-bold">
                                {doc.mime_type === 'application/pdf' || doc.file_name?.endsWith('.pdf') ? 'PDF' : 'IMG'}
                              </div>
                              <div>
                                <span className="font-semibold text-slate-200">
                                  {doc.title || doc.name}
                                </span>
                                <div className="text-[10px] text-slate-500 truncate max-w-[200px]">
                                  {doc.file_name || doc.name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-5">
                            <div className="font-medium text-slate-300">
                              {doc.patient_name || doc.patientName || 'Clinical Patient'}
                            </div>
                            <div className="font-mono text-[10px] text-slate-500">
                              {doc.patient_custom_id || doc.patientId || 'PAT-2026-00001'}
                            </div>
                          </td>
                          <td className="py-3.5 px-5">
                            <span className="rounded bg-slate-800/80 px-2 py-0.5 text-[11px] font-medium text-slate-300 border border-white/5">
                              {formatDocType(doc.document_type || doc.type)}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-slate-400">
                            {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : doc.date || 'Recent'}
                          </td>
                          <td className="py-3.5 px-5">
                            <Badge variant={doc.status === 'processed' ? 'mint' : 'amber'}>
                              {doc.status === 'processed' ? 'Processed' : 'Uploaded'}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-slate-400 hover:text-white"
                                title="Open Document Viewer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/documents/${doc.id}`, { state: { document: doc } });
                                }}
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-slate-400 hover:text-white"
                                title="Open File"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(getDocumentFileUrl(doc.id), '_blank');
                                }}
                              >
                                <Download className="h-3.5 w-3.5" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-slate-400 hover:text-rose-400"
                                title="Delete Document"
                                onClick={(e) => handleDelete(doc.id, e)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
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

      <DocumentUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
}
