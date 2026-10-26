import { StoredNGOAccount, OrgProfile, LicenseDocument, OrgType, DomainTag } from '../types';
import { generateSalt, hashPassword, verifyPassword } from './crypto';
import { evaluateNgoLegitimacy } from './authenticator';

const DB_KEY = 'neev_ngo_database_v2';
const SESSION_KEY = 'neev_active_session_v2';

export interface RegistrationParams {
  email: string;
  password: string;
  orgName: string;
  orgType: OrgType;
  licenseNumber: string;
  licenseDocument: LicenseDocument;
  hqDistrict: string;
  radiusKm: number;
  domains: DomainTag[];
  deploymentCapacity: string;
}

export interface AuthSession {
  token: string;
  account: Omit<StoredNGOAccount, 'salt' | 'passwordHash'>;
  expiresAt: string;
}

class AuthDatabaseService {
  private accounts: StoredNGOAccount[] = [];
  private isInitialized = false;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const raw = localStorage.getItem(DB_KEY);
      if (raw) {
        this.accounts = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Failed to parse NGO database from storage', e);
      this.accounts = [];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(this.accounts));
    } catch (e) {
      console.error('Failed to persist NGO database', e);
    }
  }

  /**
   * Initialize default verified organizations with cryptographically hashed passwords
   */
  public async initDatabase(): Promise<void> {
    if (this.isInitialized && this.accounts.length > 0) return;
    this.loadFromStorage();

    if (this.accounts.length === 0) {
      // 1. Seed Demo Account 1: Pratham MP Foundation
      const salt1 = generateSalt();
      const hash1 = await hashPassword('Password@123', salt1);
      const prathamDoc: LicenseDocument = {
        fileName: 'NITI_Aayog_DARPAN_MP_Pratham_2021.pdf',
        fileSize: 428900,
        fileType: 'application/pdf',
        uploadedAt: '2026-01-15T09:30:00.000Z',
        sha256Checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      };
      const prathamVerif = evaluateNgoLegitimacy({
        orgName: 'Pratham Madhya Pradesh Foundation',
        orgType: 'NGO',
        licenseNumber: 'MP/2021/0084912',
        document: prathamDoc,
      });

      // 2. Seed Demo Account 2: Tata Trusts CSR Central India
      const salt2 = generateSalt();
      const hash2 = await hashPassword('Password@123', salt2);
      const tataDoc: LicenseDocument = {
        fileName: 'MCA_CSR1_Registration_TataTrusts.pdf',
        fileSize: 612400,
        fileType: 'application/pdf',
        uploadedAt: '2026-02-10T11:20:00.000Z',
        sha256Checksum: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
      };
      const tataVerif = evaluateNgoLegitimacy({
        orgName: 'Tata Trusts Education CSR Mission',
        orgType: 'CSR',
        licenseNumber: 'CSR00018924',
        document: tataDoc,
      });

      this.accounts = [
        {
          id: 'ngo-seed-pratham-mp',
          email: 'partner@pratham-mp.org',
          orgName: 'Pratham Madhya Pradesh Foundation',
          orgType: 'NGO',
          salt: salt1,
          passwordHash: hash1,
          licenseNumber: 'MP/2021/0084912',
          licenseDocument: prathamDoc,
          verification: prathamVerif,
          hqDistrict: 'Bhopal',
          radiusKm: 85,
          domains: ['EdTech', 'WASH', 'DropoutPrevention'],
          deploymentCapacity: 'District-Wide Mission (76 - 200 Schools)',
          createdAt: '2026-01-15T09:30:00.000Z',
          lastLoginAt: new Date().toISOString(),
        },
        {
          id: 'csr-seed-tata-trusts',
          email: 'csr@tatatrusts.org',
          orgName: 'Tata Trusts Education CSR Mission',
          orgType: 'CSR',
          salt: salt2,
          passwordHash: hash2,
          licenseNumber: 'CSR00018924',
          licenseDocument: tataDoc,
          verification: tataVerif,
          hqDistrict: 'Indore',
          radiusKm: 120,
          domains: ['EdTech', 'TeacherTraining', 'Electrification'],
          deploymentCapacity: 'Multi-District Consortium (200+ Schools)',
          createdAt: '2026-02-10T11:20:00.000Z',
          lastLoginAt: new Date().toISOString(),
        },
      ];

      this.saveToStorage();
    }

    // Ensure pentest account is available even if accounts were previously cached
    if (!this.accounts.some((a) => a.email.toLowerCase() === 'pentest@neev-audit.org')) {
      const salt3 = generateSalt();
      const hash3 = await hashPassword('Pentest@Neev2026!', salt3);
      const pentestDoc: LicenseDocument = {
        fileName: 'Neev_Security_Audit_Pentest_Auth.pdf',
        fileSize: 512000,
        fileType: 'application/pdf',
        uploadedAt: new Date().toISOString(),
        sha256Checksum: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
      };
      const pentestVerif = evaluateNgoLegitimacy({
        orgName: 'Neev RedTeam & Pentesting Security Unit',
        orgType: 'Academic',
        licenseNumber: 'MP/2024/0987654',
        document: pentestDoc,
      });

      this.accounts.push({
        id: 'pentest-seed-account',
        email: 'pentest@neev-audit.org',
        orgName: 'Neev RedTeam & Pentesting Security Unit',
        orgType: 'Academic',
        salt: salt3,
        passwordHash: hash3,
        licenseNumber: 'MP/2024/0987654',
        licenseDocument: pentestDoc,
        verification: pentestVerif,
        hqDistrict: 'Bhopal',
        radiusKm: 150,
        domains: ['EdTech', 'TeacherTraining', 'WASH', 'DropoutPrevention', 'Electrification'],
        deploymentCapacity: 'Multi-District Consortium (200+ Schools)',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      });
      this.saveToStorage();
    }

    this.isInitialized = true;
  }

  /**
   * Register a new NGO with:
   * - PBKDF2 Password Hashing (plain text password is destroyed immediately)
   * - Automated Regulatory Verification
   * - License Document Archival
   */
  public async registerNGO(params: RegistrationParams): Promise<AuthSession> {
    await this.initDatabase();

    const normalizedEmail = params.email.trim().toLowerCase();
    if (this.accounts.some((a) => a.email.toLowerCase() === normalizedEmail)) {
      throw new Error(`An organization account with email "${normalizedEmail}" is already registered.`);
    }

    if (params.password.length < 8) {
      throw new Error('Password must be at least 8 characters long for regulatory compliance.');
    }

    // 1. Evaluate Authenticity
    const verification = evaluateNgoLegitimacy({
      orgName: params.orgName,
      orgType: params.orgType,
      licenseNumber: params.licenseNumber,
      document: params.licenseDocument,
    });

    // 2. Cryptographic Salt & PBKDF2 Hash
    const salt = generateSalt();
    const passwordHash = await hashPassword(params.password, salt);

    const newAccount: StoredNGOAccount = {
      id: `ngo-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      email: normalizedEmail,
      orgName: params.orgName.trim(),
      orgType: params.orgType,
      salt,
      passwordHash,
      licenseNumber: params.licenseNumber.trim().toUpperCase(),
      licenseDocument: params.licenseDocument,
      verification,
      hqDistrict: params.hqDistrict,
      radiusKm: params.radiusKm,
      domains: params.domains,
      deploymentCapacity: params.deploymentCapacity,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    this.accounts.push(newAccount);
    this.saveToStorage();

    const session = this.createSession(newAccount);
    this.saveSession(session);
    return session;
  }

  /**
   * Authenticate an existing NGO using PBKDF2 constant-time verification
   */
  public async loginNGO(email: string, passwordAttempt: string): Promise<AuthSession> {
    await this.initDatabase();

    const normalizedEmail = email.trim().toLowerCase();
    const account = this.accounts.find((a) => a.email.toLowerCase() === normalizedEmail);

    if (!account) {
      throw new Error('No registered organization found with that email address.');
    }

    const isValid = await verifyPassword(passwordAttempt, account.salt, account.passwordHash);
    if (!isValid) {
      throw new Error('Authentication failed: Invalid password provided.');
    }

    // Update last login
    account.lastLoginAt = new Date().toISOString();
    this.saveToStorage();

    const session = this.createSession(account);
    this.saveSession(session);
    return session;
  }

  /**
   * Session Helpers
   */
  private createSession(account: StoredNGOAccount): AuthSession {
    const { salt, passwordHash, ...safeAccount } = account;
    return {
      token: `neev_jwt_${account.id}_${Date.now()}`,
      account: safeAccount,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    };
  }

  public saveSession(session: AuthSession) {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      // Also update standard partner profile storage so dashboard syncs
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
      localStorage.setItem('neev_partner_profile', JSON.stringify(profile));
    } catch (e) {
      console.error('Failed to save session', e);
    }
  }

  public getCurrentSession(): AuthSession | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const session: AuthSession = JSON.parse(raw);
      if (new Date(session.expiresAt) < new Date()) {
        this.clearSession();
        return null;
      }
      return session;
    } catch (e) {
      return null;
    }
  }

  public clearSession() {
    try {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem('neev_partner_profile');
    } catch (e) {
      // ignore
    }
  }

  public getAllRegisteredNGOs(): Omit<StoredNGOAccount, 'salt' | 'passwordHash'>[] {
    return this.accounts.map(({ salt, passwordHash, ...rest }) => rest);
  }
}

export const authDb = new AuthDatabaseService();

