/**
 * Formatting utilities for display
 */

/**
 * Format weight with appropriate decimal places
 */
export const formatWeight = (weight: number, unit: 'kg' | 'lbs'): string => {
  return `${weight.toFixed(1)} ${unit}`;
};

/**
 * Format CG position
 */
export const formatCG = (cg: number): string => {
  return `${cg.toFixed(2)} in`;
};

/**
 * Format moment
 */
export const formatMoment = (moment: number): string => {
  return moment.toFixed(1);
};

/**
 * Format volume
 */
export const formatVolume = (volume: number, unit: 'liters' | 'gallons'): string => {
  return `${volume.toFixed(1)} ${unit === 'liters' ? 'L' : 'gal'}`;
};
