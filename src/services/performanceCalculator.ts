import type {
  FieldConditions,
  LandingPerformanceData,
  PerformanceData,
  PerformanceInput,
  PerformanceStatus,
  PerformanceTable,
  PerformanceTableRow,
  PhasePerformance,
  ReferenceSpeed,
  TakeoffPerformanceData,
  WindCorrection,
} from '../models/Performance';

const ISA_SEA_LEVEL_TEMP_C = 15;
const ISA_LAPSE_C_PER_1000FT = 1.98;
const FT_PER_HPA = 27;
const FT_PER_C = 118.8;
const CAUTION_MARGIN_FRACTION = 0.1;

export const isaTempC = (pressureAltitudeFt: number): number =>
  ISA_SEA_LEVEL_TEMP_C - (ISA_LAPSE_C_PER_1000FT * pressureAltitudeFt) / 1000;

export const pressureAltitudeFt = (elevationFt: number, qnhHpa: number): number =>
  elevationFt + (1013.25 - qnhHpa) * FT_PER_HPA;

export const densityAltitudeFt = (paFt: number, oatC: number): number =>
  paFt + FT_PER_C * (oatC - isaTempC(paFt));

export const createDefaultFieldConditions = (): FieldConditions => ({
  elevationFt: 0,
  qnhHpa: 1013,
  oatC: 15,
  windKts: 0,
  slopePercent: 0,
  surface: 'paved',
  pavedWet: false,
  grassCondition: 'dry-short',
  softGround: false,
  wheelFairings: true,
  runwayLengthM: 0,
});

interface Distances {
  groundRollM: number;
  distanceM: number;
}

const interpolate = (x: number, x0: number, x1: number, y0: number, y1: number): number => {
  if (x1 === x0) return y0;
  return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
};

const lookupInRow = (row: PerformanceTableRow, oatC: number): Distances => {
  const points: { tempC: number; gr: number; dist: number }[] = [
    { tempC: isaTempC(row.pressureAltitudeFt), gr: row.isa.groundRollM, dist: row.isa.distanceM },
    ...row.oatsC.map((t, i) => ({ tempC: t, gr: row.groundRollM[i], dist: row.distanceM[i] })),
  ];
  points.sort((a, b) => a.tempC - b.tempC);

  const first = points[0];
  const last = points[points.length - 1];
  if (oatC <= first.tempC) return { groundRollM: first.gr, distanceM: first.dist };
  if (oatC >= last.tempC) return { groundRollM: last.gr, distanceM: last.dist };

  for (let i = 1; i < points.length; i++) {
    if (oatC <= points[i].tempC) {
      return {
        groundRollM: interpolate(oatC, points[i - 1].tempC, points[i].tempC, points[i - 1].gr, points[i].gr),
        distanceM: interpolate(oatC, points[i - 1].tempC, points[i].tempC, points[i - 1].dist, points[i].dist),
      };
    }
  }
  return { groundRollM: last.gr, distanceM: last.dist };
};

const lookupAtAltitude = (table: PerformanceTable, paFt: number, oatC: number): Distances => {
  const rows = table.rows;
  const clampedPa = Math.min(
    Math.max(paFt, rows[0].pressureAltitudeFt),
    rows[rows.length - 1].pressureAltitudeFt
  );

  const upperIdx = rows.findIndex(r => r.pressureAltitudeFt >= clampedPa);
  if (upperIdx === 0) return lookupInRow(rows[0], oatC);
  if (upperIdx === -1) return lookupInRow(rows[rows.length - 1], oatC);

  const lower = rows[upperIdx - 1];
  const upper = rows[upperIdx];
  const frac =
    (clampedPa - lower.pressureAltitudeFt) / (upper.pressureAltitudeFt - lower.pressureAltitudeFt);
  const a = lookupInRow(lower, oatC);
  const b = lookupInRow(upper, oatC);

  return {
    groundRollM: a.groundRollM + (b.groundRollM - a.groundRollM) * frac,
    distanceM: a.distanceM + (b.distanceM - a.distanceM) * frac,
  };
};

const lookupAtWeight = (
  phase: TakeoffPerformanceData | LandingPerformanceData,
  weightKg: number,
  paFt: number,
  oatC: number
): Distances => {
  const sorted = [...phase.tables].sort((a, b) => b.weightKg - a.weightKg);
  const heaviest = sorted[0];
  const lightest = sorted[sorted.length - 1];

  if (weightKg >= heaviest.weightKg) return lookupAtAltitude(heaviest, paFt, oatC);
  if (weightKg <= lightest.weightKg) return lookupAtAltitude(lightest, paFt, oatC);

  for (let i = 1; i < sorted.length; i++) {
    if (weightKg >= sorted[i].weightKg) {
      const heavier = sorted[i - 1];
      const lighter = sorted[i];
      const frac = (heavier.weightKg - weightKg) / (heavier.weightKg - lighter.weightKg);
      const a = lookupAtAltitude(heavier, paFt, oatC);
      const b = lookupAtAltitude(lighter, paFt, oatC);

      return {
        groundRollM: a.groundRollM + (b.groundRollM - a.groundRollM) * frac,
        distanceM: a.distanceM + (b.distanceM - a.distanceM) * frac,
      };
    }
  }
  return lookupAtAltitude(lightest, paFt, oatC);
};

const windFactor = (windKts: number, corr: WindCorrection): number => {
  if (windKts >= 0) return 1 + (corr.headwindPercentPerKt * windKts) / 100;
  return 1 + (corr.tailwindPercentPerKt * -windKts) / 100;
};

const lookupSpeeds = (
  phase: TakeoffPerformanceData | LandingPerformanceData,
  weightKg: number
): ReferenceSpeed[] => {
  const sorted = [...phase.speedsByWeight].sort((a, b) => b.weightKg - a.weightKg);
  const labels = Object.keys(sorted[0].speeds);
  let values: Record<string, number> = {};

  if (weightKg >= sorted[0].weightKg) {
    values = { ...sorted[0].speeds };
  } else if (weightKg <= sorted[sorted.length - 1].weightKg) {
    values = { ...sorted[sorted.length - 1].speeds };
  } else {
    for (let i = 1; i < sorted.length; i++) {
      if (weightKg >= sorted[i].weightKg) {
        const heavier = sorted[i - 1];
        const lighter = sorted[i];
        const frac = (heavier.weightKg - weightKg) / (heavier.weightKg - lighter.weightKg);
        labels.forEach(label => {
          values[label] = Math.round(
            heavier.speeds[label] + (lighter.speeds[label] - heavier.speeds[label]) * frac
          );
        });
        break;
      }
    }
  }

  return labels.map(label => ({ label, kias: values[label] }));
};

export const calculatePerformance = (
  performance: PerformanceData,
  input: PerformanceInput
): PhasePerformance => {
  const phase = input.phase === 'takeoff' ? performance.takeoff : performance.landing;
  const field = input.field;
  const notes: string[] = [];
  let unsafe = false;

  const paFt = Math.min(
    Math.max(pressureAltitudeFt(field.elevationFt, field.qnhHpa), 0),
    10000
  );
  const daFt = densityAltitudeFt(paFt, field.oatC);

  const ref = lookupAtWeight(phase, input.weightKg, paFt, field.oatC);
  const speeds = lookupSpeeds(phase, input.weightKg);

  const sortedTables = [...phase.tables].sort((a, b) => b.weightKg - a.weightKg);
  const heaviest = sortedTables[0].weightKg;
  const lightest = sortedTables[sortedTables.length - 1].weightKg;
  if (input.weightKg > heaviest) {
    notes.push(
      `Weight ${Math.round(input.weightKg)} kg above highest reference (${heaviest} kg) - using ${heaviest} kg values`
    );
  } else if (input.weightKg < lightest) {
    notes.push(
      `Weight below lowest reference (${lightest} kg) - using ${lightest} kg values (conservative)`
    );
  }
  if (pressureAltitudeFt(field.elevationFt, field.qnhHpa) > 10000) {
    notes.push('Pressure altitude above 10000 ft - clamped to 10000 ft values');
  }

  let groundRoll = ref.groundRollM;
  let distance = ref.distanceM;

  const wf = windFactor(field.windKts, phase.corrections.wind);
  groundRoll *= wf;
  distance *= wf;

  let airborne = distance - groundRoll;

  if (input.phase === 'takeoff') {
    const corr = performance.takeoff.corrections;

    if (field.surface === 'grass') {
      if (field.grassCondition === 'too-high') {
        unsafe = true;
        notes.push(`No take-off: grass higher than ${corr.grass.noTakeoffAboveCm} cm`);
      } else {
        let grassFactor: number;
        switch (field.grassCondition) {
          case 'dry-medium':
            grassFactor = 1 + corr.grass.dryMediumGroundRollPercent / 100;
            break;
          case 'dry-long':
            grassFactor = 1 + corr.grass.dryLongGroundRollPercent / 100;
            break;
          case 'wet-short':
            grassFactor =
              (1 + corr.grass.dryShortGroundRollPercent / 100) *
              (1 + corr.grass.wetPercentOfDryGrass / 100);
            break;
          case 'wet-medium':
            grassFactor =
              (1 + corr.grass.dryMediumGroundRollPercent / 100) *
              (1 + corr.grass.wetPercentOfDryGrass / 100);
            break;
          case 'wet-long':
            grassFactor =
              (1 + corr.grass.dryLongGroundRollPercent / 100) *
              (1 + corr.grass.wetPercentOfDryGrass / 100);
            break;
          case 'dry-short':
          default:
            grassFactor = 1 + corr.grass.dryShortGroundRollPercent / 100;
            break;
        }
        groundRoll *= grassFactor;
      }
    }

    if (field.softGround) {
      groundRoll *= 1 + corr.softGroundGroundRollPercent / 100;
      notes.push('Soft ground: +50% ground roll');
    }

    if (field.slopePercent > 0) {
      groundRoll *=
        1 + (corr.uphillSlopeGroundRollPercentPerPercent * field.slopePercent) / 100;
    }

    if (!field.wheelFairings) {
      groundRoll += corr.wheelFairings.groundRollMeters;
      airborne += corr.wheelFairings.distanceMeters - corr.wheelFairings.groundRollMeters;
      notes.push(
        `Without wheel fairings: +${corr.wheelFairings.groundRollMeters} m ground roll, +${corr.wheelFairings.distanceMeters} m distance`
      );
    }

    distance = groundRoll + airborne;
  } else {
    const corr = performance.landing.corrections;

    if (field.surface === 'paved' && field.pavedWet) {
      const wetFactor = 1 + corr.pavedWetPercent / 100;
      groundRoll *= wetFactor;
      distance *= wetFactor;
      airborne = distance - groundRoll;
      notes.push(`Wet paved runway: +${corr.pavedWetPercent}%`);
    }

    if (field.surface === 'grass') {
      const useWetOrSoft = field.grassCondition === 'wet' || field.softGround;
      if (useWetOrSoft) {
        groundRoll *= 1 + corr.grass.wetOrSoftGroundRollPercent / 100;
        notes.push(`Grass wet or soft: +${corr.grass.wetOrSoftGroundRollPercent}% ground roll`);
      } else {
        const grassFactor =
          field.grassCondition === 'dry-short'
            ? 1 + corr.grass.dryShortGroundRollPercent / 100
            : 1 + corr.grass.dryLongGroundRollPercent / 100;
        groundRoll *= grassFactor;
      }
    }

    if (field.slopePercent < 0) {
      groundRoll *=
        1 + (corr.downhillSlopeGroundRollPercentPerPercent * -field.slopePercent) / 100;
    }

    distance = groundRoll + airborne;
  }

  const factoredGroundRoll = groundRoll * phase.safetyFactor;
  const factoredDistance = distance * phase.safetyFactor;
  const margin = field.runwayLengthM - factoredDistance;

  let status: PerformanceStatus = 'ok';
  if (unsafe || margin < 0) {
    status = 'unsafe';
  } else if (margin < field.runwayLengthM * CAUTION_MARGIN_FRACTION) {
    status = 'caution';
  }

  return {
    referenceGroundRollM: ref.groundRollM,
    referenceDistanceM: ref.distanceM,
    correctedGroundRollM: groundRoll,
    correctedDistanceM: distance,
    factoredGroundRollM: factoredGroundRoll,
    factoredDistanceM: factoredDistance,
    marginM: margin,
    status,
    speeds,
    notes,
    pressureAltitudeFt: paFt,
    densityAltitudeFt: daFt,
  };
};
