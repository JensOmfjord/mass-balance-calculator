import { AircraftConfig } from '../../../models/Aircraft';
import { da40Stations } from '../base/stations';
import { da40Envelope } from '../base/envelope';
import { FUEL_DENSITY_JETA_KG_PER_LITER } from '../../../utils/constants';

export const LN_FTM: AircraftConfig = {
  registration: 'LN-FTM',
  model: 'Diamond DA40 NG',
  modelType: 'da40-ng',
  manufacturer: 'Diamond',

  // Aircraft-specific values (from weight & balance sheet)
  emptyWeight: 900, // kg
  emptyCG: 95.39, // inches (2180.8 kgm / 900 kg = 2.423m)

  // Shared configuration
  stations: da40Stations,
  envelope: da40Envelope,
  maxTakeoffWeight: 1310, // kg (MTOW)
  fuelCapacity: 155.2, // liters (147.6 liters usable)
  fuelArm: 103.54, // inches (2.63m from datum)
  fuelType: 'jet-a',
  fuelDensity: FUEL_DENSITY_JETA_KG_PER_LITER,
  defaultUnit: 'kg',
};
