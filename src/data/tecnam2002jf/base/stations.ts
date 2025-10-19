import { Station } from '../../../models/Station';

export const tecnamStations: Station[] = [
  {
    id: 'pilot',
    name: 'Pilot',
    arm: 70.87, // 1.8m from datum
    maxWeight: 120, // kg
  },
  {
    id: 'copilot',
    name: 'Co-Pilot',
    arm: 70.87, // 1.8m from datum
    maxWeight: 120, // kg
  },
  {
    id: 'baggage',
    name: 'Baggage',
    arm: 88.98, // 2.26m from datum
    maxWeight: 20, // kg
  },
];
