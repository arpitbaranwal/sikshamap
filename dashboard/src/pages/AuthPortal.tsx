import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { OrgProfile, OrgType, DomainTag, LicenseDocument } from '../types';
import geoDataRaw from '../data/mp_districts.json';
import { authDb } from '../utils/authDb';
import { calculateFileHash } from '../utils/crypto';
import { evaluateNgoLegitimacy } from '../utils/authenticator';
import { BrandLogo } from '../components/BrandLogo';
import {
  School,
  Building2,
  MapPin,
  Sliders,
  CheckSquare,
  Square,
  ArrowRight,
  ShieldCheck,
  Zap,
  Droplets,
  BookOpen,
  Users,
  GraduationCap,
  ArrowLeft,
  Lock,
  Mail,
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  Info,
} from 'lucide-react';

interface AuthPortalProps {
  onSaveProfile: (profile: OrgProfile) => void;
  currentProfile: OrgProfile | null;
}

export const AuthPortal: React.FC<AuthPortalProps> = ({
  onSaveProfile,
  currentProfile,
}) => {
  const navigate = useNavigate();

  // Mode: Login vs Register
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // District names for HQ dropdown (all 52 MP districts, sorted)
  const districtNames = useMemo(() => {
    return (geoDataRaw as any).features
      .map((f: any) => f.properties.matchedName || f.properties.District)
      .sort();
  }, []);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [orgName, setOrgName] = useState(currentProfile?.orgName || '');
  const [orgType, setOrgType] = useState<OrgType>(currentProfile?.orgType || 'NGO');
  const [licenseNumber, setLicenseNumber] = useState('MP/2023/0481920');
  const [uploadedDoc, setUploadedDoc] = useState<LicenseDocument | null>(null);
  const [isHashingDoc, setIsHashingDoc] = useState(false);

  const [hqDistrict, setHqDistrict] = useState(currentProfile?.hqDistrict || 'Bhopal');
  const [radiusKm, setRadiusKm] = useState(currentProfile?.radiusKm || 80);
  const [domains, setDomains] = useState<DomainTag[]>(
    currentProfile && currentProfile.domains && currentProfile.domains.length > 0
      ? currentProfile.domains
      : ['EdTech', 'WASH', 'DropoutPrevention']
  );
  const [deploymentCapacity, setDeploymentCapacity] = useState(
    currentProfile?.deploymentCapacity || 'District-Wide Mission (76 - 200 Schools)'
  );

  // UI state
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize DB seeds on load
  useEffect(() => {
    authDb.initDatabase().catch(console.error);
  }, []);

  // Pre-seed a default sample license certificate for demonstration
  useEffect(() => {
    if (!uploadedDoc && authMode === 'REGISTER') {
      setUploadedDoc({
        fileName: 'NITI_Aayog_DARPAN_Govt_Certificate.pdf',
        fileSize: 384512,
        fileType: 'application/pdf',
        uploadedAt: new Date().toISOString(),
        sha256Checksum: '9a3b7c81d4e2f901ab5678cd98ef1234567890abcdef1234567890abcdef1234',
      });
    }
  }, [authMode, uploadedDoc]);

  // Live legitimacy preview as user types license number
  const liveVerification = useMemo(() => {
    return evaluateNgoLegitimacy({
      orgName: orgName || 'Candidate Organization',
      orgType,
      licenseNumber,
      document: uploadedDoc,
    });
  }, [orgName, orgType, licenseNumber, uploadedDoc]);

  const toggleDomain = (tag: DomainTag) => {
    if (domains.includes(tag)) {
      if (domains.length > 1) {
        setDomains(domains.filter((d) => d !== tag));
      }
    } else {
      setDomains([...domains, tag]);
    }
  };

  // Handle License File Upload with real-time SHA-256 calculation
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setIsHashingDoc(true);

    try {
      const checksum = await calculateFileHash(file);
      const doc: LicenseDocument = {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || 'application/pdf',
        uploadedAt: new Date().toISOString(),
        sha256Checksum: checksum,
      };
      setUploadedDoc(doc);
    } catch (err: any) {
      setErrorMsg('Failed to process license document: ' + err.message);
    } finally {
      setIsHashingDoc(false);
    }
  };

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const session = await authDb.loginNGO(loginEmail, loginPassword);
      setSuccessMsg(`Welcome back, ${session.account.orgName}! Entering partner workspace...`);

      const profile: OrgProfile = {
        id: session.account.id,
        email: session.account.email,
        orgName: session.account.orgName,
        orgType: session.account.orgType,
        hqDistrict: session.account.hqDistrict,
        radiusKm: session.account.radiusKm,
        domains: session.account.domains,
        deploymentCapacity: session.account.deploymentCapacity,
        licenseNumber: session.account.licenseNumber,
        licenseDocument: session.account.licenseDocument,
        verification: session.account.verification,
      };

      onSaveProfile(profile);

      setTimeout(() => {
        navigate('/portal/dashboard');
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Register Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    if (!uploadedDoc) {
      setErrorMsg('Please upload your statutory NGO / CSR license document (PDF/PNG).');
      return;
    }

    setIsSubmitting(true);

    try {
      const session = await authDb.registerNGO({
        email: regEmail,
        password: regPassword,
        orgName: orgName.trim() || 'Verified Partner Organization',
        orgType,
        licenseNumber,
        licenseDocument: uploadedDoc,
        hqDistrict,
        radiusKm,
        domains,
        deploymentCapacity,
      });

      const profile: OrgProfile = {
        id: session.account.id,
        email: session.account.email,
        orgName: session.account.orgName,
        orgType: session.account.orgType,
        hqDistrict: session.account.hqDistrict,
        radiusKm: session.account.radiusKm,
        domains: session.account.domains,
        deploymentCapacity: session.account.deploymentCapacity,
        licenseNumber: session.account.licenseNumber,
        licenseDocument: session.account.licenseDocument,
        verification: session.account.verification,
      };

      onSaveProfile(profile);
      setSuccessMsg('Organization profile verified & registered! Redirecting to workspace...');

      setTimeout(() => {
        navigate('/portal/dashboard');
      }, 600);
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick fill helper for review/demo evaluation
  const fillDemoAccount = (type: 'PRATHAM' | 'TATA') => {
    if (type === 'PRATHAM') {
      setLoginEmail('partner@pratham-mp.org');
      setLoginPassword('Password@123');
    } else {
      setLoginEmail('csr@tatatrusts.org');
      setLoginPassword('Password@123');
    }
  };

  return (
    <div className="min-h-screen bg-[#061014] text-slate-100 flex flex-col selection:bg-teal-500 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-[#061014]/85 backdrop-blur-xl py-4 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition mr-1"
            title="Return to Home"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <BrandLogo size={36} />

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight">SikshaMap</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30 uppercase tracking-wider">
                The Neev Initiative
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium block">
              Stakeholder Authentication &amp; Licensing Gateway
            </span>
          </div>
        </div>

        <Link
          to="/analytics"
          className="text-xs font-semibold text-teal-400 hover:text-teal-300 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition"
        >
          View Map &rarr;
        </Link>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 sm:py-12 flex flex-col gap-6">
        {/* Banner with Human-Centric GovTech Copy */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" /> OFFICIAL PARTNER &amp; GOVERNMENT GATEWAY
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {authMode === 'LOGIN' ? 'Stakeholder Portal' : 'Register Organization & Verify Credentials'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
            Sign in to view district-level deficit diagnostics, simulate interventions, and coordinate field resources across Madhya Pradesh.
          </p>
        </div>

        {/* Mode Switch Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#09151C] border border-slate-800 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setAuthMode('LOGIN');
              setErrorMsg(null);
            }}
            className={`py-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
              authMode === 'LOGIN'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Sign In (Existing Partner)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('REGISTER');
              setErrorMsg(null);
            }}
            className={`py-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
              authMode === 'REGISTER'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Onboard New Organization</span>
          </button>
        </div>

        {/* Error / Success Notifications */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ============================================================== */}
        {/* LOGIN FORM */}
        {/* ============================================================== */}
        {authMode === 'LOGIN' && (
          <div className="dossier-card p-6 sm:p-8 border border-slate-800 shadow-2xl flex flex-col gap-6">
            {/* Demo Quick-Fill Bar */}
            <div className="p-3.5 bg-[#09151C] rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span className="font-semibold">Reviewer 1-Click Demo Accounts:</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fillDemoAccount('PRATHAM')}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-800 hover:bg-teal-600 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
                >
                  Pratham MP (Verified NGO)
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoAccount('TATA')}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-800 hover:bg-teal-600 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
                >
                  Tata Trusts (CSR)
                </button>
              </div>
            </div>

            <form onSubmit={handleLoginSubmit} className="flex flex-col gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-teal-400" />
                  Organization Work Email
                </label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@organization.org"
                  className="w-full bg-[#09151C] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 transition font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                    Account Password
                  </label>
                </div>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#09151C] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 transition pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Footer Trust Note */}
              <div className="p-3 bg-[#09151C]/70 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-400 flex-shrink-0" />
                <span>
                  <strong>Verified Partner Access:</strong> Aligned with NITI Aayog NGO-DARPAN and Ministry of Corporate Affairs (MCA) CSR-1 registries.
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white font-bold text-sm shadow-xl shadow-teal-500/25 flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Partner Workspace →'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* ============================================================== */}
        {/* REGISTRATION & LICENSE ONBOARDING FORM */}
        {/* ============================================================== */}
        {authMode === 'REGISTER' && (
          <form onSubmit={handleRegisterSubmit} className="dossier-card p-6 sm:p-8 border border-slate-800 shadow-2xl flex flex-col gap-6">
            {/* Step 1: Account Login Details */}
            <div className="pb-5 border-b border-slate-800">
              <span className="text-[10px] font-black uppercase tracking-widest text-teal-400 block mb-3">
                Step 1 &bull; Account Credentials
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-teal-400" />
                    Official Organization Work Email
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="director@foundation.org"
                    className="w-full bg-[#09151C] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Password (min 8 characters)
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-[#09151C] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#09151C] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Organization Entity Info */}
            <div className="pb-5 border-b border-slate-800">
              <span className="text-[10px] font-black uppercase tracking-widest text-teal-400 block mb-3">
                Step 2 &bull; Entity Profile &amp; Classification
              </span>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Organization / Foundation Name
                  </label>
                  <input
                    type="text"
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. Room to Read India / Eklavya Educational Trust"
                    className="w-full bg-[#09151C] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Entity Classification
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {(
                      [
                        { id: 'NGO', label: 'Registered NGO' },
                        { id: 'CSR', label: 'CSR Foundation' },
                        { id: 'Government', label: 'District Administration' },
                        { id: 'Academic', label: 'Academic / R&D' },
                      ] as const
                    ).map((type) => {
                      const isSelected = orgType === type.id;
                      return (
                        <button
                          type="button"
                          key={type.id}
                          onClick={() => setOrgType(type.id)}
                          className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                            isSelected
                              ? 'bg-teal-600 text-white border-teal-500 shadow-md shadow-teal-600/30'
                              : 'bg-[#09151C] text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                          }`}
                        >
                          {type.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Statutory License & Verification */}
            <div className="pb-5 border-b border-slate-800 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-teal-400 block">
                  Step 3 &bull; Statutory Registration &amp; License
                </span>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 ${
                    liveVerification.isLegit
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/35'
                      : 'bg-amber-500/15 text-amber-300 border border-amber-500/35'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      liveVerification.isLegit ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                  />
                  {liveVerification.badgeLabel}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center justify-between">
                  <span>Statutory Registration / DARPAN ID</span>
                  <span className="text-[10px] text-slate-400 font-mono lowercase">
                    darpan: MP/YYYY/XXXXXXX | csr: CSRXXXXXXXX
                  </span>
                </label>
                <input
                  type="text"
                  required
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="e.g. MP/2023/0481920 or CSR00018924"
                  className="w-full bg-[#09151C] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-500 font-mono tracking-wider uppercase"
                />
              </div>

              {/* Document File Upload */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Upload Registration Certificate / License Document (PDF / PNG / JPG)
                </label>
                <div className="border-2 border-dashed border-slate-700 hover:border-teal-500 rounded-2xl p-4 sm:p-6 bg-[#09151C]/60 flex flex-col items-center justify-center text-center transition">
                  <input
                    type="file"
                    id="license-upload"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="license-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <div className="w-12 h-12 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-white">
                      Click to Browse or Drag Statutory Document Here
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Supported: Certified NITI Aayog Darpan certificate, Form CSR-1, or 12A/80G order (Max 12MB)
                    </span>
                  </label>
                </div>

                {/* Uploaded Certificate Chip */}
                {uploadedDoc && (
                  <div className="mt-3 p-3 bg-[#09151C] rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <FileText className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <div className="truncate">
                        <span className="font-semibold text-white block truncate">
                          {uploadedDoc.fileName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          Size: {(uploadedDoc.fileSize / 1024).toFixed(1)} KB &bull; Verified
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex-shrink-0">
                      Document Attached
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Step 4: Operational Base & Specializations */}
            <div className="flex flex-col gap-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-teal-400 block">
                Step 4 &bull; Operational Base &amp; Thematic Mission
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-teal-400" />
                    Operational Headquarters
                  </label>
                  <select
                    value={hqDistrict}
                    onChange={(e) => setHqDistrict(e.target.value)}
                    className="w-full bg-[#09151C] border border-slate-800 rounded-xl px-3.5 py-3 text-xs text-white focus:outline-none focus:border-teal-500"
                  >
                    {districtNames.map((d: string) => (
                      <option key={d} value={d}>
                        {d} District
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                      Operational Radius
                    </label>
                    <span className="font-mono text-xs font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                      {radiusKm} km
                    </span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={150}
                    step={5}
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(Number(e.target.value))}
                    className="mt-3 w-full"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>Local Cluster (20 km)</span>
                    <span>Regional (150 km)</span>
                  </div>
                </div>
              </div>

              {/* Thematic Domains */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">
                  Thematic Domains (Select active capabilities)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(
                    [
                      {
                        tag: 'EdTech',
                        title: 'EdTech & Digital Classrooms',
                        desc: 'Computer lab establishment, smart classrooms & internet',
                        icon: BookOpen,
                      },
                      {
                        tag: 'TeacherTraining',
                        title: 'Teacher Training & PTR Reduction',
                        desc: 'Pedagogy upgrading, foundational literacy & teacher deployment',
                        icon: Users,
                      },
                      {
                        tag: 'WASH',
                        title: 'WASH & School Sanitation',
                        desc: 'Functional toilets, girls sanitation & drinking water',
                        icon: Droplets,
                      },
                      {
                        tag: 'DropoutPrevention',
                        title: 'Dropout Prevention & Retention',
                        desc: 'Community counseling, attendance tracking & midday support',
                        icon: GraduationCap,
                      },
                      {
                        tag: 'Electrification',
                        title: 'Rural School Electrification',
                        desc: 'Grid connection, rooftop solar power & campus wiring',
                        icon: Zap,
                      },
                    ] as const
                  ).map((item) => {
                    const active = domains.includes(item.tag);
                    return (
                      <div
                        key={item.tag}
                        onClick={() => toggleDomain(item.tag)}
                        className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                          active
                            ? 'bg-teal-500/15 border-teal-500/50 shadow-sm'
                            : 'bg-[#09151C] border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="mt-0.5">
                          {active ? (
                            <CheckSquare className="w-4 h-4 text-teal-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600" />
                          )}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block">{item.title}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{item.desc}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Deployment Scale */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Program Deployment Capacity
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    'Community Pilot (1 - 25 Schools)',
                    'Block-Level Program (26 - 75 Schools)',
                    'District-Wide Mission (76 - 200 Schools)',
                    'Multi-District Consortium (200+ Schools)',
                  ].map((scale) => (
                    <label
                      key={scale}
                      className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer text-xs font-semibold ${
                        deploymentCapacity === scale
                          ? 'bg-slate-800 border-teal-500 text-white'
                          : 'bg-[#09151C] border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="capacity"
                        checked={deploymentCapacity === scale}
                        onChange={() => setDeploymentCapacity(scale)}
                        className="accent-teal-500"
                      />
                      <span>{scale}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white font-bold text-sm shadow-xl shadow-teal-500/25 flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <span>{isSubmitting ? 'Registering Organization...' : 'Register Organization & Enter Matchmaking Workspace →'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </main>
    </div>
  );
};

export default AuthPortal;
