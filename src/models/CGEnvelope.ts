export interface CGEnvelopePoint {
  weight: number; // Weight in kg or lbs
  cgMin: number; // Minimum CG position in inches
  cgMax: number; // Maximum CG position in inches
}

export type CGEnvelope = CGEnvelopePoint[];
