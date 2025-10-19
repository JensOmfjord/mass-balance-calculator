import { AircraftConfig } from '../../../models/Aircraft';
import { da40Stations } from '../base/stations';
import { da40Envelope } from '../base/envelope';

export const LN_FTS: AircraftConfig = {
  registration: 'LN-FTS',
  model: 'Diamond DA40 NG',
  modelType: 'da40-ng',
  manufacturer: 'Diamond',

  // Aircraft-specific values (from weight & balance sheet)
  emptyWeight: 929.3, // kg
  emptyCG: 95.83, // inches (2262.3 kgm / 929.3 kg = 2.434m)

  // Shared configuration
  stations: da40Stations,
  envelope: da40Envelope,
  maxTakeoffWeight: 1310, // kg (MTOW)
  fuelCapacity: 155.2, // liters (147.6 liters usable)
  fuelArm: 103.54, // inches (2.63m from datum)
  defaultUnit: 'kg',
};
