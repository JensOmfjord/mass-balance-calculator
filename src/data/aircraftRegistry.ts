import { AircraftConfig, AircraftModelType } from '../models/Aircraft';
import { SE_LRO } from './tecnam2002jf/aircraft/SE-LRO';
import { SE_LJO } from './tecnam2002jf/aircraft/SE-LJO';
import { LN_FTM } from './da40ng/aircraft/LN-FTM';
import { LN_FTS } from './da40ng/aircraft/LN-FTS';

export const aircraftRegistry: AircraftConfig[] = [
  SE_LRO,
  SE_LJO,
  LN_FTM,
  LN_FTS,
];

/**
 * Get aircraft configuration by registration (tail number)
 */
export const getAircraftByRegistration = (
  registration: string
): AircraftConfig | undefined => {
  return aircraftRegistry.find((ac) => ac.registration === registration);
};

/**
 * Get all aircraft of a specific model type
 */
export const getAircraftsByModel = (
  modelType: AircraftModelType
): AircraftConfig[] => {
  return aircraftRegistry.filter((ac) => ac.modelType === modelType);
};

/**
 * Get all unique model types
 */
export const getModelTypes = (): AircraftModelType[] => {
  const modelTypes = new Set(aircraftRegistry.map((ac) => ac.modelType));
  return Array.from(modelTypes);
};

/**
 * Get display name for model type
 */
export const getModelDisplayName = (modelType: AircraftModelType): string => {
  const aircraft = aircraftRegistry.find((ac) => ac.modelType === modelType);
  return aircraft?.model || modelType;
};
