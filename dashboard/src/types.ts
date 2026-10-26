export type RiskCategory = 'High Risk' | 'Medium Risk' | 'Low Risk';

export interface DistrictData {
  District: string;
  State: string;
  Literacy_Rate_Total: number;
  MPI_Poverty_Index: number;
  Wealth_Index_Score: number;
  Percent_Schools_Electricity: number;
  Percent_Schools_Drinking_Water: number;
  Percent_Schools_Toilets: number;
  Percent_Schools_Computer_Lab: number;
  Percent_Schools_Internet: number;
  Pupil_Teacher_Ratio_Primary: number;
  Pupil_Teacher_Ratio_Secondary: number;
  Percent_Trained_Teachers: number;
  Percent_Female_Teachers: number;
  Dropout_Rate_Primary: number;
  Dropout_Rate_Secondary: number;
  Gross_Enrollment_Ratio: number;
  Learning_Poverty_Score: number;
  Baseline_LPI?: number;
  Pillar_Academic?: number;
  Pillar_Pedagogy?: number;
  Pillar_WASH?: number;
  Pillar_Digital?: number;
  Pillar_SocioEconomic?: number;
  matchedName?: string;
}

export interface DistrictFeature {
  type: string;
  properties: DistrictData & { [key: string]: any };
  geometry: any;
}

export interface GeoJsonData {
  type: string;
  features: DistrictFeature[];
}

export type OrgType = 'NGO' | 'CSR' | 'Government' | 'Academic';

export type DomainTag = 
  | 'EdTech'
  | 'TeacherTraining'
  | 'WASH'
  | 'DropoutPrevention'
  | 'Electrification';

export interface LicenseDocument {
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  sha256Checksum: string;
  previewUrl?: string;
}

export interface VerificationResult {
  isLegit: boolean;
  status: 'VERIFIED' | 'FLAGGED' | 'PENDING_AUDIT';
  badgeLabel: string;
  verificationDate: string;
  registryAuthority: string;
  auditRemarks: string[];
  darpanVerified: boolean;
  riskScore: number;
}

export interface OrgProfile {
  id?: string;
  email?: string;
  orgName: string;
  orgType: OrgType;
  hqDistrict: string;
  radiusKm: number;
  domains: DomainTag[];
  deploymentCapacity: string;
  licenseNumber?: string;
  licenseDocument?: LicenseDocument;
  verification?: VerificationResult;
}

export interface StoredNGOAccount {
  id: string;
  email: string;
  orgName: string;
  orgType: OrgType;
  salt: string; // Cryptographic salt in hex
  passwordHash: string; // PBKDF2-SHA256 derived key in hex
  licenseNumber: string;
  licenseDocument: LicenseDocument;
  verification: VerificationResult;
  hqDistrict: string;
  radiusKm: number;
  domains: DomainTag[];
  deploymentCapacity: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface DistrictMatch {
  district: DistrictData;
  matchScore: number; // 0 to 100
  primaryNeed: string;
  rationale: string;
  domainsTargeted: DomainTag[];
  distanceKm: number;
  isCommitted?: boolean;
}
