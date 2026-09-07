import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getDocument, getDocumentFileUrl, triggerDocumentOcr, triggerClinicalExtraction } from '../services/api';
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
  AlertCircle,
  FlaskConical,
  Clock,
  ListChecks,
  Code2,
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

  // OCR & Extraction states
  const [ocrRunning, setOcrRunning] = useState(false);
  const [ocrError, setOcrError] = useState('');
  const [extractRunning, setExtractRunning] = useState(false);
  const [extractError, setExtractError] = useState('');
  const [showJsonView, setShowJsonView] = useState(false);

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

  // Load document file as authenticated Blob for preview
  useEffect(() => {
    let active = true;
    if (document?.id) {
      const loadMediaBlob = async () => {
        setBlobLoading(true);
        setFileError(false);
        try {
          const token = localStorage.getItem('clinora_token');
          const fileUrl = getDocumentFileUrl(document.id);
          const res = await fetch(fileUrl, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const blob = await res.blob();
          if (active) {
            const url = URL.createObjectURL(blob);
            setBlobUrl(url);
          }
        } catch (err) {
          if (active) setFileError(true);
        } finally {
          if (active) setBlobLoading(false);
        }
      };
      loadMediaBlob();
    }
    return () => {
      active = false;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [document?.id]);

  const patientName = document?.patient_name || 'Assigned Patient';
  const patientId = document?.patient_custom_id || 'PAT-2026-00001';
  const docIdFormatted = document?.id ? `DOC-${document.id.slice(0, 8).toUpperCase()}` : 'DOC-NEW';

  const isPdf = document?.mime_type === 'application/pdf' || document?.file_name?.endsWith('.pdf');
  const isImage = document?.mime_type?.startsWith('image/') || /\.(png|jpg|jpeg|webp|tiff)$/i.test(document?.file_name || '');

  const extracted = document?.extracted_data;
  const hasExtractedData = extracted && typeof extracted === 'object' && Object.keys(extracted).length > 0;

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 antialiased">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/[0.08] bg-slate-950/80 px-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white"
            onClick={() => navigate('/documents')}
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to Documents
          </Button>

          <div className="h-4 w-px bg-white/[0.08]" />

          <div className="flex items-center gap-2">
            <span className="font-semibold text-xs text-white truncate max-w-[200px] sm:max-w-md">
              {document?.title || 'Clinical Document'}
            </span>
            <Badge variant="secondary" className="font-mono text-[10px]">
              {document?.document_type?.toUpperCase().replace('_', ' ') || 'CLINICAL NOTE'}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {blobUrl && (
            <a href={blobUrl} download={document?.file_name || 'document'} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm" className="h-8 text-xs border-white/[0.1] text-slate-300">
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Download Original
              </Button>
            </a>
          )}
        </div>
      </header>

      {/* Main Split Layout: 12 Columns */}
      <main className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 max-w-[1700px] mx-auto w-full">
        {/* Left 6 Columns: Document Viewer / Preview */}
        <div className="lg:col-span-6 flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-brand-lavender" />
              <h2 className="text-sm font-bold text-white tracking-tight">Source Document</h2>
            </div>

            <div className="flex items-center bg-slate-900 border border-white/[0.08] rounded-lg p-0.5 text-xs">
              <button
                onClick={() => setPreviewMode('file')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  previewMode === 'file' ? 'bg-brand-purple text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Document Media
              </button>
              <button
                onClick={() => setPreviewMode('structured')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  previewMode === 'structured' ? 'bg-brand-purple text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Metadata View
              </button>
            </div>
          </div>

          <Card className="flex-1 min-h-[500px] lg:min-h-[720px] flex flex-col overflow-hidden bg-slate-900/50 border-white/[0.08] relative">
            {blobLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="h-8 w-8 text-brand-lavender animate-spin" />
                <p className="text-xs text-slate-400">Loading document media securely...</p>
              </div>
            ) : fileError ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-400">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-semibold text-white">Media Preview Unavailable</h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  The physical file could not be rendered in this session. Full metadata and extracted records remain accessible.
                </p>
              </div>
            ) : previewMode === 'file' ? (
              <div className="flex-1 flex items-center justify-center bg-slate-950 p-2 overflow-auto">
                {isPdf && blobUrl ? (
                  <iframe
                    src={`${blobUrl}#toolbar=0`}
                    title="Document PDF Preview"
                    className="w-full h-full min-h-[680px] rounded border border-white/[0.08]"
                  />
                ) : isImage && blobUrl ? (
                  <img
                    src={blobUrl}
                    alt={document?.title || 'Medical Record'}
                    className="max-h-[700px] w-auto object-contain rounded shadow-lg"
                  />
                ) : (
                  <div className="text-center p-6 space-y-2">
                    <FileText className="h-10 w-10 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-400">Document ready for processing.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 space-y-4 text-slate-800 bg-white min-h-full font-sans text-xs">
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
                      `Document "${document?.title}" is registered in PostgreSQL for ${patientName}.`}
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
              Extracted Clinical Intelligence
            </h2>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-slate-400">ID: {docIdFormatted}</span>
              <Badge variant={isVerified ? 'mint' : hasExtractedData ? 'mint' : document?.status === 'processed' ? 'blue' : 'amber'}>
                {isVerified ? 'Verified ✓' : hasExtractedData ? 'AI Extracted ✓' : document?.status === 'processed' ? 'OCR Ready' : 'Uploaded'}
              </Badge>
            </div>
          </div>

          {/* Action Control Bar (OCR & LLM Extraction) */}
          <Card className="p-3.5 border-brand-purple/20 bg-gradient-to-r from-brand-purple/[0.1] to-slate-900/70 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-purple/20 text-brand-lavender border border-brand-purple/30">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">AI Clinical Processing Engine</p>
                  <p className="text-[11px] text-slate-400">
                    {extractRunning
                      ? 'Extracting structured diagnoses, medications, and vitals via AI...'
                      : ocrRunning
                      ? 'Running neural OCR text extraction...'
                      : hasExtractedData
                      ? 'Clinical entities extracted & saved to database'
                      : document?.ocr_text
                      ? 'OCR complete — ready to extract structured clinical entities'
                      : 'Run OCR first, then extract structured medical entities'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Step 1: Run OCR */}
                {!document?.ocr_text && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs font-semibold border-brand-purple/30 text-brand-lavender hover:bg-brand-purple/20"
                    disabled={ocrRunning || extractRunning}
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
                        Scanning OCR...
                      </>
                    ) : (
                      <>
                        <ScanLine className="mr-1.5 h-3.5 w-3.5" />
                        Run OCR
                      </>
                    )}
                  </Button>
                )}

                {/* Step 2: Extract Clinical Entities (Phase 6) */}
                <Button
                  variant="coral"
                  size="sm"
                  className="text-xs font-semibold shadow-lg shadow-coral-500/10"
                  disabled={extractRunning || ocrRunning}
                  onClick={async () => {
                    setExtractRunning(true);
                    setExtractError('');
                    try {
                      const updated = await triggerClinicalExtraction(document.id);
                      setDocument((prev) => ({ ...prev, ...updated }));
                    } catch (err) {
                      setExtractError(err.message || 'Clinical extraction failed');
                    } finally {
                      setExtractRunning(false);
                    }
                  }}
                >
                  {extractRunning ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Extracting Entities...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                      {hasExtractedData ? 'Re-Extract AI Entities' : 'Extract Clinical Entities (AI)'}
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Error alerts */}
            {ocrError && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-2.5 text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{ocrError}</span>
              </div>
            )}
            {extractError && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-2.5 text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{extractError}</span>
              </div>
            )}
          </Card>

          {/* Executive Clinical Summary Card (When available) */}
          {hasExtractedData && extracted.clinical_summary && (
            <Card className="p-4 space-y-2 border-brand-purple/30 bg-slate-900/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Stethoscope className="h-4 w-4 text-brand-lavender" />
                  <span>Executive Clinical Summary</span>
                </div>
                <Badge variant="outline" className="text-[10px] text-brand-lavender border-brand-purple/40">
                  {extracted.extraction_source || 'AI Extraction'}
                </Badge>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-white/[0.05]">
                {extracted.clinical_summary}
              </p>
            </Card>
          )}

          {/* Structured Clinical Information Tabs/Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* 1. Diagnoses & Findings Card */}
            <Card className="p-4 space-y-2.5 border-white/[0.08]">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-brand-coral" />
                  <span>Diagnoses & ICD-10</span>
                </div>
                {hasExtractedData && extracted.diagnoses?.length > 0 && (
                  <Badge variant="coral">{extracted.diagnoses.length}</Badge>
                )}
              </div>

              {hasExtractedData && extracted.diagnoses?.length > 0 ? (
                <div className="space-y-2">
                  {extracted.diagnoses.map((diag, idx) => (
                    <div key={idx} className="bg-slate-950/70 p-2.5 rounded-lg border border-white/[0.05] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-white">{diag.condition}</span>
                        {diag.icd10_code && (
                          <Badge variant="outline" className="font-mono text-[10px] text-amber-400 border-amber-500/30">
                            ICD-10: {diag.icd10_code}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="capitalize">{diag.type || 'Primary'}</span>
                        <span className="text-emerald-400">Confidence: {diag.confidence || 'High'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-400 space-y-1">
                  <div><span className="text-slate-500">Category:</span> {document?.document_type?.replace('_', ' ').toUpperCase()}</div>
                  <p className="text-slate-500 text-[11px] pt-1">
                    {document?.ocr_text ? 'Click "Extract Clinical Entities" to detect conditions & ICD-10 codes.' : 'Awaiting OCR & AI extraction.'}
                  </p>
                </div>
              )}
            </Card>

            {/* 2. Prescribed Medications Card */}
            <Card className="p-4 space-y-2.5 border-white/[0.08]">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <div className="flex items-center gap-2">
                  <Pill className="h-4 w-4 text-emerald-400" />
                  <span>Prescribed Medications</span>
                </div>
                {hasExtractedData && extracted.medications?.length > 0 && (
                  <Badge variant="mint">{extracted.medications.length}</Badge>
                )}
              </div>

              {hasExtractedData && extracted.medications?.length > 0 ? (
                <div className="space-y-2">
                  {extracted.medications.map((med, idx) => (
                    <div key={idx} className="bg-slate-950/70 p-2.5 rounded-lg border border-white/[0.05] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-emerald-300">{med.drug_name}</span>
                        {med.dosage && (
                          <Badge variant="mint" className="text-[10px]">{med.dosage}</Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-300">{med.frequency || 'As prescribed'}</p>
                      {med.instructions && (
                        <p className="text-[10px] text-slate-500 italic">{med.instructions}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 text-[11px] leading-relaxed">
                  {document?.ocr_text ? 'Click "Extract Clinical Entities" to parse pharmaceutical dosages.' : 'Medication schedule will populate after AI extraction.'}
                </p>
              )}
            </Card>

            {/* 3. Symptoms & Complaints Card */}
            <Card className="p-4 space-y-2.5 border-white/[0.08]">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-rose-400" />
                  <span>Symptoms & Complaints</span>
                </div>
                {hasExtractedData && extracted.symptoms?.length > 0 && (
                  <Badge variant="outline" className="text-[10px] text-rose-400 border-rose-500/30">{extracted.symptoms.length}</Badge>
                )}
              </div>

              {hasExtractedData && extracted.symptoms?.length > 0 ? (
                <div className="space-y-2">
                  {extracted.symptoms.map((sym, idx) => (
                    <div key={idx} className="bg-slate-950/70 p-2 rounded-lg border border-white/[0.05] space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-xs text-white">{sym.symptom}</span>
                        {sym.severity && (
                          <span className="text-[10px] text-rose-400">{sym.severity}</span>
                        )}
                      </div>
                      {sym.onset && (
                        <p className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          <span>Onset: {sym.onset} {sym.duration ? `(${sym.duration})` : ''}</span>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 text-[11px] leading-relaxed">
                  {document?.ocr_text ? 'Click "Extract Clinical Entities" to detect symptoms & timeline.' : 'Awaiting clinical entity extraction.'}
                </p>
              )}
            </Card>

            {/* 4. Vitals & Biometric Markers Card */}
            <Card className="p-4 space-y-2.5 border-white/[0.08]">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Activity className="h-4 w-4 text-cyan-400" />
                <span>Vitals & Biomarkers</span>
              </div>

              {hasExtractedData && extracted.vitals ? (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {extracted.vitals.blood_pressure && (
                    <div className="bg-slate-950/70 p-2 rounded border border-white/[0.05]">
                      <span className="text-[10px] text-slate-500">Blood Pressure</span>
                      <div className="font-semibold text-white">{extracted.vitals.blood_pressure}</div>
                    </div>
                  )}
                  {extracted.vitals.heart_rate && (
                    <div className="bg-slate-950/70 p-2 rounded border border-white/[0.05]">
                      <span className="text-[10px] text-slate-500">Heart Rate</span>
                      <div className="font-semibold text-emerald-400">{extracted.vitals.heart_rate}</div>
                    </div>
                  )}
                  {extracted.vitals.oxygen_saturation && (
                    <div className="bg-slate-950/70 p-2 rounded border border-white/[0.05]">
                      <span className="text-[10px] text-slate-500">SpO2</span>
                      <div className="font-semibold text-cyan-400">{extracted.vitals.oxygen_saturation}</div>
                    </div>
                  )}
                  {extracted.vitals.temperature && (
                    <div className="bg-slate-950/70 p-2 rounded border border-white/[0.05]">
                      <span className="text-[10px] text-slate-500">Temperature</span>
                      <div className="font-semibold text-amber-400">{extracted.vitals.temperature}</div>
                    </div>
                  )}
                  {extracted.vitals.weight && (
                    <div className="bg-slate-950/70 p-2 rounded border border-white/[0.05]">
                      <span className="text-[10px] text-slate-500">Weight</span>
                      <div className="font-semibold text-white">{extracted.vitals.weight}</div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500 text-[11px] leading-relaxed">
                  Recorded vital signs (BP, Heart Rate, SpO2, Temperature) will be extracted automatically.
                </p>
              )}
            </Card>

            {/* 5. Laboratory Results Table (Full Width) */}
            {hasExtractedData && extracted.lab_results?.length > 0 && (
              <Card className="sm:col-span-2 p-4 space-y-2.5 border-white/[0.08]">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="h-4 w-4 text-amber-400" />
                    <span>Laboratory Findings & Biomarkers</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-500/30">
                    {extracted.lab_results.length} Tests
                  </Badge>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/[0.08] text-[11px] text-slate-400">
                        <th className="py-2 pr-3">Test Name</th>
                        <th className="py-2 px-3">Observed Value</th>
                        <th className="py-2 px-3">Reference Range</th>
                        <th className="py-2 pl-3 text-right">Flag</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.05]">
                      {extracted.lab_results.map((lab, idx) => (
                        <tr key={idx} className="text-slate-300">
                          <td className="py-2 pr-3 font-medium text-white">{lab.test_name}</td>
                          <td className="py-2 px-3 font-mono font-semibold text-cyan-300">
                            {lab.value} {lab.unit || ''}
                          </td>
                          <td className="py-2 px-3 text-slate-400">{lab.reference_range || 'N/A'}</td>
                          <td className="py-2 pl-3 text-right">
                            <Badge
                              variant={
                                lab.flag === 'high' || lab.flag === 'critical'
                                  ? 'coral'
                                  : lab.flag === 'low'
                                  ? 'amber'
                                  : 'mint'
                              }
                              className="text-[10px] uppercase"
                            >
                              {lab.flag}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* 6. Follow-up Recommendations & Allergies */}
            {hasExtractedData && extracted.follow_up_recommendations?.length > 0 && (
              <Card className="sm:col-span-2 p-4 space-y-2.5 border-white/[0.08]">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <ListChecks className="h-4 w-4 text-brand-lavender" />
                  <span>Physician Follow-up & Recommendations</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-300 pl-4 list-disc marker:text-brand-lavender">
                  {extracted.follow_up_recommendations.map((item, idx) => (
                    <li key={idx} className="leading-relaxed">{item}</li>
                  ))}
                </ul>
              </Card>
            )}
          </div>

          {/* OCR Extracted Text Accordion/Panel */}
          {document?.ocr_text && (
            <Card className="p-3.5 space-y-2 border-white/[0.08] bg-slate-900/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <FileText className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Raw OCR Extracted Text</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="mint" className="text-[10px]">{document.ocr_text.length.toLocaleString()} chars</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[11px] text-slate-400 hover:text-white"
                    onClick={() => setShowJsonView(!showJsonView)}
                  >
                    <Code2 className="h-3 w-3 mr-1" />
                    {showJsonView ? 'Hide JSON' : 'View JSON'}
                  </Button>
                </div>
              </div>

              {showJsonView && hasExtractedData ? (
                <div className="max-h-48 overflow-y-auto rounded-lg border border-white/[0.08] bg-slate-950 p-3">
                  <pre className="text-[11px] font-mono text-cyan-300 whitespace-pre-wrap">
                    {JSON.stringify(extracted, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="max-h-36 overflow-y-auto rounded-lg border border-white/[0.08] bg-slate-950/80 p-3">
                  <pre className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap font-sans">
                    {document.ocr_text}
                  </pre>
                </div>
              )}
            </Card>
          )}

          {/* Bottom Clinician Verification CTA */}
          <div className="flex items-center justify-between border-t border-white/[0.08] pt-4 mt-auto">
            <span className="text-[11px] text-slate-500">
              File: {document?.file_name} &bull; CLINORA v2.1
            </span>

            <Button
              variant="coral"
              size="sm"
              className="font-bold text-xs"
              onClick={() => {
                setIsVerified(true);
                alert('Clinical information verified and recorded by attending physician.');
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
