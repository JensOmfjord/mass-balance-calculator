export type UnitSystem = 'kg' | 'lbs';

export interface Station {
  id: string;
  name: string;
  arm: number; // Distance from datum in inches
  maxWeight: number; // Maximum weight allowed at this station
}

export interface StationInput {
  stationId: string;
  weight: number;
}

export interface StationResult {
  station: Station;
  weight: number;
  moment: number;
}
