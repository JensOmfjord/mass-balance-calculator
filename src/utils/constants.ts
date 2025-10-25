/**
 * Application-wide constants
 */

// Fuel densities
export const FUEL_DENSITY_AVGAS_KG_PER_LITER = 0.72; // Avgas 100LL
export const FUEL_DENSITY_AVGAS_LBS_PER_GALLON = 6.0; // Avgas 100LL
export const FUEL_DENSITY_UL91_KG_PER_LITER = 0.72; // UL91 unleaded (similar to Avgas)
export const FUEL_DENSITY_UL91_LBS_PER_GALLON = 6.0; // UL91 unleaded
export const FUEL_DENSITY_JETA_KG_PER_LITER = 0.84; // Jet-A (standard at 15°C)
export const FUEL_DENSITY_JETA_LBS_PER_GALLON = 7.0; // Jet-A (0.84 kg/L × 2.20462 lbs/kg ÷ 3.78541 L/gal)

export const STORAGE_KEYS = {
  LAST_AIRCRAFT: '@last_aircraft',
  LAST_CALCULATION: '@last_calculation',
} as const;
