export type RunwaySurface = 'paved' | 'grass';

export type GrassCondition =
  | 'dry-short' // takeoff: up to 5 cm / landing: up to 5 cm
  | 'dry-medium' // takeoff: 5-10 cm
  | 'dry-long' // takeoff: ~25 cm / landing: >5 cm
  | 'wet-short' // takeoff: wet, up to 5 cm
  | 'wet-medium' // takeoff: wet, 5-10 cm
  | 'wet-long' // takeoff: wet, ~25 cm
  | 'wet' // landing: wet or soft grass
  | 'too-high'; // takeoff: >25 cm — no take-off

export interface FieldConditions {
  elevationFt: number;
  qnhHpa: number;
  oatC: number;
  windKts: number; // positive = headwind, negative = tailwind
  slopePercent: number; // positive = uphill, negative = downhill
  surface: RunwaySurface;
  pavedWet: boolean; // when surface === 'paved'
  grassCondition: GrassCondition; // when surface === 'grass'
  softGround: boolean;
  wheelFairings: boolean;
  runwayLengthM: number; // TORA (takeoff) / LDA (landing)
}

export interface PerformanceInput {
  phase: 'takeoff' | 'landing';
  weightKg: number;
  field: FieldConditions;
}

export interface ReferenceSpeed {
  label: string; // 'vR', 'v50', 'vREF'
  kias: number;
}

export type PerformanceStatus = 'ok' | 'caution' | 'unsafe';

export interface PhasePerformance {
  referenceGroundRollM: number;
  referenceDistanceM: number; // takeoff: over 50 ft obstacle; landing: total over 50 ft
  correctedGroundRollM: number;
  correctedDistanceM: number;
  factoredGroundRollM: number;
  factoredDistanceM: number;
  marginM: number; // runway length - factored distance
  status: PerformanceStatus;
  speeds: ReferenceSpeed[];
  notes: string[];
  pressureAltitudeFt: number;
  densityAltitudeFt: number;
}

export interface PerformanceTableRow {
  pressureAltitudeFt: number;
  oatsC: number[];
  groundRollM: number[];
  distanceM: number[]; // takeoff: over 50 ft obstacle; landing: total over 50 ft
  isa: { groundRollM: number; distanceM: number };
}

export interface PerformanceTable {
  weightKg: number;
  rows: PerformanceTableRow[];
}

export interface WindCorrection {
  headwindPercentPerKt: number; // negative
  tailwindPercentPerKt: number; // positive
}

export interface TakeoffCorrections {
  wind: WindCorrection;
  grass: {
    dryShortGroundRollPercent: number; // up to 5 cm
    dryMediumGroundRollPercent: number; // 5-10 cm
    dryLongGroundRollPercent: number; // ~25 cm
    wetPercentOfDryGrass: number; // increase dry grass calc by this %
    noTakeoffAboveCm: number;
  };
  softGroundGroundRollPercent: number;
  uphillSlopeGroundRollPercentPerPercent: number;
  wheelFairings: { groundRollMeters: number; distanceMeters: number };
}

export interface LandingCorrections {
  wind: WindCorrection;
  pavedWetPercent: number;
  grass: {
    dryShortGroundRollPercent: number; // up to 5 cm
    dryLongGroundRollPercent: number; // >5 cm
    wetOrSoftGroundRollPercent: number;
  };
  downhillSlopeGroundRollPercentPerPercent: number;
}

export interface TakeoffPerformanceData {
  conditions: string;
  referenceWeightsKg: number[];
  speedsByWeight: { weightKg: number; speeds: Record<string, number> }[];
  tables: PerformanceTable[];
  safetyFactor: number;
  corrections: TakeoffCorrections;
  cautions: string[];
}

export interface LandingPerformanceData {
  conditions: string;
  referenceWeightsKg: number[];
  speedsByWeight: { weightKg: number; speeds: Record<string, number> }[];
  tables: PerformanceTable[];
  safetyFactor: number;
  corrections: LandingCorrections;
  cautions: string[];
}

export interface PerformanceData {
  source: string;
  takeoff: TakeoffPerformanceData;
  landing: LandingPerformanceData;
}
