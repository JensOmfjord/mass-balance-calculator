import { Station } from './Station';
import { CGEnvelope } from './CGEnvelope';

export type AircraftModelType = 'tecnam-2002jf' | 'da40-ng';

export interface AircraftConfig {
  registration: string; // Tail number (e.g., 'LN-DKH')
  model: string; // Display name (e.g., 'Tecnam P2002JF')
  modelType: AircraftModelType;

  // Aircraft-specific values (varies by tail number)
  emptyWeight: number; // Basic empty weight in kg
  emptyCG: number; // Empty CG position in inches

  // Shared across model type
  stations: Station[];
  envelope: CGEnvelope;
  maxTakeoffWeight: number; // in kg
  fuelCapacity: number; // in liters
  fuelArm: number; // Fuel tank arm in inches
  defaultUnit: 'kg' | 'lbs';

  // Display metadata
  manufacturer: string;
}
