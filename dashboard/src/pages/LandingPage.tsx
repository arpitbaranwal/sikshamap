import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BrandLogo } from '../components/BrandLogo';
import geoDataRaw from '../data/mp_districts.json';
import { getRiskCategory } from '../utils/lpi';
import {
  MapPin,
  ShieldAlert,
  Layers,
  ArrowRight,
  Database,
  Cpu,
  Map,
  Users2,
  Sparkles,
  ExternalLink,
  CheckCircle,
  Building2,
  HeartHandshake,
  BarChart3,
  ShieldCheck,
  Zap,
} from 'lucide-react';

// Lightweight count-up hook
function useCountUp(target: number, durationMs = 800) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    let startTime = performance.now();
    let frameId: number;

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(target * ease));

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

export const LandingPage: React.FC = () => {
  // Dynamically compute exact counts from the single shared dataset
  const districts = (geoDataRaw as any).features;
  const totalCount = districts.length; // 52
  const highRiskCount = districts.filter(
    (f: any) => getRiskCategory(f.properties.Learning_Poverty_Score) === 'High Risk'
  ).length; // 12

  const animatedTotal = useCountUp(totalCount, 800);
  const animatedHigh = useCountUp(highRiskCount, 800);

  return (
    <div className="min-h-screen flex flex-col bg-[#061014] text-slate-100 selection:bg-teal-500 selection:text-white relative">
      {/* 1. Global Navigation Bar */}
      <nav className="border-b border-slate-800/80 bg-[#061014]/85 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo size={38} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black tracking-tight text-white">
                  SikshaMap
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30 uppercase tracking-wider">
                  The Neev Initiative
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block font-medium">
                Predictive GeoAI &amp; Foundational Literacy Decision-Support System
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              to="/auth"
              className="text-xs font-bold text-slate-300 hover:text-white px-3.5 py-2 rounded-xl hover:bg-slate-800/80 transition flex items-center gap-1.5 border border-transparent hover:border-slate-700"
            >
              <HeartHandshake className="w-4 h-4 text-teal-400" />
              <span>Partner Portal</span>
            </Link>
            <Link
              to="/analytics"
              className="text-xs font-bold bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white px-4 py-2 rounded-xl transition shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 flex items-center gap-1.5 active:scale-95"
            >
              <Map className="w-4 h-4" />
              <span>Launch Map &rarr;</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* 2. Hero Section with Atmospheric Ambient Glow & Topo Contours */}
      <header className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-28 border-b border-slate-800/80 topo-contour-bg">
        {/* Radial ambient glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] pointer-events-none blur-3xl opacity-80"
          style={{
            background: 'radial-gradient(circle, rgba(20, 184, 166, 0.15) 0%, rgba(8, 145, 178, 0.08) 50%, transparent 75%)',
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center flex flex-col items-center">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#09151C] border border-slate-700/80 text-xs font-semibold text-teal-300 mb-6 shadow-md">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span>Madhya Pradesh Foundational Literacy Mission</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight max-w-4xl leading-[1.15]">
            Eliminating Learning Poverty with{' '}
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage: 'linear-gradient(135deg, #2DD4BF 0%, #38BDF8 50%, #F59E0B 100%)',
              }}
            >
              Predictive GeoAI
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mt-5 leading-relaxed font-normal">
            Moving away from passive, retrospective government reporting toward an active decision-support system. We map educational risk zones across all 52 districts of Madhya Pradesh and algorithmically match ground deficits with verified NGO interventions.
          </p>

          {/* Dual Portal Gateways (Dual CTAs) */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
            <Link
              to="/analytics"
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-bold text-sm shadow-xl shadow-teal-500/25 hover:shadow-teal-500/40 hover:-translate-y-0.5 flex items-center gap-2.5 transition-all active:scale-95"
            >
              <Map className="w-4 h-4" />
              <span>Launch Geospatial Map</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/auth"
              className="px-6 py-3.5 rounded-xl bg-[#09151C]/90 hover:bg-slate-800 text-slate-200 hover:text-white font-bold text-sm border border-slate-700 hover:border-slate-600 transition flex items-center gap-2.5 shadow-lg active:scale-95"
            >
              <Building2 className="w-4 h-4 text-teal-400" />
              <span>Partner / Official Portal &rarr;</span>
            </Link>
          </div>

          {/* Dynamic Macro Metrics Strip (3 Synchronized KPI Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl w-full mt-14 text-left">
            <div className="dossier-card dossier-card-hover p-5 border border-slate-700/60 shadow-xl">
              <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider block">
                Coverage
              </span>
              <div className="text-3xl font-black text-white mt-1 font-mono">
                {animatedTotal} <span className="text-sm font-normal text-slate-400">Districts</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                100% Statewide GIS vector choropleth monitoring.
              </p>
            </div>

            <div className="dossier-card dossier-card-hover p-5 border border-slate-700/60 shadow-xl">
              <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block">
                Risk Stratification
              </span>
              <div className="text-3xl font-black text-rose-400 mt-1 font-mono">
                {animatedHigh} <span className="text-sm font-normal text-slate-400">High Risk</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Triage priorities requiring immediate capital deployment.
              </p>
            </div>

            <div className="dossier-card dossier-card-hover p-5 border border-slate-700/60 shadow-xl">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                Evidence Provenance
              </span>
              <div className="text-xl font-black text-white mt-1 font-mono tracking-tight">
                4-Tier GeoAI Architecture
              </div>
              <p className="text-xs text-slate-400 mt-1 font-mono text-[11px]">
                UDISE+ &bull; NITI MPI &bull; NFHS-5
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* 3. 4-Tier Pipeline Architecture Feature Showcase */}
      <section className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" /> Grounded In Reality
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            How SikshaMap Works
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-3 leading-relaxed">
            The Neev Initiative&apos;s closed-loop, data-to-intervention architecture designed for district collectors, state education directorates, and CSR partners.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Tier 1 */}
          <div className="dossier-card dossier-card-hover p-6 border border-slate-700/60 shadow-xl flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-4">
                <Database className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-teal-400 block mb-1">
                Tier 01
              </span>
              <h3 className="text-base font-bold text-white tracking-tight">
                Data Ingestion
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Ingests longitudinal datasets from UDISE+ (2023-24), NITI Aayog Multi-Dimensional Poverty Index (MPI), and Census baselines.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-800/80 mt-4 text-[11px] text-slate-400 font-mono">
              &bull; 52 Districts &bull; 14 Indicators
            </div>
          </div>

          {/* Tier 2 */}
          <div className="dossier-card dossier-card-hover p-6 border border-slate-700/60 shadow-xl flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4">
                <Cpu className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 block mb-1">
                Tier 02
              </span>
              <h3 className="text-base font-bold text-white tracking-tight">
                Unified LPI Engine
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Computes unified Learning Poverty Index (LPI) scores factoring in foundational literacy, secondary dropout, secondary PTR, and physical utility gaps.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-800/80 mt-4 text-[11px] text-slate-400 font-mono">
              &bull; 4 Core Pillars &bull; Empirical Weights
            </div>
          </div>

          {/* Tier 3 */}
          <div className="dossier-card dossier-card-hover p-6 border border-slate-700/60 shadow-xl flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 mb-4">
                <Map className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-sky-400 block mb-1">
                Tier 03
              </span>
              <h3 className="text-base font-bold text-white tracking-tight">
                Choropleth GIS Map
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                High-performance D3 SVG vector engine. Inspect high-contrast risk zones, click district centroids, and review comprehensive policy dossiers.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-800/80 mt-4 text-[11px] text-slate-400 font-mono">
              &bull; Zero Lag &bull; Pan &amp; Zoom
            </div>
          </div>

          {/* Tier 4 */}
          <div className="dossier-card dossier-card-hover p-6 border border-slate-700/60 shadow-xl flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
                <Users2 className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 block mb-1">
                Tier 04
              </span>
              <h3 className="text-base font-bold text-white tracking-tight">
                Resource Matchmaking
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Matches registered NGOs and CSR directors within their defined operational radius based on specific thematic expertise (EdTech, WASH, PTR).
              </p>
            </div>
            <div className="pt-4 border-t border-slate-800/80 mt-4 text-[11px] text-slate-400 font-mono">
              &bull; Distance Radius &bull; Zero Duplication
            </div>
          </div>
        </div>
      </section>

      {/* 4. Footer */}
      <footer className="border-t border-slate-800/80 bg-[#040B0E] py-8 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BrandLogo size={28} />
            <span className="text-slate-400 font-semibold">SikshaMap &bull; The Neev Initiative &copy; 2026</span>
            <span>&bull;</span>
            <span>Open Decision-Support for Foundational Literacy in MP</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <Link to="/analytics" className="hover:text-teal-400 transition">
              Map Analytics
            </Link>
            <span>&bull;</span>
            <Link to="/auth" className="hover:text-teal-400 transition">
              Stakeholder Portal
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
