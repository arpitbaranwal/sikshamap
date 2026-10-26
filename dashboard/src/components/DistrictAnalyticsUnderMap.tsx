import React from 'react';
import { Link } from 'react-router-dom';
import { DistrictData } from '../types';
import { getRiskCategory, getDistrictCriticalAreas, CriticalAreaItem } from '../utils/lpi';
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Target,
  Zap,
  Droplets,
  BookOpen,
  Users,
  GraduationCap,
  Laptop,
  TrendingDown,
  Sparkles,
  MapPin,
  ArrowRight,
  HeartHandshake,
} from 'lucide-react';

interface DistrictAnalyticsUnderMapProps {
  district: DistrictData | null;
  allDistricts: DistrictData[];
  onSelectDistrict?: (name: string) => void;
}

export const DistrictAnalyticsUnderMap: React.FC<DistrictAnalyticsUnderMapProps> = ({
  district,
  allDistricts,
  onSelectDistrict,
}) => {
  // If a district is selected, compute its critical areas
  const criticalAreas = district ? getDistrictCriticalAreas(district) : [];

  // If there are no critical areas requiring urgent intervention, do not render this section
  if (!district || criticalAreas.length === 0) {
    return null;
  }

  // Ranked high-risk districts for quick selection
  const topHighRisk = allDistricts
    .filter((d) => getRiskCategory(d.Learning_Poverty_Score) === 'High Risk')
    .sort((a, b) => b.Learning_Poverty_Score - a.Learning_Poverty_Score)
    .slice(0, 10);

  const renderCriticalIcon = (type: string) => {
    switch (type) {
      case 'comp':
        return <Laptop className="w-4 h-4 text-cyan-400" />;
      case 'elec':
        return <Zap className="w-4 h-4 text-amber-400" />;
      case 'wash':
        return <Droplets className="w-4 h-4 text-sky-400" />;
      case 'dropout':
        return <TrendingDown className="w-4 h-4 text-rose-400" />;
      case 'ptr':
        return <Users className="w-4 h-4 text-orange-400" />;
      case 'literacy':
        return <BookOpen className="w-4 h-4 text-teal-400" />;
      case 'trained':
        return <GraduationCap className="w-4 h-4 text-indigo-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
    }
  };

  const renderRiskBadge = (r: string) => {
    if (r === 'High Risk') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/35 whitespace-nowrap">
          <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)] animate-pulse" />
          High Risk Zone
        </span>
      );
    }
    if (r === 'Medium Risk') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/35 whitespace-nowrap">
          <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.9)]" />
          Medium Risk Zone
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/35 whitespace-nowrap">
        <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
        Low Risk Zone
      </span>
    );
  };

  return (
    <div
      id="critical-areas-window"
      className="dossier-card p-6 sm:p-8 border border-slate-700/60 shadow-2xl w-full flex flex-col gap-6 scroll-mt-20"
    >
      {/* 1. Header Section */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> Critical Intervention Directives
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span>
              {district
                ? `Critical Areas Requiring Urgent Care in ${district.District}`
                : 'District Critical Area Directives'}
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-normal">
            {district
              ? `Automated deficit diagnostics and prioritized field actions for ${district.District} district collectors and partner organizations.`
              : 'Select any district on the vector map above to reveal what critical areas need to be taken care of.'}
          </p>
        </div>

        {district && (
          <div className="flex flex-wrap items-center gap-2.5">
            {renderRiskBadge(getRiskCategory(district.Learning_Poverty_Score))}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#09151C] border border-slate-800 text-xs font-mono">
              <span className="text-slate-400">LPI:</span>
              <span className="text-teal-400 font-bold">{district.Learning_Poverty_Score.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold font-mono">
              <span>{criticalAreas.length} Critical Bottlenecks</span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Main Body: What Are the Critical Areas That Need to Be Taken Care Of */}
      {district ? (
        criticalAreas.length === 0 ? (
          /* Zero-Deficit / Optimal District State */
          <div className="p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white">
              No Critical Infrastructure or Pedagogical Deficits Detected in {district.District}
            </h3>
            <p className="text-xs text-slate-300 max-w-lg leading-relaxed">
              {district.District} operates at or above Madhya Pradesh benchmarks across electricity ({district.Percent_Schools_Electricity.toFixed(1)}%),
              toilets ({district.Percent_Schools_Toilets.toFixed(1)}%), pupil-teacher ratios ({district.Pupil_Teacher_Ratio_Secondary.toFixed(1)}:1),
              and student retention ({district.Dropout_Rate_Secondary.toFixed(1)}% dropout).
            </p>
          </div>
        ) : (
          /* Grid of Critical Areas That Need to Be Taken Care Of */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {criticalAreas.map((item, idx) => (
              <div
                key={item.id}
                className="bg-[#09151C]/90 rounded-2xl border border-slate-800 p-5 flex flex-col justify-between hover:border-slate-700 hover:shadow-xl transition relative group"
              >
                <div>
                  {/* Card Header: Icon + Title + Severity Pill */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center flex-shrink-0">
                        {renderCriticalIcon(item.iconType)}
                      </div>
                      <div>
                        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
                          Priority #{idx + 1} &bull; {item.category}
                        </span>
                        <h4 className="text-sm font-bold text-white leading-snug">
                          {item.name}
                        </h4>
                      </div>
                    </div>

                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0 ${
                        item.severity === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {item.severity}
                    </span>
                  </div>

                  {/* Benchmark & Current Measurement */}
                  <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800/80 flex items-center justify-between text-xs mb-3.5">
                    <div>
                      <span className="text-[10px] text-slate-400 block">District Reality</span>
                      <span className="text-base font-black font-mono text-white">
                        {item.currentVal}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">State Target</span>
                      <span className="text-xs font-mono text-slate-300">
                        {item.benchmarkVal}
                      </span>
                    </div>
                    <div className="text-right pl-2 border-l border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Gap</span>
                      <span
                        className={`text-xs font-mono font-bold ${
                          item.severity === 'CRITICAL' ? 'text-rose-400' : 'text-amber-400'
                        }`}
                      >
                        {item.gapText}
                      </span>
                    </div>
                  </div>

                  {/* Concrete Directive: What Needs Care */}
                  <div className="p-3 rounded-xl bg-teal-500/5 border border-teal-500/20 text-xs text-slate-300 leading-relaxed">
                    <div className="flex items-center gap-1.5 font-bold text-teal-300 mb-1 text-[11px] uppercase tracking-wider">
                      <Target className="w-3.5 h-3.5 text-teal-400" />
                      <span>What Needs Care:</span>
                    </div>
                    <p className="text-[11.5px] text-slate-200">
                      {item.actionRequired}
                    </p>
                  </div>
                </div>

                {/* Footer Tag */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>Mandate: Immediate Action</span>
                  <span className="text-teal-400 font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    Ready for Field Intervention
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Empty State: No District Selected Yet */
        <div className="p-8 rounded-2xl bg-[#09151C]/60 border border-slate-800 flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <MapPin className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              No District Selected
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              Click on any district polygon on the vector map above to reveal its critical areas needing care, or select from the highest vulnerability districts below:
            </p>
          </div>

          {/* Quick-Pick Priority Districts */}
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mt-2">
            {topHighRisk.map((d, idx) => (
              <button
                key={d.District}
                onClick={() => onSelectDistrict && onSelectDistrict(d.District)}
                className="px-3 py-1.5 rounded-xl bg-[#061014] hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
              >
                <span className="text-rose-400 font-mono font-bold">#{idx + 1}</span>
                <span>{d.District}</span>
                <span className="text-[10px] text-slate-500 font-mono font-bold">
                  (LPI {d.Learning_Poverty_Score.toFixed(1)})
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. Bottom Action Bar */}
      {district && (
        <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-400" />
            <span>
              Identified <strong>{criticalAreas.length} critical areas</strong> for field deployment in <strong>{district.District}</strong>.
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/auth"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white font-bold text-xs shadow-md shadow-teal-500/20 flex items-center gap-1.5 transition active:scale-95"
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Coordinate Intervention in Partner Portal &rarr;</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default DistrictAnalyticsUnderMap;
