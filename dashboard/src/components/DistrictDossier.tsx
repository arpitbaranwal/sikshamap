import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DistrictData, RiskCategory } from '../types';
import {
  getRiskCategory,
  getRiskColor,
  QuartileThresholds,
  getDistrictCriticalAreas,
} from '../utils/lpi';
import {
  AlertTriangle,
  Zap,
  Droplets,
  BookOpen,
  Users,
  CheckCircle2,
  Info,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Percent,
  GraduationCap,
  Layers,
  Sparkles,
  HeartHandshake,
  ExternalLink,
  FileText,
  X,
  Sliders,
} from 'lucide-react';

interface DistrictDossierProps {
  district: DistrictData | null;
  allDistricts: DistrictData[];
  quartiles: QuartileThresholds;
  onSelectDistrict: (name: string) => void;
}

// Smooth Number Count-Up Animation (800ms)
function useCountUp(target: number, durationMs = 800): number {
  const [val, setVal] = useState(target);

  useEffect(() => {
    let start = 0;
    const startTime = performance.now();
    let frameId: number;

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      // Ease-out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      setVal(Number((target * ease).toFixed(2)));

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      } else {
        setVal(target);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [target, durationMs]);

  return val;
}

export const DistrictDossier: React.FC<DistrictDossierProps> = ({
  district,
  allDistricts,
  quartiles,
  onSelectDistrict,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'INFRASTRUCTURE'>('OVERVIEW');

  const stateAvgLPI = Number(
    (
      allDistricts.reduce((acc, d) => acc + (d.Learning_Poverty_Score || 0), 0) /
      (allDistricts.length || 1)
    ).toFixed(2)
  );

  const targetLpi = district ? district.Learning_Poverty_Score : stateAvgLPI;
  const animatedLpi = useCountUp(targetLpi, 800);

  // If no district is selected, show State Baseline Dossier
  if (!district) {
    const highRiskDistricts = allDistricts
      .filter((d) => getRiskCategory(d.Learning_Poverty_Score) === 'High Risk')
      .sort((a, b) => b.Learning_Poverty_Score - a.Learning_Poverty_Score);

    return (
      <div className="flex flex-col gap-5">
        <div className="dossier-card p-6 border border-slate-700/60 shadow-xl">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-400 mb-2">
            <Sparkles className="w-4 h-4" /> State Executive Benchmark
          </div>

          <h2 className="text-xl font-bold text-white tracking-tight">
            Madhya Pradesh Learning Poverty Overview
          </h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Click on any district polygon on the vector map or search in the toolbar to inspect its diagnostic dossier.
          </p>

          <div className="grid grid-cols-2 gap-3.5 mt-5">
            <div className="bg-[#09151C]/90 p-4 rounded-xl border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                State Mean LPI
              </span>
              <div className="text-3xl font-black text-teal-400 mt-1 font-mono">
                {animatedLpi.toFixed(2)}
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Normalized index across 52 districts
              </span>
            </div>

            <div className="bg-[#09151C]/90 p-4 rounded-xl border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Critical Deficit Districts
              </span>
              <div className="text-3xl font-black text-rose-400 mt-1 font-mono">
                {highRiskDistricts.length}{' '}
                <span className="text-xs font-normal text-slate-400">/ 52</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                LPI &gt; 50 (High Risk Mandate)
              </span>
            </div>
          </div>
        </div>

        {/* Priority Districts List */}
        <div className="dossier-card p-6 border border-slate-700/60 shadow-xl">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" /> Top Priority Deficit Districts
          </h3>
          <div className="divide-y divide-slate-800/80">
            {highRiskDistricts.slice(0, 5).map((d, idx) => (
              <div
                key={d.District}
                onClick={() => onSelectDistrict(d.District)}
                className="py-2.5 flex items-center justify-between hover:bg-slate-800/40 px-2 rounded-lg cursor-pointer transition"
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold text-slate-500">#{idx + 1}</span>
                  <span className="text-xs font-bold text-white">{d.District}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-rose-400">
                    LPI {d.Learning_Poverty_Score.toFixed(1)}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // District details calculations
  const baseRisk = getRiskCategory(district.Learning_Poverty_Score);
  const deltaFromMean = Number((district.Learning_Poverty_Score - stateAvgLPI).toFixed(2));
  const criticalAreas = getDistrictCriticalAreas(district);

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Header Card with Unified LPI & 2-Tab Interface */}
      <div className="dossier-card p-5 sm:p-6 border border-slate-700/60 shadow-xl">
        {/* District Title & Subhead */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold text-teal-400 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-400" /> GeoAI District Dossier
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
              <span className="text-[11px] text-slate-400 font-medium">Madhya Pradesh</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {district.District}
            </h2>
            <div className="flex items-center gap-2.5 mt-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                  baseRisk === 'High Risk'
                    ? 'bg-rose-500/15 text-rose-300 border border-rose-500/35'
                    : baseRisk === 'Medium Risk'
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/35'
                    : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/35'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    baseRisk === 'High Risk'
                      ? 'bg-rose-500 animate-pulse'
                      : baseRisk === 'Medium Risk'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                />
                {baseRisk} Zone
              </span>
            </div>
          </div>

          {/* Large Unified LPI Score Display */}
          <div className="text-right flex flex-col items-end">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Learning Poverty Index
            </span>
            <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white mt-0.5 flex items-baseline gap-1">
              <span className="text-teal-400">{animatedLpi.toFixed(2)}</span>
              <span className="text-xs text-slate-500 font-normal">/ 100</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-mono mt-1">
              {deltaFromMean >= 0 ? (
                <span className="text-rose-400 font-semibold flex items-center">
                  <TrendingUp className="w-3 h-3 mr-0.5" /> +{deltaFromMean} vs MP Mean
                </span>
              ) : (
                <span className="text-emerald-400 font-semibold flex items-center">
                  <TrendingDown className="w-3 h-3 mr-0.5" /> {deltaFromMean} vs MP Mean
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 2-Tab Bar */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#09151C] border border-slate-800 rounded-xl mt-4">
          <button
            type="button"
            onClick={() => setActiveTab('OVERVIEW')}
            className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
              activeTab === 'OVERVIEW'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Overview &amp; Indicators
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('INFRASTRUCTURE')}
            className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
              activeTab === 'INFRASTRUCTURE'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Infrastructure &amp; Pillars
          </button>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: OVERVIEW */}
        {/* ============================================================== */}
        {activeTab === 'OVERVIEW' && (
          <div className="flex flex-col gap-3 mt-4">
            {/* 2x2 Grid of Core Indicators */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-[#09151C]/90 p-3 rounded-xl border border-slate-800/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Total Literacy Rate
                </span>
                <div className="text-xl font-bold font-mono text-white mt-0.5">
                  {district.Literacy_Rate_Total.toFixed(1)}%
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">
                  State Baseline: 69.3%
                </span>
              </div>

              <div className="bg-[#09151C]/90 p-3 rounded-xl border border-slate-800/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Secondary Dropout
                </span>
                <div className="text-xl font-bold font-mono text-white mt-0.5">
                  {district.Dropout_Rate_Secondary.toFixed(1)}%
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">
                  Primary: {district.Dropout_Rate_Primary.toFixed(1)}%
                </span>
              </div>

              <div className="bg-[#09151C]/90 p-3 rounded-xl border border-slate-800/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Pupil-Teacher (PTR)
                </span>
                <div className="text-xl font-bold font-mono text-white mt-0.5">
                  {district.Pupil_Teacher_Ratio_Secondary.toFixed(1)}:1
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">
                  Statutory Limit: 30:1
                </span>
              </div>

              <div className="bg-[#09151C]/90 p-3 rounded-xl border border-slate-800/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  MPI Poverty Index
                </span>
                <div className="text-xl font-bold font-mono text-white mt-0.5">
                  {district.MPI_Poverty_Index.toFixed(1)}%
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">
                  NITI Deprivation
                </span>
              </div>
            </div>

            {/* Diagnostic Summary Note */}
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed text-slate-300 text-[11.5px]">
                <strong>Diagnostic Note:</strong> {district.District} is classified under the{' '}
                <span className="text-white font-semibold">{baseRisk} cohort</span> with an empirical LPI score of{' '}
                <span className="font-mono text-teal-300 font-bold">{district.Learning_Poverty_Score.toFixed(2)}</span>.
                {criticalAreas.length > 0
                  ? ' Review utility saturation in the Infrastructure tab, or inspect the prioritized critical areas in the window below.'
                  : ' All core educational and infrastructure metrics meet or exceed MP state benchmarks.'}
              </p>
            </div>

            {/* Jump to Critical Areas Window Shortcut - Only shown when critical areas exist */}
            {criticalAreas.length > 0 ? (
              <button
                type="button"
                onClick={() => document.getElementById('critical-areas-window')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/35 text-rose-300 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 shadow-sm"
              >
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Inspect {criticalAreas.length} Critical Areas in Window Below &darr;</span>
              </button>
            ) : (
              <div className="w-full py-2.5 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>All Core Indicators Optimal &bull; No Critical Deficits</span>
              </div>
            )}

            {/* Direct Gateway to Partner Portal */}
            <Link
              to="/auth"
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white font-bold text-xs shadow-md shadow-teal-500/20 flex items-center justify-center gap-2 transition active:scale-95"
            >
              <span>Coordinate Field Action in Partner Portal &rarr;</span>
            </Link>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: INFRASTRUCTURE & PILLARS */}
        {/* ============================================================== */}
        {activeTab === 'INFRASTRUCTURE' && (
          <div className="flex flex-col gap-3 mt-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Campus Utility Saturation &amp; Deficits
            </span>

            {[
              {
                label: 'Electricity Saturation',
                val: district.Percent_Schools_Electricity,
                icon: Zap,
                category: 'School Utilities & WASH',
              },
              {
                label: 'Drinking Water Saturation',
                val: district.Percent_Schools_Drinking_Water,
                icon: Droplets,
                category: 'School Utilities & WASH',
              },
              {
                label: 'Functional Toilets (WASH)',
                val: district.Percent_Schools_Toilets,
                icon: Users,
                category: 'School Utilities & WASH',
              },
              {
                label: 'Computer Lab Infrastructure',
                val: district.Percent_Schools_Computer_Lab,
                icon: BookOpen,
                category: 'Digital Lab & Internet',
              },
              {
                label: 'School Internet Connectivity',
                val: district.Percent_Schools_Internet,
                icon: Percent,
                category: 'Digital Lab & Internet',
              },
              {
                label: 'Trained & Certified Teachers',
                val: district.Percent_Trained_Teachers,
                icon: GraduationCap,
                category: 'Teacher Availability & PTR',
              },
            ].map((item) => {
              const isCritical = item.val < 55;
              const isTarget = item.val >= 80;
              const barColor = isCritical ? '#be123c' : isTarget ? '#0f766e' : '#b45309';

              return (
                <div key={item.label} className="bg-[#09151C]/90 p-2.5 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-200 font-semibold flex items-center gap-1.5">
                      <item.icon className="w-3.5 h-3.5 text-teal-400" />
                      {item.label}
                    </span>
                    <span className="font-mono font-bold text-white">
                      {item.val.toFixed(1)}%
                    </span>
                  </div>

                  <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full rounded-full progress-bar-fill"
                      style={{
                        width: `${Math.min(100, Math.max(3, item.val))}%`,
                        backgroundColor: barColor,
                      }}
                    />
                  </div>
                </div>
              );
            })}

            {/* Direct Gateway to Partner Portal */}
            <Link
              to="/auth"
              className="mt-0.5 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white font-bold text-xs shadow-md shadow-teal-500/20 flex items-center justify-center gap-2 transition active:scale-95"
            >
              <span>Coordinate Field Action in Partner Portal &rarr;</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default DistrictDossier;
