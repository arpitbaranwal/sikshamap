import React, { useState, useMemo, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import geoDataRaw from './data/mp_districts.json';
import { GeoJsonData, DistrictData, OrgProfile } from './types';
import { authDb } from './utils/authDb';

// Pages
import { LandingPage } from './pages/LandingPage';
import { AnalyticsMap } from './pages/AnalyticsMap';
import { AuthPortal } from './pages/AuthPortal';
import { PartnerWorkspace } from './pages/PartnerWorkspace';

const DEFAULT_PROFILE: OrgProfile = {
  orgName: 'Pratham Madhya Pradesh Foundation',
  orgType: 'NGO',
  hqDistrict: 'Bhopal',
  radiusKm: 85,
  domains: ['EdTech', 'WASH', 'DropoutPrevention'],
  deploymentCapacity: 'District-Wide Mission (76 - 200 Schools)',
  licenseNumber: 'MP/2021/0084912',
  licenseDocument: {
    fileName: 'NITI_Aayog_DARPAN_MP_Pratham_2021.pdf',
    fileSize: 428900,
    fileType: 'application/pdf',
    uploadedAt: '2026-01-15T09:30:00.000Z',
    sha256Checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  },
  verification: {
    isLegit: true,
    status: 'VERIFIED',
    badgeLabel: 'NITI Aayog DARPAN Verified',
    verificationDate: '2026-01-15T09:30:00.000Z',
    registryAuthority: 'NITI Aayog NGO-DARPAN Registry',
    auditRemarks: [
      'Active NITI Aayog NGO-DARPAN verification matching State of Madhya Pradesh operations.',
      'Cryptographic Document Hash verified: SHA-256 (e3b0c44298fc...)',
    ],
    darpanVerified: true,
    riskScore: 10,
  },
};

function ProtectedRoute({
  profile,
  children,
}: {
  profile: OrgProfile | null;
  children: React.ReactElement;
}) {
  const session = authDb.getCurrentSession();
  if (!session || !profile) {
    return <Navigate to="/auth" replace />;
  }
  return children;
}

export const App: React.FC = () => {
  const geoData = geoDataRaw as unknown as GeoJsonData;

  const districts: DistrictData[] = useMemo(() => {
    return geoData.features.map((f) => f.properties as DistrictData);
  }, [geoData]);

  // Profile persistence in localStorage / state (only active if valid session exists)
  const [orgProfile, setOrgProfile] = useState<OrgProfile | null>(() => {
    try {
      const session = authDb.getCurrentSession();
      if (!session) return null;
      const saved = localStorage.getItem('neev_partner_profile');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return null;
  });

  const handleSaveProfile = (profile: OrgProfile) => {
    setOrgProfile(profile);
    try {
      localStorage.setItem('neev_partner_profile', JSON.stringify(profile));
    } catch (e) {
      // ignore
    }
  };

  const handleLogout = () => {
    authDb.clearSession();
    setOrgProfile(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* 1. Public Landing / Hero Page */}
        <Route path="/" element={<LandingPage />} />

        {/* 2. Isolated Geospatial Vector Map Engine */}
        <Route path="/analytics" element={<AnalyticsMap />} />

        {/* 3. Restricted Stakeholder Authentication & Onboarding */}
        <Route
          path="/auth"
          element={
            <AuthPortal
              onSaveProfile={handleSaveProfile}
              currentProfile={orgProfile}
            />
          }
        />

        {/* 4. Dedicated Partner Workspace & Matchmaking Feed (Protected) */}
        <Route
          path="/portal/dashboard"
          element={
            <ProtectedRoute profile={orgProfile}>
              <PartnerWorkspace
                profile={orgProfile!}
                allDistricts={districts}
                onLogout={handleLogout}
              />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
