import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';

export default function PatientProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Timeline');

  const timelineEvents = [
    {
      date: 'Oct 24, 2026',
      title: 'Lab Order',
      desc: 'Genomic Sequencing Panel requested by Dr. Vance. DNA Mutation Targets check.',
    },
    {
      date: 'Oct 12, 2026',
      title: 'Encounter',
      desc: 'Follow-up outpatient clinical consult. Noted moderate fatigue post cycle 2.',
    },
    {
      date: 'Sep 28, 2026',
      title: 'Diagnosis',
      desc: 'Stage IIIA invasive lobular breast carcinoma diagnosed via left core biopsy.',
    },
    {
      date: 'Sep 15, 2026',
      title: 'Biopsy',
      desc: 'Core needle biopsy performed at Vanderbilt Outpatient Pathology.',
    },
    {
      date: 'Sep 02, 2026',
      title: 'Lab Order',
      desc: 'Hematology & metabolic blood chemistry panels completed.',
    },
  ];

  return (
    <div className="flex min-h-screen bg-brand-surface font-sans text-slate-900">
      <Sidebar />

      <div className="flex flex-1 flex-col ml-60 min-w-0">
        <Topbar
          breadcrumb="CLINORA / PATIENT DIRECTORY / EVELYN CARTER"
          title="Patient Dashboard: Evelyn Carter"
        />

        <main className="flex-1 space-y-6 p-8">
          {/* Patient Overview Header Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Left Patient Demographics */}
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full overflow-hidden border-2 border-slate-200 shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150"
                    alt="Evelyn Carter"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>

                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-slate-900">Evelyn Carter</h2>
                    <span className="rounded-full bg-emerald-50 px-3 py-0.5 text-xs font-semibold text-emerald-700">
                      Under Active Treatment
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                    <span>MRN: <strong className="text-slate-800">902-18</strong></span>
                    <span>DOB: <strong className="text-slate-800">11/24/1962 (63 yrs)</strong></span>
                    <span>Gender: <strong className="text-slate-800">Female</strong></span>
                  </div>
                </div>
              </div>

              {/* Right Provider Info */}
              <div className="text-left md:text-right text-xs text-slate-500 space-y-1">
                <p>Primary Physician: <strong className="text-slate-800">Dr. Sarah Vance</strong></p>
                <p>Facility: <strong className="text-slate-800">Vanderbilt Medical Center</strong></p>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-slate-200">
            <nav className="flex space-x-8 text-xs font-semibold">
              {['Overview', 'Timeline', 'Diagnoses', 'Medications', 'Lab Results', 'Documents'].map(
                (tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-3 transition-colors ${
                      activeTab === tab
                        ? 'border-b-2 border-brand-purple text-brand-purple font-bold'
                        : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    {tab}
                  </button>
                )
              )}
            </nav>
          </div>

          {/* Main 2-Column Content Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left 8 Cols: Clinical Timeline Events */}
            <div className="lg:col-span-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-6">
                Clinical Timeline Events
              </h3>

              <div className="space-y-6">
                {timelineEvents.map((event, idx) => (
                  <div key={idx} className="flex gap-6">
                    {/* Date Column */}
                    <div className="w-24 text-[11px] font-semibold text-slate-400 shrink-0 pt-0.5">
                      {event.date}
                    </div>

                    {/* Timeline Dot and Line */}
                    <div className="relative flex flex-col items-center">
                      <div className="h-2.5 w-2.5 rounded-full bg-brand-purple ring-4 ring-white shrink-0 z-10" />
                      {idx !== timelineEvents.length - 1 && (
                        <div className="w-0.5 flex-1 bg-slate-200 my-1" />
                      )}
                    </div>

                    {/* Event Description */}
                    <div className="flex-1 pb-4">
                      <h4 className="text-xs font-bold text-slate-900">
                        {event.title}
                      </h4>
                      <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                        {event.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 4 Cols: Active Diagnoses, Medications, Recent Labs */}
            <div className="lg:col-span-4 space-y-4">
              {/* Card 1: ACTIVE DIAGNOSES */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 mb-3">
                  ACTIVE DIAGNOSES
                </h4>
                <ul className="space-y-2 text-xs text-slate-700 font-normal">
                  <li className="flex items-start gap-2">
                    <span className="text-slate-400">•</span>
                    <span>Stage IIIA Invasive Lobular Carcinoma</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-slate-400">•</span>
                    <span>Estrogen Receptor Positive (ER+)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-slate-400">•</span>
                    <span>Progesterone Receptor Positive (PR+)</span>
                  </li>
                </ul>
              </div>

              {/* Card 2: ACTIVE MEDICATIONS */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 mb-3">
                  ACTIVE MEDICATIONS
                </h4>
                <ul className="space-y-2 text-xs text-slate-700 font-normal">
                  <li className="flex items-start gap-2">
                    <span className="text-slate-400">•</span>
                    <span>Letrozole 2.5mg QD</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-slate-400">•</span>
                    <span>Palbociclib 125mg QD (Cycle 2, Day 14)</span>
                  </li>
                </ul>
              </div>

              {/* Card 3: RECENT LABS SUMMARY */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 mb-3">
                  RECENT LABS SUMMARY
                </h4>
                <ul className="space-y-2 text-xs text-slate-700 font-normal">
                  <li className="flex items-start justify-between">
                    <span className="flex items-center gap-2">
                      <span className="text-slate-400">•</span>
                      <span>WBC: 2.8 ×10^3/µL</span>
                    </span>
                    <span className="font-bold text-red-600">Low</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-slate-400">•</span>
                    <span>Hemoglobin: 11.4 g/dL</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-slate-400">•</span>
                    <span>Platelets: 145 ×10^3/µL</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
