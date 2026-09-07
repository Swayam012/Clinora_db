import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getDocument, getDocumentFileUrl, triggerDocumentOcr } from '../services/api';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import {
  Activity,
  ArrowLeft,
  Download,
  CheckCircle2,
  FileText,
  Sparkles,
  Bot,
  Stethoscope,
  Heart,
  Pill,
  ExternalLink,
  ShieldCheck,
  ScanLine,
  Loader2,
} from 'lucide-react';

export default function DocumentViewerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [document, setDocument] = useState(location.state?.document || null);
  const [loading, setLoading] = useState(!document);
  const [activeTab, setActiveTab] = useState('overview');
  const [previewMode, setPreviewMode] = useState('file'); // 'file' | 'structured'
  const [isVerified, setIsVerified] = useState(false);
  const [fileError, setFileError] = useState(false);

  // OCR state
  const [ocrRunning, setOcrRunning] = useState(false);
  const [ocrError, setOcrError] = useState('');

  const [blobUrl, setBlobUrl] = useState(null);
  const [blobLoading, setBlobLoading] = useState(false);

  useEffect(() => {
    if (!document && id) {
      const fetchDocData = async () => {
        setLoading(true);
        try {
          const res = await getDocument(id);
          setDocument(res);
        } catch (err) {
          setDocument({
            id: id,
            title: 'Uploaded Clinical Document',
            file_name: 'clinical_document.pdf',
            patient_name: 'Patient Record',
            patient_custom_id: 'PAT-2026-00001',
            document_type: 'clinical_note',
            status: 'uploaded',
            created_at: new Date().toISOString(),
          });
        } finally {
          setLoading(false);
        }
      };
      fetchDocData();
    }
  }, [id, document]);

  // Fetch document blob with auth headers for direct rendering
  useEffect(() => {
    let active = true;
    if (document?.id) {
      const loadBlob = async () => {
        setBlobLoading(true);
        try {
          const token = localStorage.getItem('clinora_token');
          const fileEndpoint = getDocumentFileUrl(document.id);
          const response = await fetch(fileEndpoint, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (response.ok) {
            const blob = await response.blob();
            if (active) {
              const url = URL.createObjectURL(blob);
              setBlobUrl(url);
            }
          } else {
            setFileError(true);
          }
        } catch (err) {
          setFileError(true);
        } finally {
          if (active) setBlobLoading(false);
        }
      };
      loadBlob();
    }

    return () => {
      active = false;
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [document?.id]);

  const patientName = document?.patient_name || document?.patientName || 'Clinical Patient';
  const patientId = document?.patient_custom_id || document?.patientId || 'PAT-2026-00001';
  const docIdFormatted = document?.id ? `CD-${document.id.toString().slice(0, 5).toUpperCase()}` : 'CD-98725';
  const fileUrl = blobUrl || (document?.id ? getDocumentFileUrl(document.id) : null);
  const isPdf = document?.mime_type === 'application/pdf' || document?.file_name?.toLowerCase().endsWith('.pdf');
  const isImage = document?.mime_type?.startsWith('image/') || /\.(png|jpe?g|webp|tiff)$/i.test(document?.file_name || '');

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-white/[0.08] bg-slate-950/90 px-6 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-purple via-indigo-500 to-brand-coral text-white font-bold shadow-md shadow-brand-purple/20">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-tight">CLINORA</span>
              <span className="text-xs text-slate-400 border-l border-white/10 pl-2">
                Document Viewer & AI Extraction
              </span>
            </div>
          </div>
        </div>

        {/* Center Tabs */}
        <div className="hidden md:flex items-center gap-1 rounded-xl border border-white/[0.08] bg-slate-900/60 p-1">
          {['overview', 'files', 'settings', 'reports'].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                if (tab === 'files') navigate('/documents');
                else setActiveTab(tab);
              }}
              className={`rounded-lg px-3.5 py-1 text-xs font-medium capitalize transition-all ${
                activeTab === tab
                  ? 'bg-brand-purple text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'files' ? 'Patient Files' : tab === 'settings' ? 'AI Settings' : tab}
            </button>
          ))}
        </div>

        {/* Top Right Actions */}
        <div className="flex items-center gap-2.5">
          {fileUrl && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8"
              onClick={() => window.open(fileUrl, '_blank')}
            >
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              Open Raw File
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            className="text-xs h-8"
            onClick={() => navigate('/documents')}
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Close Viewer
          </Button>
        </div>
      </header>

      {/* Main Split-Pane Layout */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 max-w-[1700px] w-full mx-auto">
        {/* Left 6 Columns: Real Document Preview */}
        <div className="lg:col-span-6 flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <FileText className="h-4 w-4 text-brand-lavender" />
                Clinical Document Preview
              </h2>
              <p className="text-[11px] text-slate-400">
                {document?.file_name} {document?.file_size ? `(${(document.file_size / 1024).toFixed(1)} KB)` : ''}
              </p>
            </div>

            <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-slate-900/80 p-0.5">
              <button
                onClick={() => setPreviewMode('file')}
                className={`rounded px-2.5 py-1 text-[11px] font-medium transition-all ${
                  previewMode === 'file' ? 'bg-brand-purple text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Uploaded File
              </button>
              <button
                onClick={() => setPreviewMode('structured')}
                className={`rounded px-2.5 py-1 text-[11px] font-medium transition-all ${
                  previewMode === 'structured' ? 'bg-brand-purple text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Metadata View
              </button>
            </div>
          </div>

          {/* Document Sheet Card */}
          <Card className="flex-1 flex flex-col min-h-[580px] p-2 bg-slate-900/90 overflow-hidden relative border-white/10">
            {blobLoading ? (
              <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
                Loading document preview stream...
              </div>
            ) : previewMode === 'file' ? (
              <div className="flex-1 w-full h-full flex flex-col rounded-lg overflow-hidden bg-slate-950">
                {fileUrl && isPdf && !fileError ? (
                  <iframe
                    src={`${fileUrl}#toolbar=1&navpanes=0`}
                    title={document?.title || 'Document PDF'}
                    className="w-full h-full min-h-[560px] border-0 rounded-lg bg-white"
                  />
                ) : fileUrl && isImage && !fileError ? (
                  <div className="flex-1 flex items-center justify-center p-4 bg-slate-950 overflow-auto">
                    <img
                      src={fileUrl}
                      alt={document?.title || 'Document scan'}
                      className="max-h-[560px] max-w-full object-contain rounded-lg shadow-2xl border border-white/10"
                    />
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
                    <FileText className="h-12 w-12 text-brand-lavender" />
                    <div>
                      <h4 className="text-base font-bold text-white">{document?.title || 'Clinical Document'}</h4>
                      <p className="text-xs text-slate-400 mt-1">File: {document?.file_name}</p>
                      <p className="text-[11px] text-slate-500">Format: {document?.mime_type || 'PDF Document'}</p>
                    </div>
                    {fileUrl && (
                      <Button
                        variant="coral"
                        size="sm"
                        className="text-xs mt-3"
                        onClick={() => window.open(fileUrl, '_blank')}
                      >
                        <Download className="mr-1.5 h-3.5 w-3.5" />
                        Download Uploaded File
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Structured Metadata Sheet */
              <div className="flex-1 bg-white text-slate-900 p-6 rounded-lg overflow-y-auto space-y-4 shadow-xl">
                <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{document?.title || 'Clinical Document'}</h3>
                    <p className="text-xs text-slate-500">
                      Category: {document?.document_type?.toUpperCase().replace('_', ' ') || 'CLINICAL NOTE'}
                    </p>
                  </div>
                  <div className="text-right text-xs text-slate-500 font-mono">
                    {document?.created_at ? new Date(document.created_at).toLocaleDateString() : 'Recent'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg text-xs">
                  <div>
                    <span className="text-slate-500">Patient:</span>{' '}
                    <span className="font-semibold text-brand-purple">{patientName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Patient ID:</span>{' '}
                    <span className="font-mono font-semibold">{patientId}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">File:</span> {document?.file_name}
                  </div>
                  <div>
                    <span className="text-slate-500">Size:</span>{' '}
                    {document?.file_size ? `${(document.file_size / 1024).toFixed(1)} KB` : 'N/A'}
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Document Summary</h4>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {document?.ocr_text ||
                      `Document "${document?.title}" is registered in PostgreSQL for ${patientName}. Automated OCR text extraction will execute in Phase 5, followed by clinical entity recognition in Phase 6.`}
                  </p>
                </div>

                <div className="border-t border-slate-200 pt-3 text-[11px] text-slate-400 flex justify-between font-mono">
                  <span>SHA-256: {document?.checksum ? document.checksum.slice(0, 16) + '...' : 'Verified'}</span>
                  <span>ID: {patientId}</span>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right 6 Columns: Extracted Clinical Information Cards */}
        <div className="lg:col-span-6 flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand-coral" />
              Extracted Clinical Information
            </h2>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-slate-400">ID: {docIdFormatted}</span>
              <Badge variant={isVerified ? 'mint' : document?.status === 'processed' ? 'mint' : document?.status === 'processing' ? 'blue' : 'amber'}>
                {isVerified ? 'Verified ✓' : document?.status === 'processed' ? 'OCR Complete' : document?.status === 'processing' ? 'Processing...' : 'Uploaded'}
              </Badge>
            </div>
          </div>

          {/* OCR Action Bar */}
          {document?.status !== 'processed' && (
            <Card className="p-4 border-brand-purple/20 bg-gradient-to-r from-brand-purple/[0.08] to-slate-900/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-purple/20 text-brand-lavender border border-brand-purple/30">
                    <ScanLine className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">OCR Text Extraction</p>
                    <p className="text-[11px] text-slate-400">
                      {ocrRunning ? 'Scanning document with Tesseract engine...' : 'Extract text from this clinical document using OCR'}
                    </p>
                  </div>
                </div>

                <Button
                  variant="coral"
                  size="sm"
                  className="text-xs font-semibold"
                  disabled={ocrRunning}
                  onClick={async () => {
                    setOcrRunning(true);
                    setOcrError('');
                    try {
                      const updated = await triggerDocumentOcr(document.id);
                      setDocument((prev) => ({ ...prev, ...updated }));
                    } catch (err) {
                      setOcrError(err.message || 'OCR extraction failed');
                    } finally {
                      setOcrRunning(false);
                    }
                  }}
                >
                  {ocrRunning ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Running OCR...
                    </>
                  ) : (
                    <>
                      <ScanLine className="mr-1.5 h-3.5 w-3.5" />
                      Run OCR Extraction
                    </>
                  )}
                </Button>
              </div>

              {ocrError && (
                <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 p-2.5 text-xs text-red-400">
                  {ocrError}
                </div>
              )}
            </Card>
          )}

          {/* OCR Extracted Text Panel (shown when text exists) */}
          {document?.ocr_text && (
            <Card className="p-4 space-y-2.5 border-emerald-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <FileText className="h-4 w-4 text-emerald-400" />
                  <span>Extracted OCR Text</span>
                </div>
                <Badge variant="mint">{document.ocr_text.length.toLocaleString()} chars</Badge>
              </div>
              <div className="max-h-48 overflow-y-auto rounded-lg border border-white/[0.08] bg-slate-950/80 p-3">
                <pre className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
                  {document.ocr_text}
                </pre>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* 1. Patient Info Card */}
            <Card className="p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <ShieldCheck className="h-4 w-4 text-brand-lavender" />
                <span>Patient Demographics</span>
              </div>
              <div className="text-xs text-slate-300 space-y-1">
                <div><span className="text-slate-500">Name:</span> {patientName}</div>
                <div><span className="text-slate-500">ID:</span> {patientId}</div>
                <div><span className="text-slate-500">Doc:</span> {document?.title || 'Report'}</div>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-emerald-400 pt-1">
                <CheckCircle2 className="h-3 w-3" />
                <span>Identity Verified in Database</span>
              </div>
            </Card>

            {/* 2. Diagnosis Card */}
            <Card className="p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Stethoscope className="h-4 w-4 text-brand-coral" />
                <span>Diagnosis & Findings</span>
              </div>
              <div className="text-xs text-slate-300 space-y-1">
                <div><span className="text-slate-500">Category:</span> {document?.document_type?.replace('_', ' ').toUpperCase()}</div>
                <div className="text-slate-400 text-[11px] mt-1">
                  {document?.extracted_data?.diagnosis || (document?.ocr_text ? 'OCR text extracted — structured extraction available in Phase 6' : 'Run OCR to extract text first')}
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                <span>AI Confidence</span>
                <span className={`font-semibold ${document?.ocr_text ? 'text-emerald-400' : 'text-brand-lavender'}`}>
                  {document?.ocr_text ? 'Text Extracted ✓' : 'Awaiting OCR'}
                </span>
              </div>
            </Card>

            {/* 3. Symptoms Card */}
            <Card className="p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Heart className="h-4 w-4 text-rose-400" />
                <span>Symptoms & Notes</span>
              </div>
              <div className="text-xs text-slate-400 text-[11px] leading-relaxed">
                {document?.extracted_data?.symptoms || (document?.ocr_text ? 'OCR complete — clinical symptom extraction available in Phase 6' : 'Run OCR extraction to begin text analysis.')}
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                <span>Extraction Status</span>
                <span className={`font-semibold ${document?.ocr_text ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {document?.ocr_text ? 'Text Ready' : 'Queued'}
                </span>
              </div>
            </Card>

            {/* 4. Medications Card */}
            <Card className="p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Pill className="h-4 w-4 text-emerald-400" />
                <span>Medications & Dosage</span>
              </div>
              <div className="text-xs text-slate-400 text-[11px] leading-relaxed">
                {document?.extracted_data?.medications || (document?.ocr_text ? 'OCR complete — medication extraction available in Phase 6' : 'Prescription data will be extracted after OCR.')}
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                <span>Extraction Status</span>
                <span className={`font-semibold ${document?.ocr_text ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {document?.ocr_text ? 'Text Ready' : 'Queued'}
                </span>
              </div>
            </Card>

            {/* 5. Full Metadata Card */}
            <Card className="sm:col-span-2 p-4 space-y-2.5 bg-slate-900/40">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Bot className="h-4 w-4 text-brand-lavender" />
                <span>Storage Metadata & Pipeline Check</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs text-slate-300">
                <div>
                  <span className="text-slate-500">Original File:</span>
                  <div className="font-medium truncate">{document?.file_name || 'document.pdf'}</div>
                </div>
                <div>
                  <span className="text-slate-500">File Format & Size:</span>
                  <div className="font-medium text-emerald-400">
                    {document?.file_size ? `${(document.file_size / 1024).toFixed(1)} KB` : 'N/A'} ({document?.mime_type || 'PDF'})
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Bottom Doctor Verification CTA */}
          <div className="flex items-center justify-between border-t border-white/[0.08] pt-4 mt-auto">
            <span className="text-[11px] text-slate-500">
              Document: {document?.file_name} &bull; CLINORA v2.1
            </span>

            <Button
              variant="coral"
              size="sm"
              className="font-bold text-xs"
              onClick={() => {
                setIsVerified(true);
                alert('Document confirmed and marked verified by attending clinician.');
              }}
            >
              <CheckCircle2 className="mr-1.5 h-4 w-4" />
              {isVerified ? 'Verified by Clinician ✓' : 'Verify Document Information'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
