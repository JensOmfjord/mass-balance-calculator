import { CGEnvelope } from '../../../models/CGEnvelope';

// CG envelope for Tecnam P2002JF
// Weight in kg, CG positions in inches from datum
// Forward limit: 26% CMA (1693mm = 66.65 inches)
// Aft limit: 32.5% CMA (1782mm = 70.16 inches)
export const tecnamEnvelope: CGEnvelope = [
  { weight: 580, cgMin: 66.65, cgMax: 70.16 },
  { weight: 600, cgMin: 66.65, cgMax: 70.16 },
  { weight: 620, cgMin: 66.65, cgMax: 70.16 },
];
