import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import geoDataRaw from '../data/mp_districts.json';
import { GeoJsonData, DistrictData, RiskCategory } from '../types';
import { MapViewer } from '../components/MapViewer';
import { DistrictDossier } from '../components/DistrictDossier';
import { DistrictAnalyticsUnderMap } from '../components/DistrictAnalyticsUnderMap';
import { BrandLogo } from '../components/BrandLogo';
import { computeQuartiles, getRiskCategory, getDistrictCriticalAreas } from '../utils/lpi';
import {
  Search,
  Filter,
  Download,
  ArrowLeft,
  HeartHandshake,
  X,
  MapPin,
  Sparkles,
} from 'lucide-react';

export const AnalyticsMap: React.FC = () => {
  const geoData = geoDataRaw as unknown as GeoJsonData;

  const districts: DistrictData[] = useMemo(() => {
    return geoData.features.map((f) => f.properties as DistrictData);
  }, [geoData]);

  const quartiles = useMemo(() => computeQuartiles(districts), [districts]);

  // Selected district & filter state
  const [selectedDistrictName, setSelectedDistrictName] = useState<string | null>('Alirajpur');
  const [riskFilter, setRiskFilter] = useState<'ALL' | RiskCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected district object
  const activeDistrict = useMemo(() => {
    if (!selectedDistrictName) return null;
    return (
      districts.find(
        (d) =>
          d.matchedName === selectedDistrictName ||
          d.District === selectedDistrictName ||
          (d as any).district === selectedDistrictName
      ) || null
    );
  }, [districts, selectedDistrictName]);

  // Search filtered options
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return districts
      .filter((d) => (d.matchedName || d.District).toLowerCase().includes(q))
      .slice(0, 6);
  }, [districts, searchQuery]);

  // Statewide counts dynamically computed
  const highRiskCount = districts.filter(
    (d) => getRiskCategory(d.Learning_Poverty_Score) === 'High Risk'
  ).length;
  const medRiskCount = districts.filter(
    (d) => getRiskCategory(d.Learning_Poverty_Score) === 'Medium Risk'
  ).length;
  const lowRiskCount = districts.filter(
    (d) => getRiskCategory(d.Learning_Poverty_Score) === 'Low Risk'
  ).length;

  // CSV Export handler
  const handleExportCSV = () => {
    const headers = [
      'District',
      'Learning_Poverty_Score',
      'Risk_Category',
      'Literacy_Rate_Total',
      'Dropout_Rate_Secondary',
      'Pupil_Teacher_Ratio_Secondary',
      'Percent_Schools_Electricity',
      'Percent_Schools_Toilets',
      'Percent_Schools_Drinking_Water',
      'Percent_Schools_Computer_Lab',
      'MPI_Poverty_Index',
    ];
    const rows = districts.map((d) => [
      d.District,
      d.Learning_Poverty_Score.toFixed(2),
      getRiskCategory(d.Learning_Poverty_Score),
      d.Literacy_Rate_Total.toFixed(1),
      d.Dropout_Rate_Secondary.toFixed(1),
      d.Pupil_Teacher_Ratio_Secondary.toFixed(1),
      d.Percent_Schools_Electricity.toFixed(1),
      d.Percent_Schools_Toilets.toFixed(1),
      d.Percent_Schools_Drinking_Water.toFixed(1),
      d.Percent_Schools_Computer_Lab.toFixed(1),
      d.MPI_Poverty_Index.toFixed(1),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'madhya_pradesh_learning_poverty_atlas.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#061014] text-slate-100 selection:bg-teal-500 selection:text-white">
      {/* 1. Primary Header Navigation */}
      <header className="border-b border-slate-800/80 bg-[#061014]/85 backdrop-blur-xl sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          {/* Logo & Platform Info with Back Button */}
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition mr-1"
              title="Return to Landing Page"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            
            <BrandLogo size={36} />

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white">
                  SikshaMap
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30 uppercase tracking-wider">
                  The Neev Initiative
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Madhya Pradesh District Analytics &amp; Decision-Support Engine
              </p>
            </div>
          </div>

          {/* Statewide Macro Metrics Badges */}
          <div className="hidden lg:flex items-center gap-2.5">
            <div className="flex items-center gap-2 bg-[#09151C] px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400 font-medium">Monitored:</span>
              <span className="font-mono font-bold text-white">52 Districts</span>
            </div>
            <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 px-3 py-1.5 rounded-xl text-xs">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-rose-300 font-bold">{highRiskCount} High Risk</span>
            </div>
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl text-xs">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-amber-300 font-bold">{medRiskCount} Medium</span>
            </div>
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-emerald-300 font-bold">{lowRiskCount} Low Risk</span>
            </div>
          </div>

          {/* Top Right Action Gateways */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportCSV}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition cursor-pointer"
              title="Download District Master Dataset"
            >
              <Download className="w-3.5 h-3.5 text-teal-400" />
              <span>Export CSV</span>
            </button>
            <Link
              to="/auth"
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white shadow-md shadow-teal-500/20 transition active:scale-95"
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Partner Portal &rarr;</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Controls Toolbar: Stratification Filter & Instant District Search */}
      <section className="border-b border-slate-800/80 bg-[#09151C]/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Stratification Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1.5 whitespace-nowrap">
              <Filter className="w-3.5 h-3.5 text-teal-400" /> Filter Risk:
            </span>
            {(['ALL', 'High Risk', 'Medium Risk', 'Low Risk'] as const).map((cat) => {
              const isActive = riskFilter === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setRiskFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                    isActive
                      ? cat === 'High Risk'
                        ? 'bg-rose-500 text-white shadow-sm'
                        : cat === 'Medium Risk'
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                        : cat === 'Low Risk'
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-teal-600 text-white shadow-sm'
                      : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {cat === 'ALL'
                    ? `All (52)`
                    : cat === 'High Risk'
                    ? `High Risk (${highRiskCount})`
                    : cat === 'Medium Risk'
                    ? `Medium (${medRiskCount})`
                    : `Low (${lowRiskCount})`}
                </button>
              );
            })}
          </div>

          {/* District Search Input with Autocomplete */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Jump to district..."
              className="w-full bg-[#09151C] border border-slate-800 rounded-xl pl-9 pr-8 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Dropdown Menu */}
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-[#09151C] border border-slate-700/80 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-800">
                {searchResults.map((d) => (
                  <div
                    key={d.District}
                    onClick={() => {
                      setSelectedDistrictName(d.matchedName || d.District);
                      setSearchQuery('');
                    }}
                    className="px-4 py-2.5 hover:bg-slate-800 cursor-pointer flex items-center justify-between text-xs text-slate-200 transition"
                  >
                    <span className="font-bold text-white">{d.matchedName || d.District}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        getRiskCategory(d.Learning_Poverty_Score) === 'High Risk'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : getRiskCategory(d.Learning_Poverty_Score) === 'Medium Risk'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      LPI {d.Learning_Poverty_Score.toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. Main Workspace: Map & 3-Tab District Decision Dossier */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-8">
        {/* Top Section: Above the Fold 12-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Interactive Vector Choropleth Map (7 cols) */}
          <section className="lg:col-span-7">
            <MapViewer
              geoData={geoData}
              selectedDistrict={selectedDistrictName}
              onSelectDistrict={(name) => setSelectedDistrictName(name)}
              riskFilter={riskFilter}
            />
          </section>

          {/* Right Column: 3-Tab District Decision Dossier (5 cols) */}
          <section className="lg:col-span-5">
            <DistrictDossier
              district={activeDistrict}
              allDistricts={districts}
              quartiles={quartiles}
              onSelectDistrict={(name) => setSelectedDistrictName(name)}
            />
          </section>
        </div>

        {/* Bottom Section: District Critical Areas & Intervention Directives (Only rendered when critical areas exist) */}
        {activeDistrict && getDistrictCriticalAreas(activeDistrict).length > 0 && (
          <section className="w-full">
            <DistrictAnalyticsUnderMap
              district={activeDistrict}
              allDistricts={districts}
              onSelectDistrict={(name) => {
                setSelectedDistrictName(name);
                window.scrollTo({ top: 120, behavior: 'smooth' });
              }}
            />
          </section>
        )}
      </main>

      {/* 4. Footer */}
      <footer className="border-t border-slate-800/80 bg-[#040B0E] py-4 mt-auto text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">SikshaMap</span>
            <span>&bull;</span>
            <span className="text-slate-400 font-medium">The Neev Initiative</span>
            <span>&bull;</span>
            <span>Predictive GeoAI &amp; Foundational Literacy Decision-Support System</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <Link to="/" className="hover:text-slate-300">Home</Link>
            <span>&bull;</span>
            <Link to="/auth" className="hover:text-slate-300">Stakeholder Portal</Link>
            <span>&bull;</span>
            <span>52 Madhya Pradesh Districts</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AnalyticsMap;
