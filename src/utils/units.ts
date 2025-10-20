/**
 * Unit conversion utilities for mass and balance calculations
 */

import {
  FUEL_DENSITY_AVGAS_KG_PER_LITER,
  FUEL_DENSITY_AVGAS_LBS_PER_GALLON,
  FUEL_DENSITY_JETA_KG_PER_LITER,
  FUEL_DENSITY_JETA_LBS_PER_GALLON,
} from './constants';
import type { FuelType } from '../models/Aircraft';

// Weight conversions
export const kgToLbs = (kg: number): number => kg * 2.20462;
export const lbsToKg = (lbs: number): number => lbs / 2.20462;

// Volume conversions
export const litersToGallons = (liters: number): number => liters * 0.264172;
export const gallonsToLiters = (gallons: number): number => gallons / 0.264172;

// Distance conversions
export const inchesToMeters = (inches: number): number => inches * 0.0254;
export const metersToInches = (meters: number): number => meters / 0.0254;

// Fuel weight conversions (Avgas ~0.72 kg/liter, 6 lbs/gallon)
// Legacy functions - kept for backward compatibility
export const litersToKg = (liters: number): number => liters * FUEL_DENSITY_AVGAS_KG_PER_LITER;
export const gallonsToLbs = (gallons: number): number => gallons * FUEL_DENSITY_AVGAS_LBS_PER_GALLON;

/**
 * Convert weight based on unit system
 */
export const convertWeight = (
  weight: number,
  fromUnit: 'kg' | 'lbs',
  toUnit: 'kg' | 'lbs'
): number => {
  if (fromUnit === toUnit) return weight;
  return fromUnit === 'kg' ? kgToLbs(weight) : lbsToKg(weight);
};

/**
 * Convert fuel volume to weight based on fuel type
 */
export const fuelVolumeToWeight = (
  volume: number,
  volumeUnit: 'liters' | 'gallons',
  weightUnit: 'kg' | 'lbs',
  fuelType: FuelType = 'avgas'
): number => {
  // Get the appropriate density based on fuel type and units
  let densityKgPerLiter: number;
  let densityLbsPerGallon: number;

  if (fuelType === 'jet-a') {
    densityKgPerLiter = FUEL_DENSITY_JETA_KG_PER_LITER;
    densityLbsPerGallon = FUEL_DENSITY_JETA_LBS_PER_GALLON;
  } else {
    densityKgPerLiter = FUEL_DENSITY_AVGAS_KG_PER_LITER;
    densityLbsPerGallon = FUEL_DENSITY_AVGAS_LBS_PER_GALLON;
  }

  if (volumeUnit === 'liters' && weightUnit === 'kg') {
    return volume * densityKgPerLiter;
  } else if (volumeUnit === 'gallons' && weightUnit === 'lbs') {
    return volume * densityLbsPerGallon;
  } else if (volumeUnit === 'liters' && weightUnit === 'lbs') {
    return kgToLbs(volume * densityKgPerLiter);
  } else {
    // gallons to kg
    return lbsToKg(volume * densityLbsPerGallon);
  }
};
