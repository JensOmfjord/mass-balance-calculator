import { AircraftConfig } from '../models/Aircraft';
import { StationResult } from '../models/Station';
import { MassBalanceResult } from '../models/MassBalanceResult';

/**
 * Calculate moment for a given weight and arm
 */
export const calculateMoment = (weight: number, arm: number): number => {
  return weight * arm;
};

/**
 * Calculate CG position from total moment and total weight
 */
export const calculateCG = (totalMoment: number, totalWeight: number): number => {
  if (totalWeight === 0) return 0;
  return totalMoment / totalWeight;
};

/**
 * Check if CG position is within the envelope for a given weight
 */
export const isWithinEnvelope = (
  weight: number,
  cg: number,
  aircraft: AircraftConfig
): boolean => {
  // Find the appropriate envelope segment
  const { envelope } = aircraft;

  // If weight is below minimum envelope weight
  if (weight < envelope[0].weight) {
    return cg >= envelope[0].cgMin && cg <= envelope[0].cgMax;
  }

  // If weight is above maximum envelope weight
  if (weight > envelope[envelope.length - 1].weight) {
    return false; // Outside envelope
  }

  // Find the two envelope points to interpolate between
  for (let i = 0; i < envelope.length - 1; i++) {
    const lower = envelope[i];
    const upper = envelope[i + 1];

    if (weight >= lower.weight && weight <= upper.weight) {
      // Linear interpolation
      const ratio = (weight - lower.weight) / (upper.weight - lower.weight);
      const cgMin = lower.cgMin + ratio * (upper.cgMin - lower.cgMin);
      const cgMax = lower.cgMax + ratio * (upper.cgMax - lower.cgMax);

      return cg >= cgMin && cg <= cgMax;
    }
  }

  return false;
};

/**
 * Calculate mass and balance for an aircraft configuration
 */
export const calculateMassBalance = (
  aircraft: AircraftConfig,
  stationWeights: Record<string, number>, // stationId -> weight
  fuelWeight: number
): MassBalanceResult => {
  // Calculate empty aircraft moment
  const emptyMoment = calculateMoment(aircraft.emptyWeight, aircraft.emptyCG);

  // Calculate station results
  const stationResults: StationResult[] = aircraft.stations.map((station) => {
    const weight = stationWeights[station.id] || 0;
    const moment = calculateMoment(weight, station.arm);
    return {
      station,
      weight,
      moment,
    };
  });

  // Calculate fuel moment
  const fuelMoment = calculateMoment(fuelWeight, aircraft.fuelArm);

  // Calculate totals
  const stationsTotalWeight = stationResults.reduce(
    (sum, result) => sum + result.weight,
    0
  );
  const stationsTotalMoment = stationResults.reduce(
    (sum, result) => sum + result.moment,
    0
  );

  const totalWeight =
    aircraft.emptyWeight + stationsTotalWeight + fuelWeight;
  const totalMoment = emptyMoment + stationsTotalMoment + fuelMoment;

  const cgPosition = calculateCG(totalMoment, totalWeight);

  // Check limits
  const withinEnvelope = isWithinEnvelope(totalWeight, cgPosition, aircraft);
  const exceedsMaxWeight = totalWeight > aircraft.maxTakeoffWeight;

  return {
    totalWeight,
    totalMoment,
    cgPosition,
    isWithinEnvelope: withinEnvelope,
    exceedsMaxWeight,
    stations: stationResults,
    emptyWeight: aircraft.emptyWeight,
    emptyMoment,
  };
};
