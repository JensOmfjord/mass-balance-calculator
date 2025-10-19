import { StationResult } from './Station';

export interface MassBalanceResult {
  totalWeight: number;
  totalMoment: number;
  cgPosition: number;
  isWithinEnvelope: boolean;
  exceedsMaxWeight: boolean;
  stations: StationResult[];
  emptyWeight: number;
  emptyMoment: number;
}

export interface MassBalanceInput {
  aircraftRegistration: string;
  stationWeights: Record<string, number>; // stationId -> weight
  fuelWeight: number;
}
