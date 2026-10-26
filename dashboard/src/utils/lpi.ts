import { DistrictData, RiskCategory } from '../types';

export interface PillarBreakdown {
  academic: number;
  pedagogy: number;
  washInfra: number;
  digital: number;
  socioEconomic: number;
}

export interface UnifiedLPIOutput {
  score: number;
  riskCategory: RiskCategory;
  pillars: PillarBreakdown;
  formulaComponents: {
    literacyTerm: number;
    dropoutTerm: number;
    ptrTerm: number;
    infraGapTerm: number;
  };
}

/**
 * Computes the unified Learning Poverty Index (LPI) [0 - 100].
 * Formulation:
 *   LPI = (30 - 0.3 * Literacy) + (0.4 * Dropout_Secondary) + (0.2 * PTR_Secondary) + (0.1 * Infrastructure_Gap)
 * Where:
 *   Infrastructure_Gap = 100 - (0.3*Elec + 0.3*Toilets + 0.2*Water + 0.1*Comp + 0.1*Net)
 */
export function calculateUnifiedLPI(district: Partial<DistrictData>): UnifiedLPIOutput {
  const lit = district.Literacy_Rate_Total ?? 70.0;
  const drSec = district.Dropout_Rate_Secondary ?? 15.0;
  const ptrSec = district.Pupil_Teacher_Ratio_Secondary ?? 28.0;

  const elec = district.Percent_Schools_Electricity ?? 75.0;
  const toilets = district.Percent_Schools_Toilets ?? 75.0;
  const water = district.Percent_Schools_Drinking_Water ?? 85.0;
  const comp = district.Percent_Schools_Computer_Lab ?? 25.0;
  const net = district.Percent_Schools_Internet ?? 20.0;

  const drPri = district.Dropout_Rate_Primary ?? 6.0;
  const ptrPri = district.Pupil_Teacher_Ratio_Primary ?? 25.0;
  const trained = district.Percent_Trained_Teachers ?? 80.0;
  const mpi = district.MPI_Poverty_Index ?? 25.0;
  const wealth = district.Wealth_Index_Score ?? 55.0;
  const ger = district.Gross_Enrollment_Ratio ?? 85.0;

  // Infrastructure Saturation & Gap
  const infraSaturation = 0.30 * elec + 0.30 * toilets + 0.20 * water + 0.10 * comp + 0.10 * net;
  const infraGap = Math.max(0.0, 100.0 - infraSaturation);

  // Core 4-term Formula
  const litTerm = Math.max(0.0, 30.0 - 0.3 * lit);
  const drTerm = 0.4 * drSec;
  const ptrTerm = 0.2 * ptrSec;
  const gapTerm = 0.1 * infraGap;

  const rawScore = litTerm + drTerm + ptrTerm + gapTerm;

  // 5 Ground-Truth Calibrated Policy Pillars (0 - 100 deficit scale)
  const p1Academic = district.Pillar_Academic !== undefined
    ? Number(district.Pillar_Academic.toFixed(1))
    : Number((0.50 * (100.0 - lit) + 0.50 * Math.min(100.0, drSec * 2.2)).toFixed(1));

  const p2Pedagogy = district.Pillar_Pedagogy !== undefined
    ? Number(district.Pillar_Pedagogy.toFixed(1))
    : Number((0.50 * Math.min(100.0, Math.max(0.0, (ptrSec - 18.0) * 3.0)) + 0.50 * (100.0 - trained)).toFixed(1));

  const p3Wash = district.Pillar_WASH !== undefined
    ? Number(district.Pillar_WASH.toFixed(1))
    : Number((Math.min(100.0, 0.40 * (100.0 - elec) * 1.5 + 0.40 * (100.0 - toilets) * 2.5 + 0.20 * (100.0 - water) * 5.0)).toFixed(1));

  const p4Digital = district.Pillar_Digital !== undefined
    ? Number(district.Pillar_Digital.toFixed(1))
    : Number((0.60 * (100.0 - comp) + 0.40 * (100.0 - net)).toFixed(1));

  const p5Socio = district.Pillar_SocioEconomic !== undefined
    ? Number(district.Pillar_SocioEconomic.toFixed(1))
    : Number((Math.min(100.0, mpi * 2.0)).toFixed(1));

  // Calibrated Composite LPI score
  const calibratedScore = Number((0.30 * p1Academic + 0.25 * p2Pedagogy + 0.20 * p3Wash + 0.10 * p4Digital + 0.15 * p5Socio).toFixed(2));
  const finalScore = district.Learning_Poverty_Score !== undefined
    ? Number(district.Learning_Poverty_Score.toFixed(2))
    : calibratedScore;

  const riskCategory = getRiskCategory(finalScore);

  return {
    score: finalScore,
    riskCategory,
    pillars: {
      academic: p1Academic,
      pedagogy: p2Pedagogy,
      washInfra: p3Wash,
      digital: p4Digital,
      socioEconomic: p5Socio,
    },
    formulaComponents: {
      literacyTerm: Number(litTerm.toFixed(2)),
      dropoutTerm: Number(drTerm.toFixed(2)),
      ptrTerm: Number(ptrTerm.toFixed(2)),
      infraGapTerm: Number(gapTerm.toFixed(2)),
    },
  };
}

export function calculateLPI(
  literacy: number,
  dropoutSec: number,
  ptrSec: number,
  elec: number
): number {
  return calculateUnifiedLPI({
    Literacy_Rate_Total: literacy,
    Dropout_Rate_Secondary: dropoutSec,
    Pupil_Teacher_Ratio_Secondary: ptrSec,
    Percent_Schools_Electricity: elec,
  }).score;
}

export function getRiskCategory(score: number): RiskCategory {
  if (score > 50.0) return 'High Risk';
  if (score >= 35.0) return 'Medium Risk';
  return 'Low Risk';
}

/**
 * Linear/Apple caliber refined Choropleth Palette
 */
export function getRiskColor(category: RiskCategory): string {
  switch (category) {
    case 'High Risk':
      return '#be123c'; // Rose-Crimson
    case 'Medium Risk':
      return '#b45309'; // Warm Amber
    case 'Low Risk':
      return '#0f766e'; // Emerald-Teal
  }
}

export function getRiskHoverColor(category: RiskCategory): string {
  switch (category) {
    case 'High Risk':
      return '#e11d48';
    case 'Medium Risk':
      return '#d97706';
    case 'Low Risk':
      return '#0d9488';
  }
}

export interface QuartileThresholds {
  p25_elec: number;
  p25_toilet: number;
  p25_water: number;
  p25_comp: number;
  p25_trained: number;
  p75_dropout_sec: number;
  p75_dropout_pri: number;
  p75_ptr_sec: number;
  p75_ptr_pri: number;
}

export function computeQuartiles(districts: DistrictData[]): QuartileThresholds {
  const getQ = (arr: number[], q: number) => {
    const sorted = [...arr].sort((a, b) => a - b);
    const pos = (sorted.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    return sorted[base + 1] !== undefined
      ? sorted[base] + rest * (sorted[base + 1] - sorted[base])
      : sorted[base];
  };

  return {
    p25_elec: getQ(districts.map((d) => d.Percent_Schools_Electricity), 0.25),
    p25_toilet: getQ(districts.map((d) => d.Percent_Schools_Toilets), 0.25),
    p25_water: getQ(districts.map((d) => d.Percent_Schools_Drinking_Water), 0.25),
    p25_comp: getQ(districts.map((d) => d.Percent_Schools_Computer_Lab), 0.25),
    p25_trained: getQ(districts.map((d) => d.Percent_Trained_Teachers), 0.25),
    p75_dropout_sec: getQ(districts.map((d) => d.Dropout_Rate_Secondary), 0.75),
    p75_dropout_pri: getQ(districts.map((d) => d.Dropout_Rate_Primary), 0.75),
    p75_ptr_sec: getQ(districts.map((d) => d.Pupil_Teacher_Ratio_Secondary), 0.75),
    p75_ptr_pri: getQ(districts.map((d) => d.Pupil_Teacher_Ratio_Primary), 0.75),
  };
}

export interface AttentionAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  category: string;
  title: string;
  finding: string;
  action: string;
}

/**
 * Humanized policy alerts without raw developer/statistical jargon
 */
export function generateAttentionAlerts(
  d: DistrictData,
  q: QuartileThresholds
): AttentionAlert[] {
  const alerts: AttentionAlert[] = [];

  if (d.Percent_Schools_Toilets <= q.p25_toilet) {
    alerts.push({
      id: 'toilet',
      type: 'critical',
      category: 'School Utilities & WASH Infrastructure',
      title: 'Severe Sanitation Deficit in Girl & Boy Campuses',
      finding: `Only ${d.Percent_Schools_Toilets.toFixed(1)}% of schools feature functional, clean toilet blocks.`,
      action: 'Initiate targeted Swachh Vidyalaya construction drive to halt female student dropout.'
    });
  }

  if (d.Percent_Schools_Electricity <= q.p25_elec) {
    alerts.push({
      id: 'elec',
      type: 'critical',
      category: 'School Utilities & WASH Infrastructure',
      title: 'Critical Power Grid Deficit',
      finding: `Campus electrification is constrained at ${d.Percent_Schools_Electricity.toFixed(1)}%, limiting evening study and digital aids.`,
      action: 'Fast-track feeder grid connections and rooftop solar microgrids under Samagra Shiksha.'
    });
  }

  if (d.Percent_Trained_Teachers <= q.p25_trained) {
    alerts.push({
      id: 'training',
      type: 'critical',
      category: 'Teacher Availability & PTR Compliance',
      title: 'Pedagogical Upskilling Deficit',
      finding: `Only ${d.Percent_Trained_Teachers.toFixed(1)}% of secondary instructors are certified in active foundational pedagogical standards.`,
      action: 'Deploy structured NIPUN Bharat Foundational Literacy and Numeracy (FLN) educator cohorts.'
    });
  }

  if (d.Percent_Schools_Drinking_Water <= q.p25_water) {
    alerts.push({
      id: 'water',
      type: 'warning',
      category: 'School Utilities & WASH Infrastructure',
      title: 'Piped Drinking Water Access Gap',
      finding: `Continuous safe drinking water saturation sits at ${d.Percent_Schools_Drinking_Water.toFixed(1)}%.`,
      action: 'Partner with Jal Jeevan Mission for dedicated campus tap-water supply.'
    });
  }

  if (d.Dropout_Rate_Secondary >= q.p75_dropout_sec) {
    alerts.push({
      id: 'dropout',
      type: 'warning',
      category: 'Foundational Literacy & Student Retention',
      title: 'Elevated Secondary Attrition',
      finding: `Secondary school student dropout rate is ${d.Dropout_Rate_Secondary.toFixed(1)}%.`,
      action: 'Activate village education committees, midday nutritional incentives, and retention tracking.'
    });
  }

  if (d.Pupil_Teacher_Ratio_Secondary >= q.p75_ptr_sec || d.Pupil_Teacher_Ratio_Primary >= 35) {
    alerts.push({
      id: 'ptr',
      type: 'warning',
      category: 'Teacher Availability & PTR Compliance',
      title: 'Overcrowded Classroom Ratio',
      finding: `Pupil-Teacher Ratio is ${d.Pupil_Teacher_Ratio_Secondary.toFixed(1)}:1, exceeding standard statutory limits.`,
      action: 'Redeploy surplus teaching cadre from district urban hubs to high-deficit rural clusters.'
    });
  }

  if (d.Percent_Schools_Computer_Lab <= q.p25_comp) {
    alerts.push({
      id: 'comp',
      type: 'info',
      category: 'Digital Lab & Internet Readiness',
      title: 'Digital Classroom Deficit',
      finding: `Only ${d.Percent_Schools_Computer_Lab.toFixed(1)}% of secondary schools host functional computer labs.`,
      action: 'Prioritize CSR hardware grants for smart classroom sets and broadband connectivity.'
    });
  }

  return alerts;
}

export interface CriticalAreaItem {
  id: string;
  name: string;
  category: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE';
  currentVal: string;
  benchmarkVal: string;
  gapText: string;
  actionRequired: string;
  iconType: 'comp' | 'elec' | 'wash' | 'dropout' | 'ptr' | 'literacy' | 'trained';
}

/**
 * Returns prioritized critical areas that need immediate intervention in a given district
 */
export function getDistrictCriticalAreas(d: DistrictData): CriticalAreaItem[] {
  const items: CriticalAreaItem[] = [];

  // 1. Computer Labs & ICT (MP State Mean: 26.0%)
  if (d.Percent_Schools_Computer_Lab < 16) {
    items.push({
      id: 'comp',
      name: 'Digital Labs & STEM Infrastructure',
      category: 'Digital Readiness',
      severity: d.Percent_Schools_Computer_Lab < 12 ? 'CRITICAL' : 'HIGH',
      currentVal: `${d.Percent_Schools_Computer_Lab.toFixed(1)}%`,
      benchmarkVal: '26.0% (MP Mean)',
      gapText: `-${(26.0 - d.Percent_Schools_Computer_Lab).toFixed(1)}% Deficit Gap`,
      actionRequired: `Deploy functional computer labs with broadband/solar to ${(100 - d.Percent_Schools_Computer_Lab).toFixed(0)}% unequipped schools.`,
      iconType: 'comp',
    });
  }

  // 2. Electrification (MP State Mean: 73.6%)
  if (d.Percent_Schools_Electricity < 62) {
    items.push({
      id: 'elec',
      name: 'Campus Grid Electrification',
      category: 'WASH & Utilities',
      severity: d.Percent_Schools_Electricity < 52 ? 'CRITICAL' : 'HIGH',
      currentVal: `${d.Percent_Schools_Electricity.toFixed(1)}%`,
      benchmarkVal: '73.6% (MP Mean)',
      gapText: `-${(73.6 - d.Percent_Schools_Electricity).toFixed(1)}% Deficit Gap`,
      actionRequired: `Electrify ${(100 - d.Percent_Schools_Electricity).toFixed(0)}% unpowered schools via dedicated grid hookups & solar microgrids.`,
      iconType: 'elec',
    });
  }

  // 3. Toilets & Sanitation (MP State Mean: 70.0%)
  if (d.Percent_Schools_Toilets < 60) {
    items.push({
      id: 'wash',
      name: 'Functional Sanitation & Toilets',
      category: 'WASH & Utilities',
      severity: d.Percent_Schools_Toilets < 50 ? 'CRITICAL' : 'HIGH',
      currentVal: `${d.Percent_Schools_Toilets.toFixed(1)}%`,
      benchmarkVal: '70.0% (MP Mean)',
      gapText: `-${(70.0 - d.Percent_Schools_Toilets).toFixed(1)}% Deficit Gap`,
      actionRequired: `Construct separate functional girl & boy toilet blocks in ${(100 - d.Percent_Schools_Toilets).toFixed(0)}% non-compliant schools.`,
      iconType: 'wash',
    });
  }

  // 4. Secondary Student Retention / Dropout (MP State Mean: 22.3%)
  if (d.Dropout_Rate_Secondary > 25) {
    items.push({
      id: 'dropout',
      name: 'Secondary Student Retention',
      category: 'Student Retention',
      severity: d.Dropout_Rate_Secondary > 30 ? 'CRITICAL' : 'HIGH',
      currentVal: `${d.Dropout_Rate_Secondary.toFixed(1)}%`,
      benchmarkVal: '22.3% (MP Mean)',
      gapText: `+${(d.Dropout_Rate_Secondary - 22.3).toFixed(1)}% Above State`,
      actionRequired: `Deploy mid-day nutrition incentives, transport aid, and community counselors to halt student attrition.`,
      iconType: 'dropout',
    });
  }

  // 5. Pupil-Teacher Ratio (Statutory Limit: 30:1, State Mean: 34.8:1)
  if (d.Pupil_Teacher_Ratio_Secondary > 35) {
    items.push({
      id: 'ptr',
      name: 'Teacher Availability & PTR',
      category: 'Pedagogy & Faculty',
      severity: d.Pupil_Teacher_Ratio_Secondary > 40 ? 'CRITICAL' : 'HIGH',
      currentVal: `${d.Pupil_Teacher_Ratio_Secondary.toFixed(1)}:1`,
      benchmarkVal: '30:1 (Statutory)',
      gapText: `+${(d.Pupil_Teacher_Ratio_Secondary - 30).toFixed(1)} Over Statutory Limit`,
      actionRequired: `Recruit and redeploy teachers to relieve severely overcrowded classrooms and reach 30:1 limit.`,
      iconType: 'ptr',
    });
  }

  // 6. Foundational Literacy Rate (MP State Mean: 69.3%)
  if (d.Literacy_Rate_Total < 60) {
    items.push({
      id: 'literacy',
      name: 'Foundational Literacy & Numeracy',
      category: 'Foundational Learning',
      severity: d.Literacy_Rate_Total < 50 ? 'CRITICAL' : 'HIGH',
      currentVal: `${d.Literacy_Rate_Total.toFixed(1)}%`,
      benchmarkVal: '69.3% (MP Mean)',
      gapText: `-${(69.3 - d.Literacy_Rate_Total).toFixed(1)}% Deficit Gap`,
      actionRequired: `Deploy structured NIPUN Bharat FLN educator cohorts and mother-tongue reading remedial camps.`,
      iconType: 'literacy',
    });
  }

  // 7. Trained Teachers (MP State Mean: 68.8%)
  if (d.Percent_Trained_Teachers < 60) {
    items.push({
      id: 'trained',
      name: 'Teacher Pedagogy Certification',
      category: 'Pedagogy & Faculty',
      severity: d.Percent_Trained_Teachers < 52 ? 'CRITICAL' : 'HIGH',
      currentVal: `${d.Percent_Trained_Teachers.toFixed(1)}%`,
      benchmarkVal: '68.8% (MP Mean)',
      gapText: `-${(68.8 - d.Percent_Trained_Teachers).toFixed(1)}% Deficit Gap`,
      actionRequired: `Enroll untracked educators into mandatory DIET pedagogical certification programs.`,
      iconType: 'trained',
    });
  }

  return items.sort((a, b) => (a.severity === 'CRITICAL' ? -1 : 1));
}
