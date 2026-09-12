import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { currentUser } from '../services/mockData';
import { getPatientKnowledgeGraph, getGlobalKnowledgeGraph, syncKnowledgeGraph } from '../services/api';
import {
  Network,
  Sparkles,
  Search,
  Filter,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Database,
  Layers,
  Activity,
  Pill,
  FileText,
  Stethoscope,
  Info,
  CheckCircle2,
  Loader2,
  ExternalLink,
  ChevronRight,
  Share2,
} from 'lucide-react';

const NODE_COLORS = {
  patient: { bg: '#a78bfa', border: '#c4b5fd', text: 'text-purple-300', light: 'bg-purple-500/20' },
  condition: { bg: '#f87171', border: '#fca5a5', text: 'text-red-300', light: 'bg-red-500/20' },
  medication: { bg: '#fb923c', border: '#fdba74', text: 'text-orange-300', light: 'bg-orange-500/20' },
  lab: { bg: '#34d399', border: '#6ee7b7', text: 'text-emerald-300', light: 'bg-emerald-500/20' },
  document: { bg: '#60a5fa', border: '#93c5fd', text: 'text-blue-300', light: 'bg-blue-500/20' },
  physician: { bg: '#c084fc', border: '#d8b4fe', text: 'text-fuchsia-300', light: 'bg-fuchsia-500/20' },
};

export default function KnowledgeGraphPage() {
  const navigate = useNavigate();
  const [selectedCohort, setSelectedCohort] = useState('global');
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [activeFilters, setActiveFilters] = useState({
    patient: true,
    condition: true,
    medication: true,
    lab: true,
    document: true,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [zoom, setZoom] = useState(1);
  const [syncing, setSyncing] = useState(false);

  // Load Graph Data from API
  const loadGraph = async (cohort = selectedCohort) => {
    setLoading(true);
    setSelectedNode(null);
    try {
      let data;
      if (cohort === 'global') {
        data = await getGlobalKnowledgeGraph(80);
      } else {
        data = await getPatientKnowledgeGraph(cohort);
      }
      setGraphData(data);
    } catch (err) {
      console.error('Failed to load knowledge graph:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGraph(selectedCohort);
  }, [selectedCohort]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncKnowledgeGraph();
      await loadGraph(selectedCohort);
    } catch (err) {
      alert(`Sync error: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const toggleFilter = (type) => {
    setActiveFilters((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  // Filter nodes & calculate coordinates
  const layout = useMemo(() => {
    if (!graphData || !graphData.nodes) return { nodesWithPos: [], visibleEdges: [] };

    const visibleNodes = graphData.nodes.filter((n) => {
      const typeAllowed = activeFilters[n.type] !== false;
      const matchesSearch = !searchTerm || n.label.toLowerCase().includes(searchTerm.toLowerCase());
      return typeAllowed && matchesSearch;
    });

    const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));

    const visibleEdges = graphData.edges.filter(
      (e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)
    );

    // Dynamic Multi-Ring Cluster Layout
    const width = 850;
    const height = 550;
    const centerX = width / 2;
    const centerY = height / 2;

    const patientNodes = visibleNodes.filter((n) => n.type === 'patient');
    const conditionNodes = visibleNodes.filter((n) => n.type === 'condition');
    const medicationNodes = visibleNodes.filter((n) => n.type === 'medication');
    const labNodes = visibleNodes.filter((n) => n.type === 'lab');
    const docNodes = visibleNodes.filter((n) => n.type === 'document');

    const nodesWithPos = [];

    // Place patient nodes in center ring
    patientNodes.forEach((n, i) => {
      const angle = (i / Math.max(patientNodes.length, 1)) * 2 * Math.PI;
      const radius = patientNodes.length === 1 ? 0 : 70;
      nodesWithPos.push({
        ...n,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      });
    });

    // Place conditions in inner-middle ring
    conditionNodes.forEach((n, i) => {
      const angle = (i / Math.max(conditionNodes.length, 1)) * 2 * Math.PI + 0.3;
      nodesWithPos.push({
        ...n,
        x: centerX + 160 * Math.cos(angle),
        y: centerY + 130 * Math.sin(angle),
      });
    });

    // Place medications in middle ring
    medicationNodes.forEach((n, i) => {
      const angle = (i / Math.max(medicationNodes.length, 1)) * 2 * Math.PI + 0.8;
      nodesWithPos.push({
        ...n,
        x: centerX + 230 * Math.cos(angle),
        y: centerY + 190 * Math.sin(angle),
      });
    });

    // Place labs in outer ring
    labNodes.forEach((n, i) => {
      const angle = (i / Math.max(labNodes.length, 1)) * 2 * Math.PI + 1.2;
      nodesWithPos.push({
        ...n,
        x: centerX + 310 * Math.cos(angle),
        y: centerY + 240 * Math.sin(angle),
      });
    });

    // Place documents in top/bottom corners
    docNodes.forEach((n, i) => {
      const angle = (i / Math.max(docNodes.length, 1)) * 2 * Math.PI + 2.1;
      nodesWithPos.push({
        ...n,
        x: centerX + 370 * Math.cos(angle),
        y: centerY + 220 * Math.sin(angle),
      });
    });

    return { nodesWithPos, visibleEdges };
  }, [graphData, activeFilters, searchTerm]);

  const posMap = useMemo(() => {
    const map = {};
    layout.nodesWithPos.forEach((n) => {
      map[n.id] = { x: n.x, y: n.y, ...n };
    });
    return map;
  }, [layout.nodesWithPos]);

  // Connected edges for selected node
  const connectedInfo = useMemo(() => {
    if (!selectedNode || !graphData) return { inbound: [], outbound: [] };
    const outbound = graphData.edges.filter((e) => e.source === selectedNode.id);
    const inbound = graphData.edges.filter((e) => e.target === selectedNode.id);
    return { inbound, outbound };
  }, [selectedNode, graphData]);

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Sidebar />

      <div className="flex flex-1 flex-col ml-64 min-w-0">
        <Topbar user={currentUser} />

        <main className="flex-1 flex flex-col p-6 max-w-7xl mx-auto w-full space-y-4">
          {/* Header & Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-purple via-indigo-500 to-brand-coral text-white shadow-lg shadow-brand-purple/20">
                  <Network className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-base font-bold text-white tracking-tight">Clinical Knowledge Graph</h1>
                    <span className="rounded-full bg-brand-purple/20 px-2 py-0.5 text-[10px] font-bold text-brand-lavender border border-brand-purple/30">
                      Phase 8 Graph Engine
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Interactive multi-modal entity network mapping Patients, Diagnoses (ICD-10), Medications, and Biomarkers.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Patient Cohort Selector */}
              <select
                value={selectedCohort}
                onChange={(e) => setSelectedCohort(e.target.value)}
                className="h-8 rounded-lg border border-white/10 bg-slate-900 px-3 text-xs text-slate-200 focus:outline-none focus:border-brand-purple"
              >
                <option value="global">Global Hospital Graph (All Patients)</option>
                <option value="c1a2b3c4-d5e6-4a1b-8c2d-3e4f5a6b7001">Evelyn Carter (Oncology / MRN-902-18)</option>
                <option value="b2c3d4e5-f6a7-4b2c-9d3e-4f5a6b7c8002">Marcus Chen (Genomics / MRN-334-09)</option>
                <option value="ed1a2a90-bb7e-4ce3-aa0d-504c3a9a0001">Emily Johnson (Cardiology / PAT-2026-00001)</option>
              </select>

              {/* Sync Graph Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={syncing}
                className="h-8 text-xs text-slate-300 border-white/10 bg-slate-900 hover:bg-slate-800"
              >
                {syncing ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin text-brand-coral" />
                ) : (
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5 text-brand-lavender" />
                )}
                {syncing ? 'Syncing...' : 'Sync Graph'}
              </Button>
            </div>
          </div>

          {/* Filter Bar & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/60 border border-white/[0.06] backdrop-blur-md">
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1">
                <Filter className="h-3 w-3 text-brand-coral" /> Filter:
              </span>
              {[
                { type: 'patient', label: 'Patients', count: graphData?.stats?.node_types?.patient || 0, color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
                { type: 'condition', label: 'Diagnoses', count: graphData?.stats?.node_types?.condition || 0, color: 'bg-red-500/20 text-red-300 border-red-500/30' },
                { type: 'medication', label: 'Medications', count: graphData?.stats?.node_types?.medication || 0, color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
                { type: 'lab', label: 'Lab Biomarkers', count: graphData?.stats?.node_types?.lab || 0, color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
                { type: 'document', label: 'Documents', count: graphData?.stats?.node_types?.document || 0, color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
              ].map((f) => (
                <button
                  key={f.type}
                  onClick={() => toggleFilter(f.type)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                    activeFilters[f.type]
                      ? `${f.color} shadow-sm`
                      : 'bg-slate-950/60 border-white/5 text-slate-500 opacity-60'
                  }`}
                >
                  {f.label} ({f.count})
                </button>
              ))}
            </div>

            {/* Search Input & Zoom */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-56">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search graph entity..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 rounded-lg border border-white/10 bg-slate-950 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-brand-purple"
                />
              </div>

              <div className="flex items-center gap-1 border border-white/10 rounded-lg p-0.5 bg-slate-950">
                <button
                  onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))}
                  className="p-1 text-slate-400 hover:text-white rounded"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <span className="text-[10px] font-mono text-slate-400 px-1">{(zoom * 100).toFixed(0)}%</span>
                <button
                  onClick={() => setZoom((z) => Math.min(1.8, z + 0.15))}
                  className="p-1 text-slate-400 hover:text-white rounded"
                  title="Zoom In"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setZoom(1)}
                  className="p-1 text-slate-400 hover:text-white rounded"
                  title="Reset Zoom"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Main Workspace: Graph Canvas + Inspection Drawer */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
            {/* Left 8/9 Columns: SVG Interactive Graph Canvas */}
            <div className="lg:col-span-8 xl:col-span-9 rounded-2xl border border-white/[0.08] bg-slate-950/80 relative overflow-hidden flex items-center justify-center min-h-[520px] shadow-2xl">
              {loading ? (
                <div className="flex flex-col items-center gap-3 text-slate-400">
                  <Loader2 className="h-8 w-8 animate-spin text-brand-coral" />
                  <span className="text-xs">Computing entity-relationship force vectors...</span>
                </div>
              ) : (
                <svg
                  viewBox="0 0 850 550"
                  className="w-full h-full cursor-grab active:cursor-grabbing transition-transform duration-200"
                  style={{ transform: `scale(${zoom})` }}
                >
                  <defs>
                    <marker
                      id="arrow"
                      viewBox="0 0 10 10"
                      refX="18"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" opacity="0.6" />
                    </marker>
                    <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  {/* Edges */}
                  <g className="edges">
                    {layout.visibleEdges.map((e) => {
                      const source = posMap[e.source];
                      const target = posMap[e.target];
                      if (!source || !target) return null;

                      const isHighlighted =
                        selectedNode && (selectedNode.id === e.source || selectedNode.id === e.target);

                      return (
                        <g key={e.id}>
                          <line
                            x1={source.x}
                            y1={source.y}
                            x2={target.x}
                            y2={target.y}
                            stroke={isHighlighted ? '#fb923c' : '#334155'}
                            strokeWidth={isHighlighted ? 2.2 : 1.2}
                            strokeDasharray={e.type === 'MANAGED_BY' ? '4 3' : 'none'}
                            opacity={selectedNode && !isHighlighted ? 0.2 : 0.75}
                            markerEnd="url(#arrow)"
                          />
                          {/* Edge Label on Midpoint */}
                          <text
                            x={(source.x + target.x) / 2}
                            y={(source.y + target.y) / 2 - 3}
                            fill={isHighlighted ? '#fdba74' : '#64748b'}
                            fontSize="8"
                            textAnchor="middle"
                            className="select-none font-mono"
                            opacity={selectedNode && !isHighlighted ? 0.2 : 0.8}
                          >
                            {e.label}
                          </text>
                        </g>
                      );
                    })}
                  </g>

                  {/* Nodes */}
                  <g className="nodes">
                    {layout.nodesWithPos.map((n) => {
                      const isSelected = selectedNode?.id === n.id;
                      const conf = NODE_COLORS[n.type] || NODE_COLORS.condition;
                      const radius = n.type === 'patient' ? 22 : n.type === 'condition' ? 18 : 15;

                      return (
                        <g
                          key={n.id}
                          transform={`translate(${n.x}, ${n.y})`}
                          onClick={() => setSelectedNode(n)}
                          className="cursor-pointer group"
                        >
                          {isSelected && (
                            <circle
                              r={radius + 8}
                              fill="none"
                              stroke={conf.border}
                              strokeWidth="2"
                              strokeDasharray="4 2"
                              className="animate-spin"
                            />
                          )}

                          <circle
                            r={radius}
                            fill={conf.bg}
                            stroke={isSelected ? '#ffffff' : conf.border}
                            strokeWidth={isSelected ? 3 : 1.5}
                            className="transition-all duration-200 group-hover:scale-110 shadow-lg"
                            opacity={selectedNode && !isSelected && !connectedInfo.outbound.some(e => e.target === n.id) && !connectedInfo.inbound.some(e => e.source === n.id) ? 0.3 : 1}
                          />

                          {/* Node Icon / Initial */}
                          <text
                            y="4"
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize={n.type === 'patient' ? '12' : '10'}
                            fontWeight="bold"
                            className="pointer-events-none select-none"
                          >
                            {n.type === 'patient' ? 'P' : n.type === 'condition' ? 'Dx' : n.type === 'medication' ? 'Rx' : n.type === 'lab' ? 'Lab' : 'Doc'}
                          </text>

                          {/* Node Label underneath */}
                          <text
                            y={radius + 12}
                            textAnchor="middle"
                            fill="#e2e8f0"
                            fontSize="9"
                            fontWeight="500"
                            className="pointer-events-none select-none drop-shadow-md"
                          >
                            {n.label.length > 20 ? `${n.label.slice(0, 18)}...` : n.label}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                </svg>
              )}

              {/* Watermark overlay */}
              <div className="absolute bottom-3 left-3 text-[10px] text-slate-500 font-mono bg-slate-900/80 px-2 py-1 rounded-md border border-white/5">
                Nodes: {layout.nodesWithPos.length} | Edges: {layout.visibleEdges.length} | Density: {((layout.visibleEdges.length / Math.max(layout.nodesWithPos.length, 1)) * 100).toFixed(0)}%
              </div>
            </div>

            {/* Right 4/3 Columns: Node Inspector Drawer */}
            <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-4">
              {selectedNode ? (
                <Card className="border-brand-purple/30 bg-slate-900/90 shadow-2xl backdrop-blur-xl h-full flex flex-col justify-between">
                  <CardHeader className="border-b border-white/[0.08] pb-3">
                    <div className="flex items-center justify-between">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase border ${NODE_COLORS[selectedNode.type]?.light} ${NODE_COLORS[selectedNode.type]?.text} border-current/30`}>
                        {selectedNode.type}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedNode(null)}
                        className="h-6 px-1.5 text-xs text-slate-400 hover:text-white"
                      >
                        &times;
                      </Button>
                    </div>
                    <CardTitle className="text-sm font-bold text-white pt-1.5 leading-snug">
                      {selectedNode.label}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-3 flex-1 overflow-y-auto text-xs">
                    {/* Properties Map */}
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        Entity Metadata
                      </div>
                      <div className="rounded-xl bg-slate-950/80 p-3 border border-white/[0.05] space-y-1.5 font-mono text-[11px]">
                        {Object.entries(selectedNode.properties || {}).map(([k, v]) => (
                          <div key={k} className="flex justify-between items-start gap-2">
                            <span className="text-slate-500 uppercase text-[10px]">{k}:</span>
                            <span className="text-slate-200 text-right truncate max-w-[150px]">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Outbound Relationships */}
                    {connectedInfo.outbound.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          Outbound Links ({connectedInfo.outbound.length})
                        </div>
                        <div className="space-y-1">
                          {connectedInfo.outbound.map((e) => {
                            const target = posMap[e.target];
                            return (
                              <div
                                key={e.id}
                                onClick={() => target && setSelectedNode(target)}
                                className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-white/5 hover:border-brand-purple/40 cursor-pointer transition-colors"
                              >
                                <span className="text-[10px] text-brand-coral font-medium">{e.label} &rarr;</span>
                                <span className="text-[11px] text-slate-200 truncate font-semibold">{target?.label || e.target}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Inbound Relationships */}
                    {connectedInfo.inbound.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          Inbound Links ({connectedInfo.inbound.length})
                        </div>
                        <div className="space-y-1">
                          {connectedInfo.inbound.map((e) => {
                            const source = posMap[e.source];
                            return (
                              <div
                                key={e.id}
                                onClick={() => source && setSelectedNode(source)}
                                className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-white/5 hover:border-brand-purple/40 cursor-pointer transition-colors"
                              >
                                <span className="text-[10px] text-brand-lavender font-medium">&larr; {e.label}</span>
                                <span className="text-[11px] text-slate-200 truncate font-semibold">{source?.label || e.source}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-white/[0.08] bg-slate-900/60 h-full flex flex-col justify-center items-center text-center p-6 text-slate-400">
                  <Info className="h-8 w-8 text-brand-lavender mb-2 opacity-80" />
                  <h3 className="text-xs font-bold text-white mb-1">Entity Inspection Drawer</h3>
                  <p className="text-[11px] text-slate-400 max-w-[200px] leading-relaxed">
                    Click any patient, diagnosis, drug, or lab node on the canvas to inspect its relationships and clinical metadata.
                  </p>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
