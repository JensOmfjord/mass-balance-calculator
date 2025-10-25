import { Station } from '../../../models/Station';

export const da40Stations: Station[] = [
  {
    id: 'frontSeats',
    name: 'Front Seats',
    arm: 91.73, // 2.330m from datum
    maxWeight: 240, // kg (2 x 120 kg)
  },
  {
    id: 'rearSeats',
    name: 'Rear Seats',
    arm: 127.95, // 3.25m from datum
    maxWeight: 240, // kg (2 x 120 kg)
  },
  {
    id: 'baggageStandard',
    name: 'Baggage (Standard)',
    arm: 143.70, // 3.65m from datum
    maxWeight: 20, // kg
  },
  {
    id: 'baggageExtForward',
    name: 'Baggage Ext (Forward)',
    arm: 153.15, // 3.89m from datum
    maxWeight: 20, // kg
  },
  {
    id: 'baggageExtAft',
    name: 'Baggage Ext (Aft)',
    arm: 178.74, // 4.54m from datum
    maxWeight: 20, // kg
  },
];
