import { AircraftConfig } from '../../../models/Aircraft';
import { tecnamStations } from '../base/stations';
import { tecnamEnvelope } from '../base/envelope';

export const SE_LJO: AircraftConfig = {
  registration: 'SE-LJO',
  model: 'Tecnam P2002JF',
  modelType: 'tecnam-2002jf',
  manufacturer: 'Tecnam',

  // Aircraft-specific values (from weight & balance sheet)
  emptyWeight: 371, // kg
  emptyCG: 67.13, // inches (1.705m from datum)

  // Shared configuration
  stations: tecnamStations,
  envelope: tecnamEnvelope,
  maxTakeoffWeight: 620, // kg
  fuelCapacity: 100, // liters (99 liters usable)
  fuelArm: 60.24, // inches (1.53m from datum)
  defaultUnit: 'kg',
};
