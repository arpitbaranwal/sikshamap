import { DistrictData, OrgProfile, DistrictMatch, DomainTag } from '../types';

// Rough coordinates (Lat, Lng) for MP district centroids for distance calculation
const DISTRICT_CENTROIDS: Record<string, [number, number]> = {
  "Agar Malwa": [23.71, 76.01],
  "Alirajpur": [22.30, 74.35],
  "Anuppur": [23.10, 81.68],
  "Ashoknagar": [24.57, 77.72],
  "Balaghat": [21.81, 80.18],
  "Barwani": [22.03, 74.90],
  "Betul": [21.90, 77.90],
  "Bhind": [26.56, 78.78],
  "Bhopal": [23.25, 77.41],
  "Burhanpur": [21.31, 76.22],
  "Chhatarpur": [24.91, 79.58],
  "Chhindwara": [22.05, 78.93],
  "Damoh": [23.83, 79.44],
  "Datia": [25.66, 78.46],
  "Dewas": [22.96, 76.06],
  "Dhar": [22.59, 75.30],
  "Dindori": [22.95, 81.08],
  "Guna": [24.64, 77.31],
  "Gwalior": [26.21, 78.17],
  "Harda": [22.34, 77.09],
  "Narmadapuram": [22.75, 77.72],
  "Hoshangabad": [22.75, 77.72],
  "Indore": [22.71, 75.85],
  "Jabalpur": [23.18, 79.98],
  "Jhabua": [22.76, 74.59],
  "Katni": [23.83, 80.39],
  "Khandwa": [21.83, 76.35],
  "Khargone": [21.82, 75.61],
  "Mandla": [22.59, 80.37],
  "Mandsaur": [24.07, 75.06],
  "Morena": [26.49, 77.99],
  "Narsinghpur": [22.94, 79.19],
  "Neemuch": [24.47, 74.87],
  "Niwari": [25.36, 78.80],
  "Panna": [24.72, 80.19],
  "Raisen": [23.33, 77.79],
  "Rajgarh": [24.01, 76.73],
  "Ratlam": [23.33, 75.03],
  "Rewa": [24.53, 81.30],
  "Sagar": [23.83, 78.73],
  "Satna": [24.58, 80.83],
  "Sehore": [23.20, 77.08],
  "Seoni": [22.08, 79.55],
  "Shahdol": [23.29, 81.35],
  "Shajapur": [23.42, 76.27],
  "Sheopur": [25.66, 76.69],
  "Shivpuri": [25.43, 77.65],
  "Sidhi": [24.40, 81.88],
  "Singrauli": [24.20, 82.66],
  "Tikamgarh": [24.74, 78.83],
  "Ujjain": [23.17, 75.78],
  "Umaria": [23.52, 80.83],
  "Vidisha": [23.52, 77.81],
};

// Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function computeDistrictMatches(
  profile: OrgProfile,
  allDistricts: DistrictData[]
): DistrictMatch[] {
  const hqCoords = DISTRICT_CENTROIDS[profile.hqDistrict] || [23.25, 77.41]; // Default Bhopal

  const matches: DistrictMatch[] = allDistricts.map((d) => {
    const dName = d.matchedName || d.District;
    const targetCoords = DISTRICT_CENTROIDS[dName] || [23.25, 77.41];
    const distanceKm = calculateDistance(
      hqCoords[0],
      hqCoords[1],
      targetCoords[0],
      targetCoords[1]
    );

    // Calculate domain deficit indicators
    const domainDeficits: Record<DomainTag, { score: number; detail: string }> = {
      EdTech: {
        score: Math.max(0, 100 - (d.Percent_Schools_Computer_Lab * 0.7 + d.Percent_Schools_Internet * 0.3)),
        detail: `Only ${d.Percent_Schools_Computer_Lab.toFixed(1)}% schools have digital computer labs.`
      },
      WASH: {
        score: Math.max(0, 100 - (d.Percent_Schools_Toilets * 0.6 + d.Percent_Schools_Drinking_Water * 0.4)),
        detail: `Toilet saturation sits at ${d.Percent_Schools_Toilets.toFixed(1)}% with severe water bottlenecks.`
      },
      TeacherTraining: {
        score: Math.min(100, (d.Pupil_Teacher_Ratio_Secondary / 50) * 50 + (100 - d.Literacy_Rate_Total) * 0.5),
        detail: `Overcrowded secondary PTR of ${d.Pupil_Teacher_Ratio_Secondary.toFixed(1)}:1 with ${d.Literacy_Rate_Total.toFixed(1)}% literacy.`
      },
      DropoutPrevention: {
        score: Math.min(100, (d.Dropout_Rate_Secondary / 35) * 100),
        detail: `Critical secondary dropout rate of ${d.Dropout_Rate_Secondary.toFixed(1)}%.`
      },
      Electrification: {
        score: Math.max(0, 100 - d.Percent_Schools_Electricity),
        detail: `Grid electrification deficit: only ${d.Percent_Schools_Electricity.toFixed(1)}% campuses powered.`
      }
    };

    // Calculate aggregate score based on selected domains
    const activeDomains = profile.domains.length > 0
      ? profile.domains
      : (['EdTech', 'WASH', 'TeacherTraining', 'DropoutPrevention', 'Electrification'] as DomainTag[]);

    let domainSum = 0;
    let worstDeficitDomain: DomainTag = activeDomains[0];
    let maxDeficit = -1;

    activeDomains.forEach((domain) => {
      const def = domainDeficits[domain];
      domainSum += def.score;
      if (def.score > maxDeficit) {
        maxDeficit = def.score;
        worstDeficitDomain = domain;
      }
    });

    const avgDomainDeficit = domainSum / activeDomains.length;

    // Vulnerability Weight (Ground-Truth LPI)
    const lpiWeight = (d.Learning_Poverty_Score / 50) * 100;

    // Distance multiplier: 1.0 within radius, scales down if farther
    let distanceFactor = 1.0;
    if (distanceKm > profile.radiusKm) {
      const overage = distanceKm - profile.radiusKm;
      distanceFactor = Math.max(0.65, 1.0 - (overage / 300));
    } else {
      // Bonus for being inside operational territory
      distanceFactor = 1.08;
    }

    // Final composite match score (0 - 100)
    const rawMatch = (avgDomainDeficit * 0.55 + lpiWeight * 0.45) * distanceFactor;
    const matchScore = Math.min(99, Math.max(45, Math.round(rawMatch)));

    const primaryNeed = worstDeficitDomain === 'EdTech'
      ? 'Digital Lab & Computer Access Deficit'
      : worstDeficitDomain === 'WASH'
      ? 'Sanitation & Clean Water Deficit'
      : worstDeficitDomain === 'TeacherTraining'
      ? 'Teacher Shortage & Pedagogy Vulnerability'
      : worstDeficitDomain === 'DropoutPrevention'
      ? 'Elevated Secondary School Dropout'
      : 'Un-electrified Campus Grid Deficit';

    const rationale = `${domainDeficits[worstDeficitDomain].detail} Aligns directly with ${profile.orgName}'s deployment expertise in ${worstDeficitDomain}.`;

    return {
      district: d,
      matchScore,
      primaryNeed,
      rationale,
      domainsTargeted: activeDomains,
      distanceKm
    };
  });

  // Sort descending by matchScore
  return matches.sort((a, b) => b.matchScore - a.matchScore);
}

