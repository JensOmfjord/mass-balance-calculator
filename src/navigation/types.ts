import { AircraftConfig } from '../models/Aircraft';

export type RootStackParamList = {
  Home: undefined;
  Calculator: { aircraft: AircraftConfig };
  Details: { aircraft: AircraftConfig };
  Performance: { aircraft: AircraftConfig };
};
