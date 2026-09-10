import React, { useState, useEffect } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { currentUser } from '../services/mockData';
import {
  Network,
  Search,
  Filter,
  Users,
  Activity,
  Pill,
  Heart,
  FlaskConical,
  RotateCcw,
  Sparkles,
  Info,
  Maximize2,
  ZoomIn,
  ZoomOut,
  X,
  ExternalLink,
} from 'lucide-react';

const INITIAL_NODES = [
  // Patients
  { id: 'p1', label: 'Emily Johnson', type: 'patient', subtitle: 'PAT-2026-00001', x: 450, y: 260, color: '#A78BFA' },
  { id: 'p2', label: 'Rajesh Kumar', type: 'patient', subtitle: 'PAT-2026-00002', x: 220, y: 380, color: '#A78BFA' },

  // Diagnoses
  { id: 'd1', label: 'Essential Hypertension', type: 'diagnosis', subtitle: 'ICD-10: I10', x: 620, y: 160, color: '#E8634B' },
  { id: 'd2', label: 'Angina Pectoris', type: 'diagnosis', subtitle: 'ICD-10: I20.9', x: 650, y: 320, color: '#E8634B' },
  { id: 'd3', label: 'Type 2 Diabetes', type: 'diagnosis', subtitle: 'ICD-10: E11.9', x: 120, y: 480, color: '#E8634B' },

  // Medications
  { id: 'm1', label: 'Amlodipine', type: 'medication', subtitle: '5mg Oral Daily', x: 800, y: 120, color: '#34D399' },
  { id: 'm2', label: 'Metoprolol', type: 'medication', subtitle: '25mg Twice Daily', x: 820, y: 260, color: '#34D399' },
  { id: 'm3', label: 'Metformin', type: 'medication', subtitle: '500mg Oral BD', x: 80, y: 360, color: '#34D399' },

  // Symptoms
  { id: 's1', label: 'Exertional Chest Pain', type: 'symptom', subtitle: 'Onset: Intermittent', x: 480, y: 420, color: '#FB7185' },
  { id: 's2', label: 'Palpitations', type: 'symptom', subtitle: 'Past 2 months', x: 320, y: 150, color: '#FB7185' },

  // Biomarkers / Labs
  { id: 'b1', label: 'Blood Pressure: 138/88', type: 'biomarker', subtitle: 'Stage 1 High', x: 500, y: 80, color: '#F59E0B' },
  { id: 'b2', label: 'Heart Rate: 78 bpm', type: 'biomarker', subtitle: 'Normal Sinus', x: 260, y: 260, color: '#F59E0B' },
  { id: 'b3', label: 'HbA1c: 7.2%', type: 'biomarker', subtitle: 'Elevated Glycemia', x: 180, y: 550, color: '#F59E0B' },
];

const INITIAL_EDGES = [
  { source: 'p1', target: 'd1', label: 'DIAGNOSED_WITH' },
  { source: 'p1', target: 'd2', label: 'DIAGNOSED_WITH' },
  { source: 'd1', target: 'm1', label: 'TREATED_BY' },
  { source: 'd2', target: 'm2', label: 'TREATED_BY' },
  { source: 'p1', target: 's1', label: 'PRESENTS' },
  { source: 'p1', target: 's2', label: 'PRESENTS' },
  { source: 'p1', target: 'b1', label: 'MEASUREMENT' },
  { source: 'p1', target: 'b2', label: 'MEASUREMENT' },

  { source: 'p2', target: 'd3', label: 'DIAGNOSED_WITH' },
  { source: 'd3', target: 'm3', label: 'TREATED_BY' },
  { source: 'p2', target: 'b3', label: 'MEASUREMENT' },
];

export default function KnowledgeGraphPage() {
  const [nodes, setNodes] = useState(INITIAL_NODES);
  const [edges, setEdges] = useState(INITIAL_EDGES);
  const [selectedNode, setSelectedNode] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomLevel, setZoomLevel] = useState(1);

  const nodeTypes = [
    { key: 'all', label: 'All Entities', icon: Network, count: nodes.length },
    { key: 'patient', label: 'Patients', icon: Users, color: '#A78BFA' },
    { key: 'diagnosis', label: 'Diagnoses', icon: Activity, color: '#E8634B' },
    { key: 'medication', label: 'Medications', icon: Pill, color: '#34D399' },
    { key: 'symptom', label: 'Symptoms', icon: Heart, color: '#FB7185' },
    { key: 'biomarker', label: 'Labs / Biomarkers', icon: FlaskConical, color: '#F59E0B' },
  ];

  const filteredNodes = nodes.filter((n) => {
    const matchesType = filterType === 'all' || n.type === filterType;
    const matchesSearch =
      !searchQuery ||
      n.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const visibleNodeIds = new Set(filteredNodes.map((n) => n.id));
  const visibleEdges = edges.filter(
    (e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)
  );

  return (
    <div className="flex min-h-screen bg-brand-surface font-sans text-slate-900">
      <Sidebar />

      <div className="flex flex-1 flex-col ml-60 min-w-0">
        <Topbar breadcrumb="CLINORA / KNOWLEDGE GRAPH" title="Clinical Entity Knowledge Graph" />

        <main className="flex-1 p-8 flex flex-col gap-4 max-w-[1700px] mx-auto w-full">
          {/* Top Control Bar */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-3 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">Interactive Knowledge Graph</h1>
                <Badge variant="default" className="text-[10px]">
                  Neo4j Graph Schema
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Multi-modal relationship graph linking Patients, Diagnoses, Medications, Biomarkers, and Symptoms.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {nodeTypes.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setFilterType(t.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors shadow-xs ${
                    filterType === t.key
                      ? 'bg-brand-purple text-white border-brand-purple'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: t.color || '#3B2C58' }}
                  />
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Graph Viewport + Detail Drawer */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
            {/* Graph Visualizer Panel */}
            <div className="lg:col-span-9 min-h-[620px] flex flex-col relative overflow-hidden bg-white rounded-xl border border-slate-200 shadow-sm">
              {/* Top Search & Controls Overlay */}
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search node or code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-brand-purple w-48 shadow-xs"
                  />
                </div>
              </div>

              {/* Zoom Controls Overlay */}
              <div className="absolute top-4 right-4 z-10 flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-xs">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-slate-600 hover:text-slate-900"
                  onClick={() => setZoomLevel((prev) => Math.min(prev + 0.15, 1.8))}
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </Button>
                <span className="text-[10px] font-mono text-slate-600 px-1">
                  {(zoomLevel * 100).toFixed(0)}%
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-slate-600 hover:text-slate-900"
                  onClick={() => setZoomLevel((prev) => Math.max(prev - 0.15, 0.6))}
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-slate-600 hover:text-slate-900"
                  onClick={() => {
                    setZoomLevel(1);
                    setFilterType('all');
                    setSearchQuery('');
                  }}
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </div>

              {/* SVG Force Layout Canvas */}
              <div className="flex-1 w-full h-full min-h-[580px] flex items-center justify-center overflow-auto p-6 cursor-grab active:cursor-grabbing bg-slate-50/50">
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 950 650"
                  className="w-full h-full"
                  style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center' }}
                >
                  <defs>
                    <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3B2C58" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#7C5CBF" stopOpacity="0.3" />
                    </linearGradient>
                  </defs>

                  {/* Graph Edges */}
                  {visibleEdges.map((edge, idx) => {
                    const sourceNode = nodes.find((n) => n.id === edge.source);
                    const targetNode = nodes.find((n) => n.id === edge.target);
                    if (!sourceNode || !targetNode) return null;

                    const midX = (sourceNode.x + targetNode.x) / 2;
                    const midY = (sourceNode.y + targetNode.y) / 2;

                    return (
                      <g key={idx} className="transition-opacity duration-200">
                        <line
                          x1={sourceNode.x}
                          y1={sourceNode.y}
                          x2={targetNode.x}
                          y2={targetNode.y}
                          stroke="#CBD5E1"
                          strokeWidth="2"
                          strokeDasharray="4 2"
                        />
                        <rect
                          x={midX - 35}
                          y={midY - 8}
                          width="70"
                          height="16"
                          rx="4"
                          fill="#FFFFFF"
                          stroke="#E2E8F0"
                        />
                        <text
                          x={midX}
                          y={midY + 3}
                          textAnchor="middle"
                          fill="#475569"
                          fontSize="8"
                          fontFamily="sans-serif"
                          fontWeight="700"
                        >
                          {edge.label}
                        </text>
                      </g>
                    );
                  })}

                  {/* Graph Nodes */}
                  {filteredNodes.map((node) => {
                    const isSelected = selectedNode?.id === node.id;

                    return (
                      <g
                        key={node.id}
                        transform={`translate(${node.x}, ${node.y})`}
                        onClick={() => setSelectedNode(node)}
                        className="cursor-pointer transition-all duration-150 group"
                      >
                        {/* Glow halo */}
                        <circle
                          r={isSelected ? '32' : '26'}
                          fill={node.color}
                          fillOpacity={isSelected ? '0.2' : '0.08'}
                          stroke={node.color}
                          strokeWidth={isSelected ? '2.5' : '1.5'}
                          className="transition-all"
                        />
                        {/* Core Circle */}
                        <circle
                          r="16"
                          fill="#FFFFFF"
                          stroke={node.color}
                          strokeWidth="2"
                        />
                        {/* Icon/Letter */}
                        <text
                          textAnchor="middle"
                          y="4"
                          fill={node.color}
                          fontSize="10"
                          fontWeight="bold"
                        >
                          {node.type === 'patient'
                            ? '👤'
                            : node.type === 'diagnosis'
                            ? '🩺'
                            : node.type === 'medication'
                            ? '💊'
                            : node.type === 'symptom'
                            ? '❤️'
                            : '🧪'}
                        </text>
                        {/* Label Pill */}
                        <rect
                          x={-(node.label.length * 3.5 + 10)}
                          y="24"
                          width={node.label.length * 7 + 20}
                          height="18"
                          rx="9"
                          fill="#FFFFFF"
                          stroke={isSelected ? node.color : '#E2E8F0'}
                          className="shadow-sm"
                        />
                        <text
                          textAnchor="middle"
                          y="36"
                          fill="#1E293B"
                          fontSize="9.5"
                          fontWeight="600"
                        >
                          {node.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Right 3 Columns: Selected Node Inspector Drawer */}
            <div className="lg:col-span-3 p-5 flex flex-col justify-between rounded-xl border border-slate-200 bg-white shadow-sm">
              {selectedNode ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: selectedNode.color }}
                      />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        {selectedNode.type} Entity
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-slate-400"
                      onClick={() => setSelectedNode(null)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900">{selectedNode.label}</h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedNode.subtitle}</p>
                  </div>

                  <div className="space-y-2.5 pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Connected Relationships
                    </span>

                    <div className="space-y-1.5 text-xs">
                      {edges
                        .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
                        .map((e, idx) => {
                          const otherId = e.source === selectedNode.id ? e.target : e.source;
                          const otherNode = nodes.find((n) => n.id === otherId);
                          return (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/80"
                            >
                              <span className="text-slate-800 font-medium">{otherNode?.label}</span>
                              <Badge variant="secondary" className="text-[9px] font-mono">
                                {e.label}
                              </Badge>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <div className="h-10 w-10 rounded-full bg-brand-purpleLight flex items-center justify-center text-brand-purple">
                    <Info className="h-5 w-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">Select an Entity Node</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Click on any Patient, Diagnosis, Medication, or Biomarker node to inspect its clinical links.
                  </p>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-400 font-mono flex justify-between">
                <span>Active Nodes: {filteredNodes.length}</span>
                <span>Links: {visibleEdges.length}</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
