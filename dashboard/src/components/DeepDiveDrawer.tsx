import React from 'react';
import { DistrictData } from '../types';
import { getRiskCategory, computeQuartiles, generateAttentionAlerts } from '../utils/lpi';
import {
  X,
  Zap,
  Droplets,
  BookOpen,
  Users,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Percent,
  GraduationCap,
  ShieldCheck,
  Calendar,
} from 'lucide-react';

interface DeepDiveDrawerProps {
  district: DistrictData | null;
  isOpen: boolean;
  onClose: () => void;
  isCommitted: boolean;
  onToggleCommit: () => void;
  allDistricts: DistrictData[];
}

export const DeepDiveDrawer: React.FC<DeepDiveDrawerProps> = ({
  district,
  isOpen,
  onClose,
  isCommitted,
  onToggleCommit,
  allDistricts,
}) => {
  if (!isOpen || !district) return null;

  const quartiles = computeQuartiles(allDistricts);
  const alerts = generateAttentionAlerts(district, quartiles);
  const risk = getRiskCategory(district.Learning_Poverty_Score);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      {/* Drawer Container */}
      <div className="w-full max-w-xl bg-slate-900 border-l border-slate-700/80 shadow-2xl h-full flex flex-col overflow-y-auto z-50 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/80 sticky top-0 z-10 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold text-teal-400 uppercase tracking-widest">
                District Diagnostic Dossier
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
              <span className="text-[11px] text-slate-400 font-medium">Madhya Pradesh</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              {district.District}
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold uppercase ${
                  risk === 'High Risk'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : risk === 'Medium Risk'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    risk === 'High Risk' ? 'bg-rose-500 animate-pulse' : risk === 'Medium Risk' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                />
                {risk} Zone
              </span>
              <span className="text-xs font-mono font-bold text-teal-300 bg-slate-800 px-2.5 py-0.5 rounded-md border border-slate-700">
                LPI: {district.Learning_Poverty_Score.toFixed(2)}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 flex flex-col gap-6">
          {/* Commitment Status CTA Banner */}
          <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
            isCommitted
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
              : 'bg-sky-500/10 border-sky-500/30 text-sky-200'
          }`}>
            <div>
              <span className="text-xs font-bold block">
                {isCommitted ? 'Active Program Commitment Logged' : 'Field Action Opportunity'}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                {isCommitted
                  ? 'Your organization is registered as actively intervening in this district.'
                  : 'Commit your organization to coordinate resources and prevent duplication.'}
              </span>
            </div>
            <button
              onClick={onToggleCommit}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0 ${
                isCommitted
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
                  : 'bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/30'
              }`}
            >
              {isCommitted ? (
                <>
                  <ShieldCheck className="w-4 h-4" /> Committed
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4" /> Commit Program
                </>
              )}
            </button>
          </div>

          {/* Immediate Attention Panel */}
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Diagnostic Bottlenecks (Worst Quartile)
            </h3>
            {alerts.length === 0 ? (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2.5 text-xs text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Indicators meet or exceed state medians.</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {alerts.map((a) => (
                  <div
                    key={a.id}
                    className="p-3.5 rounded-xl border bg-slate-900 border-slate-800 text-xs flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-[11px]">{a.title}</span>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-black/40 text-slate-400 font-mono">
                        {a.type}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300">{a.finding}</p>
                    <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800 text-[10.5px] text-sky-300">
                      <span className="text-sky-400 font-bold">Policy Action: </span>
                      {a.action}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Infrastructure Saturation Progress */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-sky-400" />
                School Utilities Saturation
              </h3>
              <div className="flex items-center gap-3 text-[10px] text-slate-400">
                <span>&lt;60% Deficit</span>
                <span>&bull;</span>
                <span>&gt;80% Target</span>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Electricity Access', val: district.Percent_Schools_Electricity, icon: Zap },
                { label: 'Drinking Water Saturation', val: district.Percent_Schools_Drinking_Water, icon: Droplets },
                { label: 'Functional Toilets', val: district.Percent_Schools_Toilets, icon: Users },
                { label: 'Computer Labs', val: district.Percent_Schools_Computer_Lab, icon: BookOpen },
                { label: 'Internet Connectivity', val: district.Percent_Schools_Internet, icon: Percent },
              ].map((item) => (
                <div key={item.label} className="flex flex-col gap-1 text-xs">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-300 flex items-center gap-1.5 font-medium">
                      <item.icon className="w-3.5 h-3.5 text-slate-400" /> {item.label}
                    </span>
                    <span className="font-mono font-bold text-slate-100">{item.val.toFixed(1)}%</span>
                  </div>
                  <div className="relative w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, item.val)}%`,
                        backgroundColor: item.val < 60 ? '#EF4444' : item.val < 80 ? '#F59E0B' : '#10B981',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Academic & Demographics Grid */}
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-indigo-400" />
              Academic &amp; Socio-Economic Baselines
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Secondary Dropout</span>
                <span className="text-base font-bold font-mono text-white mt-0.5 block">{district.Dropout_Rate_Secondary.toFixed(1)}%</span>
                <span className="text-[10px] text-slate-500">Primary: {district.Dropout_Rate_Primary.toFixed(1)}%</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Secondary PTR</span>
                <span className="text-base font-bold font-mono text-white mt-0.5 block">{district.Pupil_Teacher_Ratio_Secondary.toFixed(1)}:1</span>
                <span className="text-[10px] text-slate-500">Primary: {district.Pupil_Teacher_Ratio_Primary.toFixed(1)}:1</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Literacy Rate</span>
                <span className="text-base font-bold font-mono text-white mt-0.5 block">{district.Literacy_Rate_Total.toFixed(1)}%</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Poverty Index (MPI)</span>
                <span className="text-base font-bold font-mono text-white mt-0.5 block">{district.MPI_Poverty_Index.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

