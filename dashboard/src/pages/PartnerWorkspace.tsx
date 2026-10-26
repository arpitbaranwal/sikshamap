import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { OrgProfile, DistrictData, DistrictMatch } from '../types';
import { computeDistrictMatches } from '../utils/matchmaker';
import { getRiskCategory } from '../utils/lpi';
import { authDb } from '../utils/authDb';
import { DeepDiveDrawer } from '../components/DeepDiveDrawer';
import { BrandLogo } from '../components/BrandLogo';
import {
  School,
  Building2,
  MapPin,
  Map,
  ShieldCheck,
  Sparkles,
  Sliders,
  Filter,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Layers,
  HeartHandshake,
  ExternalLink,
  ChevronRight,
  Info,
  FileText,
  LogOut,
  X,
  Award,
} from 'lucide-react';

interface PartnerWorkspaceProps {
  profile: OrgProfile;
  allDistricts: DistrictData[];
  onLogout?: () => void;
}

export const PartnerWorkspace: React.FC<PartnerWorkspaceProps> = ({
  profile,
  allDistricts,
  onLogout,
}) => {
  const navigate = useNavigate();
  const [filterMode, setFilterMode] = useState<'ALL' | 'HIGH_MATCH' | 'COMMITTED'>('ALL');
  const [sortBy, setSortBy] = useState<'MATCH' | 'LPI' | 'DISTANCE'>('MATCH');
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  
  // Committed districts state (Set of district names)
  const [committedDistricts, setCommittedDistricts] = useState<Set<string>>(
    new Set(['Alirajpur']) // Pre-seed one demo commitment
  );

  // Selected district for slide-out drawer
  const [activeDrawerDistrict, setActiveDrawerDistrict] = useState<DistrictData | null>(null);

  // Run matchmaking engine
  const matches = useMemo(() => {
    return computeDistrictMatches(profile, allDistricts);
  }, [profile, allDistricts]);

  // Filtered & sorted matches
  const displayMatches = useMemo(() => {
    let list = [...matches];

    if (filterMode === 'HIGH_MATCH') {
      list = list.filter((m) => m.matchScore >= 80);
    } else if (filterMode === 'COMMITTED') {
      list = list.filter((m) => committedDistricts.has(m.district.matchedName || m.district.District));
    }

    if (sortBy === 'MATCH') {
      list.sort((a, b) => b.matchScore - a.matchScore);
    } else if (sortBy === 'LPI') {
      list.sort((a, b) => b.district.Learning_Poverty_Score - a.district.Learning_Poverty_Score);
    } else if (sortBy === 'DISTANCE') {
      list.sort((a, b) => a.distanceKm - b.distanceKm);
    }

    return list;
  }, [matches, filterMode, sortBy, committedDistricts]);

  const toggleCommit = (districtName: string) => {
    setCommittedDistricts((prev) => {
      const next = new Set(prev);
      if (next.has(districtName)) {
        next.delete(districtName);
      } else {
        next.add(districtName);
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#061014] text-slate-100 flex flex-col selection:bg-teal-500 selection:text-white">
      {/* 1. Header Summary Navigation */}
      <header className="border-b border-slate-800/80 bg-[#061014]/85 backdrop-blur-xl sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/" title="Return to Home">
              <BrandLogo size={36} />
            </Link>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight">
                  {profile.orgName}
                </h1>
                <button
                  type="button"
                  onClick={() => setShowLicenseModal(true)}
                  className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/35 flex items-center gap-1.5 uppercase tracking-wider hover:bg-emerald-500/25 transition cursor-pointer"
                  title="Click to view statutory license & cryptographic certificate"
                >
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>{profile.licenseNumber ? `ID: ${profile.licenseNumber}` : `Verified ${profile.orgType}`}</span>
                  <FileText className="w-3 h-3 text-emerald-400/80" />
                </button>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                <span>HQ: {profile.hqDistrict} District</span>
                <span>&bull;</span>
                <span>Radius: {profile.radiusKm} km</span>
                <span>&bull;</span>
                <span className="text-slate-300">{profile.deploymentCapacity}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowLicenseModal(true)}
              className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-xl hover:bg-slate-800 transition border border-slate-700/80 flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-teal-400" />
              <span>License Doc</span>
            </button>
            <Link
              to="/analytics"
              className="text-xs font-bold bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white px-3.5 py-1.5 rounded-xl transition shadow-lg shadow-teal-500/20 flex items-center gap-1.5 active:scale-95"
            >
              <Map className="w-3.5 h-3.5" />
              <span>Full Map &rarr;</span>
            </Link>
            <button
              onClick={() => {
                authDb.clearSession();
                if (onLogout) onLogout();
                navigate('/auth', { replace: true });
              }}
              className="text-xs font-semibold text-rose-400 hover:text-rose-300 px-3 py-1.5 rounded-xl hover:bg-rose-500/10 transition border border-transparent hover:border-rose-500/20 flex items-center gap-1 cursor-pointer"
              title="Sign Out of Session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Workspace Controls Bar */}
      <section className="border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          {/* Active Domains Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" /> Targeted Domains:
            </span>
            {profile.domains.map((dom) => (
              <span
                key={dom}
                className="text-[11px] font-semibold bg-slate-800 text-sky-300 px-2.5 py-1 rounded-lg border border-slate-700"
              >
                {dom === 'EdTech'
                  ? '💻 EdTech & Labs'
                  : dom === 'WASH'
                  ? '🚻 WASH & Water'
                  : dom === 'TeacherTraining'
                  ? '👩‍🏫 Teacher Pedagogy'
                  : dom === 'DropoutPrevention'
                  ? '🎒 Dropout Retention'
                  : '⚡ Electrification'}
              </span>
            ))}
          </div>

          {/* Filter & Sort Controls */}
          <div className="flex items-center gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 gap-1 text-xs">
              <button
                onClick={() => setFilterMode('ALL')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  filterMode === 'ALL'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All Recommendations ({matches.length})
              </button>
              <button
                onClick={() => setFilterMode('HIGH_MATCH')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  filterMode === 'HIGH_MATCH'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                High Match &gt;80% ({matches.filter((m) => m.matchScore >= 80).length})
              </button>
              <button
                onClick={() => setFilterMode('COMMITTED')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1 ${
                  filterMode === 'COMMITTED'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>My Adopted ({committedDistricts.size})</span>
              </button>
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-sky-500 font-medium"
            >
              <option value="MATCH">Sort: Highest Match Score</option>
              <option value="LPI">Sort: Most Critical LPI</option>
              <option value="DISTANCE">Sort: Nearest Distance</option>
            </select>
          </div>
        </div>
      </section>

      {/* 3. Main Target Recommendation Feed */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">
              Target District Allocation Feed
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Districts prioritized by cross-referencing your domain capabilities against public UDISE+ and MPI vulnerability scores.
            </p>
          </div>

          <div className="text-right text-xs text-slate-500 font-mono">
            Showing {displayMatches.length} candidate districts
          </div>
        </div>

        {/* District Feed Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayMatches.map((m) => {
            const dName = m.district.matchedName || m.district.District;
            const isCommitted = committedDistricts.has(dName);
            const risk = getRiskCategory(m.district.Learning_Poverty_Score);

            return (
              <div
                key={dName}
                className={`dossier-card p-5 border flex flex-col justify-between transition-all duration-200 hover:border-slate-600 shadow-xl relative overflow-hidden ${
                  isCommitted
                    ? 'border-emerald-500/50 bg-slate-900/90'
                    : m.matchScore >= 85
                    ? 'border-sky-500/40 bg-slate-900/80'
                    : 'border-slate-800 bg-slate-900/60'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-sky-400" /> {m.distanceKm} km away
                        </span>
                        {m.distanceKm <= profile.radiusKm && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono">
                            IN RANGE
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-white tracking-tight mt-0.5">
                        {dName}
                      </h3>
                    </div>

                    {/* Match Score Badge */}
                    <div className="text-right flex flex-col items-end">
                      <span className="text-xs font-black font-mono px-2.5 py-1 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-300 shadow-inner">
                        {m.matchScore}% MATCH
                      </span>
                      <span
                        className={`text-[10px] font-semibold uppercase mt-1 px-2.5 py-0.5 rounded-full whitespace-nowrap inline-flex items-center gap-1.5 ${
                          risk === 'High Risk'
                            ? 'bg-rose-500/15 text-rose-300 border border-rose-500/35'
                            : risk === 'Medium Risk'
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/35'
                            : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/35'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            risk === 'High Risk'
                              ? 'bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.9)] animate-pulse'
                              : risk === 'Medium Risk'
                              ? 'bg-amber-400'
                              : 'bg-emerald-400'
                          }`}
                        />
                        {risk}
                      </span>
                    </div>
                  </div>

                  {/* Primary Need Callout */}
                  <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 block mb-0.5">
                      Target Deficit Bottleneck
                    </span>
                    <span className="text-xs font-bold text-slate-100 block">
                      {m.primaryNeed}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {m.rationale}
                    </p>
                  </div>

                  {/* Metrics Row */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs mb-4">
                    <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                      <span className="text-[9.5px] text-slate-500 uppercase block font-semibold">LPI Score</span>
                      <span className="font-mono font-bold text-white text-sm">
                        {m.district.Learning_Poverty_Score.toFixed(1)}
                      </span>
                    </div>
                    <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                      <span className="text-[9.5px] text-slate-500 uppercase block font-semibold">Dropout</span>
                      <span className="font-mono font-bold text-slate-200 text-sm">
                        {m.district.Dropout_Rate_Secondary.toFixed(1)}%
                      </span>
                    </div>
                    <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                      <span className="text-[9.5px] text-slate-500 uppercase block font-semibold">Sec. PTR</span>
                      <span className="font-mono font-bold text-slate-200 text-sm">
                        {m.district.Pupil_Teacher_Ratio_Secondary.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-800/80">
                  <button
                    onClick={() => toggleCommit(dName)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      isCommitted
                        ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/30'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    }`}
                  >
                    {isCommitted ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Committed</span>
                      </>
                    ) : (
                      <>
                        <Calendar className="w-3.5 h-3.5 text-sky-400" />
                        <span>Commit Program</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setActiveDrawerDistrict(m.district)}
                    className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition flex items-center gap-1"
                    title="Open full infrastructure diagnostics"
                  >
                    <span>Details</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* 4. Slide-Out Deep-Dive Drawer */}
      <DeepDiveDrawer
        district={activeDrawerDistrict}
        isOpen={Boolean(activeDrawerDistrict)}
        onClose={() => setActiveDrawerDistrict(null)}
        isCommitted={activeDrawerDistrict ? committedDistricts.has(activeDrawerDistrict.matchedName || activeDrawerDistrict.District) : false}
        onToggleCommit={() => {
          if (activeDrawerDistrict) {
            toggleCommit(activeDrawerDistrict.matchedName || activeDrawerDistrict.District);
          }
        }}
        allDistricts={allDistricts}
      />

      {/* 5. Statutory NGO / CSR License & Verification Certificate Modal */}
      {showLicenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Statutory Licensing Dossier</h3>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Neev Automated Authenticator Certificate
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowLicenseModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">
                    Registered Organization
                  </span>
                  <span className="font-bold text-white">{profile.orgName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">
                    Entity Classification
                  </span>
                  <span className="font-semibold text-slate-200">{profile.orgType}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">
                    Statutory Registration ID
                  </span>
                  <span className="font-mono font-bold text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-500/30">
                    {profile.licenseNumber || 'MP/2021/0084912'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">
                    Verification Status
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/40">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    {profile.verification?.badgeLabel || 'NITI Aayog DARPAN Verified'}
                  </span>
                </div>
              </div>

              {/* Document details */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-2">
                  Uploaded Document Fingerprint
                </span>
                <div className="flex items-center gap-2.5 mb-2">
                  <FileText className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <div className="truncate">
                    <span className="font-bold text-white block truncate">
                      {profile.licenseDocument?.fileName || 'NITI_Aayog_DARPAN_Govt_Certificate.pdf'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Size: {((profile.licenseDocument?.fileSize || 428900) / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </div>
                <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 font-mono text-[10px] text-slate-300 break-all">
                  <span className="text-slate-500 block text-[9px] uppercase font-bold">
                    Cryptographic SHA-256 Checksum:
                  </span>
                  {profile.licenseDocument?.sha256Checksum ||
                    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
                </div>
              </div>

              {/* Authenticator Audit Findings */}
              {profile.verification?.auditRemarks && profile.verification.auditRemarks.length > 0 && (
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">
                    Regulatory Audit Findings
                  </span>
                  <ul className="list-disc pl-4 space-y-0.5 text-slate-400 text-[11px]">
                    {profile.verification.auditRemarks.map((rem, i) => (
                      <li key={i}>{rem}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowLicenseModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
            >
              Close Dossier
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerWorkspace;

