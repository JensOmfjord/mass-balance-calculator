import { CGEnvelope } from '../../../models/CGEnvelope';

// CG envelope for Diamond DA40 NG
// Weight in kg, CG positions in inches from datum
// Forward limit transitions from 2.40m (94.5") to 2.469m (97.2")
// Aft limit constant at 2.53m (99.6")
export const da40Envelope: CGEnvelope = [
  { weight: 940, cgMin: 94.49, cgMax: 99.61 },   // 2.40m to 2.53m
  { weight: 1080, cgMin: 94.49, cgMax: 99.61 },  // 2.40m to 2.53m
  { weight: 1310, cgMin: 97.20, cgMax: 99.61 },  // 2.469m to 2.53m
];
