/**
 * Unit conversion utilities for mass and balance calculations
 */

// Weight conversions
export const kgToLbs = (kg: number): number => kg * 2.20462;
export const lbsToKg = (lbs: number): number => lbs / 2.20462;

// Volume conversions
export const litersToGallons = (liters: number): number => liters * 0.264172;
export const gallonsToLiters = (gallons: number): number => gallons / 0.264172;

// Fuel weight conversions (Avgas ~0.72 kg/liter, 6 lbs/gallon)
export const litersToKg = (liters: number): number => liters * 0.72;
export const gallonsToLbs = (gallons: number): number => gallons * 6.0;

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
 * Convert fuel volume to weight
 */
export const fuelVolumeToWeight = (
  volume: number,
  volumeUnit: 'liters' | 'gallons',
  weightUnit: 'kg' | 'lbs'
): number => {
  if (volumeUnit === 'liters' && weightUnit === 'kg') {
    return litersToKg(volume);
  } else if (volumeUnit === 'gallons' && weightUnit === 'lbs') {
    return gallonsToLbs(volume);
  } else if (volumeUnit === 'liters' && weightUnit === 'lbs') {
    return kgToLbs(litersToKg(volume));
  } else {
    // gallons to kg
    return lbsToKg(gallonsToLbs(volume));
  }
};
