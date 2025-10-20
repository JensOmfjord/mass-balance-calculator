import { AircraftConfig } from '../../../models/Aircraft';
import { tecnamStations } from '../base/stations';
import { tecnamEnvelope } from '../base/envelope';
import { FUEL_DENSITY_AVGAS_KG_PER_LITER } from '../../../utils/constants';

export const SE_LRO: AircraftConfig = {
  registration: 'SE-LRO',
  model: 'Tecnam P2002JF',
  modelType: 'tecnam-2002jf',
  manufacturer: 'Tecnam',

  // Aircraft-specific values (from weight & balance sheet)
  emptyWeight: 381, // kg
  emptyCG: 67.95, // inches (1.726m from datum)

  // Shared configuration
  stations: tecnamStations,
  envelope: tecnamEnvelope,
  maxTakeoffWeight: 620, // kg
  fuelCapacity: 100, // liters (99 liters usable)
  fuelArm: 60.24, // inches (1.53m from datum)
  fuelType: 'avgas',
  fuelDensity: FUEL_DENSITY_AVGAS_KG_PER_LITER,
  defaultUnit: 'kg',
};
