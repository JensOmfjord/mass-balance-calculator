import {
  LandingCorrections,
  LandingPerformanceData,
  PerformanceData,
  PerformanceTable,
  PerformanceTableRow,
  TakeoffCorrections,
  TakeoffPerformanceData,
} from '../../../models/Performance';

// Tecnam P2002JF take-off and landing performance
// Source: Tecnam P2002JF AFM, Section 5 (3rd Edition, Rev. 0), MTOW = 620 kg
// All distances in meters, indexed by pressure altitude (ft) and OAT (deg C)
// Take-off: flaps T/O, power full forward, 42 KIAS lift-off, 52 KIAS over 50 ft
// Landing: flaps LAND, power idle, 51 KIAS short final
//
// NOTE: The AFM publishes distances for a dry, level GRASS runway. Values below
// have been converted to a PAVED runway baseline (ground roll divided by 1/0.94,
// per the AFM's "-6% to ground roll" paved correction) so the grass corrections
// can be applied additively as the calculator expects. The airborne portion is
// unchanged. Wind corrections (absolute m/kt in the AFM) are converted to
// percent-per-knot using the ISA sea-level reference distance.

const OATS_C = [-25, 0, 25, 50];

const row = (
  pressureAltitudeFt: number,
  groundRollM: number[],
  distanceM: number[],
  isaGroundRollM: number,
  isaDistanceM: number
): PerformanceTableRow => ({
  pressureAltitudeFt,
  oatsC: OATS_C,
  groundRollM,
  distanceM,
  isa: { groundRollM: isaGroundRollM, distanceM: isaDistanceM },
});

// ===== TAKE-OFF (AFM pages W5-8 to W5-10) =====

const takeoffTable620: PerformanceTable = {
  weightKg: 620,
  rows: [
    row(0, [164, 216, 279, 352], [262, 348, 451, 574], 252, 407),
    row(1000, [180, 237, 305, 387], [288, 382, 496, 633], 271, 439),
    row(2000, [198, 261, 336, 427], [317, 421, 546, 698], 293, 474),
    row(3000, [217, 286, 370, 470], [349, 463, 602, 770], 315, 511),
    row(4000, [239, 315, 407, 518], [384, 511, 665, 851], 339, 551),
    row(5000, [263, 348, 450, 572], [424, 564, 735, 941], 367, 596),
    row(6000, [289, 383, 496, 632], [467, 623, 813, 1043], 396, 645),
    row(7000, [319, 422, 548, 699], [517, 689, 900, 1156], 428, 698),
    row(8000, [352, 467, 606, 773], [572, 763, 998, 1282], 463, 756),
    row(9000, [389, 517, 671, 857], [633, 846, 1108, 1425], 501, 820),
    row(10000, [431, 572, 745, 952], [702, 939, 1231, 1586], 543, 890),
  ],
};

const takeoffTable550: PerformanceTable = {
  weightKg: 550,
  rows: [
    row(0, [120, 159, 204, 259], [192, 255, 330, 421], 185, 298),
    row(1000, [132, 173, 224, 284], [211, 279, 363, 463], 199, 321),
    row(2000, [145, 190, 246, 313], [232, 308, 400, 511], 214, 347),
    row(3000, [160, 210, 271, 344], [256, 340, 441, 565], 231, 374),
    row(4000, [174, 231, 299, 380], [281, 374, 487, 624], 249, 404),
    row(5000, [193, 254, 329, 419], [311, 413, 539, 689], 268, 437),
    row(6000, [212, 281, 364, 463], [343, 457, 596, 764], 290, 472),
    row(7000, [234, 310, 401, 512], [379, 505, 659, 847], 314, 511),
    row(8000, [259, 343, 444, 567], [419, 559, 731, 939], 339, 553),
    row(9000, [285, 379, 491, 629], [463, 620, 811, 1044], 367, 600),
    row(10000, [316, 419, 546, 697], [514, 687, 902, 1162], 398, 651),
  ],
};

const takeoffTable500: PerformanceTable = {
  weightKg: 500,
  rows: [
    row(0, [94, 123, 160, 201], [150, 198, 258, 328], 144, 233),
    row(1000, [103, 135, 174, 221], [165, 218, 283, 361], 155, 251),
    row(2000, [113, 149, 193, 244], [181, 240, 313, 399], 167, 271),
    row(3000, [124, 164, 212, 268], [199, 265, 345, 440], 180, 292),
    row(4000, [136, 180, 233, 296], [220, 292, 380, 487], 195, 316),
    row(5000, [150, 199, 257, 327], [242, 322, 420, 539], 210, 341),
    row(6000, [166, 219, 284, 361], [267, 356, 465, 596], 227, 369),
    row(7000, [183, 241, 314, 399], [296, 393, 515, 661], 245, 399),
    row(8000, [201, 267, 347, 443], [327, 436, 571, 734], 265, 432),
    row(9000, [222, 296, 384, 490], [361, 484, 633, 814], 286, 468),
    row(10000, [246, 327, 426, 545], [401, 537, 704, 907], 311, 509),
  ],
};

// ===== LANDING (AFM pages W5-15 to W5-17) =====

const landingTable620: PerformanceTable = {
  weightKg: 620,
  rows: [
    row(0, [150, 165, 181, 196], [286, 315, 344, 373], 174, 332),
    row(1000, [155, 171, 187, 203], [297, 327, 356, 386], 180, 343),
    row(2000, [162, 178, 195, 211], [308, 339, 370, 401], 185, 353),
    row(3000, [168, 184, 201, 218], [319, 352, 384, 416], 190, 363),
    row(4000, [174, 191, 209, 227], [331, 364, 399, 432], 197, 375),
    row(5000, [181, 199, 217, 235], [344, 379, 413, 448], 202, 386),
    row(6000, [187, 206, 226, 245], [357, 393, 430, 466], 209, 398),
    row(7000, [195, 214, 234, 253], [371, 409, 446, 483], 215, 410),
    row(8000, [202, 222, 243, 264], [385, 424, 464, 502], 222, 423),
    row(9000, [211, 231, 252, 273], [401, 441, 481, 521], 229, 437),
    row(10000, [218, 240, 263, 284], [416, 458, 500, 542], 236, 450),
  ],
};

const landingTable550: PerformanceTable = {
  weightKg: 550,
  rows: [
    row(0, [118, 130, 143, 154], [225, 248, 271, 293], 137, 261),
    row(1000, [122, 135, 147, 160], [233, 257, 281, 305], 141, 269),
    row(2000, [128, 140, 153, 166], [243, 266, 291, 316], 146, 278),
    row(3000, [132, 146, 159, 171], [251, 277, 303, 327], 150, 286),
    row(4000, [137, 151, 165, 179], [261, 287, 314, 340], 154, 294),
    row(5000, [143, 156, 170, 185], [271, 298, 325, 353], 160, 304),
    row(6000, [148, 163, 178, 193], [281, 310, 338, 367], 164, 313),
    row(7000, [153, 169, 184, 200], [292, 321, 351, 380], 169, 323),
    row(8000, [160, 176, 191, 207], [304, 334, 364, 395], 174, 332),
    row(9000, [165, 182, 199, 215], [315, 347, 379, 411], 180, 344),
    row(10000, [172, 189, 206, 223], [327, 360, 393, 426], 186, 354),
  ],
};

const landingTable500: PerformanceTable = {
  weightKg: 500,
  rows: [
    row(0, [98, 107, 117, 128], [186, 205, 224, 243], 114, 216),
    row(1000, [101, 112, 121, 132], [193, 213, 232, 252], 117, 223),
    row(2000, [105, 116, 127, 137], [200, 221, 241, 261], 120, 229),
    row(3000, [109, 120, 131, 141], [208, 228, 250, 270], 124, 236),
    row(4000, [113, 124, 136, 147], [216, 237, 259, 281], 128, 244),
    row(5000, [117, 130, 141, 153], [224, 247, 268, 291], 132, 251),
    row(6000, [122, 134, 147, 159], [232, 256, 279, 303], 136, 259),
    row(7000, [127, 139, 152, 165], [242, 265, 290, 314], 140, 266),
    row(8000, [132, 145, 159, 171], [251, 276, 302, 326], 145, 275),
    row(9000, [136, 150, 164, 178], [260, 287, 313, 340], 149, 284),
    row(10000, [143, 156, 170, 185], [271, 298, 325, 352], 153, 293),
  ],
};

const takeoffCorrections: TakeoffCorrections = {
  wind: {
    headwindPercentPerKt: -2.5 / 407, // AFM: -2.5 m per kt, relative to ISA S.L. 620 kg distance
    tailwindPercentPerKt: 10 / 407, // AFM: +10 m per kt
  },
  grass: {
    dryShortGroundRollPercent: 6.4, // AFM grass baseline: paved is -6% to ground roll
    dryMediumGroundRollPercent: 15, // not published - conservative estimate
    dryLongGroundRollPercent: 30, // not published - conservative estimate
    wetPercentOfDryGrass: 20, // not published - conservative estimate (as DA40 NG AFM)
    noTakeoffAboveCm: 25, // not published - carried from DA40 NG as conservative limit
  },
  softGroundGroundRollPercent: 50,
  uphillSlopeGroundRollPercentPerPercent: 5, // AFM: +5% to ground roll per +1% slope
  wheelFairings: { groundRollMeters: 0, distanceMeters: 0 }, // not published for this model
};

const landingCorrections: LandingCorrections = {
  wind: {
    headwindPercentPerKt: -5 / 332, // AFM: -5 m per kt, relative to ISA S.L. 620 kg distance
    tailwindPercentPerKt: 11 / 332, // AFM: +11 m per kt
  },
  pavedWetPercent: 15, // not published - conservative estimate (as DA40 NG AFM)
  grass: {
    dryShortGroundRollPercent: 6.4, // AFM grass baseline: paved is -2% to ground roll
    dryLongGroundRollPercent: 45, // not published - conservative estimate (as DA40 NG AFM)
    wetOrSoftGroundRollPercent: 15, // not published - conservative estimate (as DA40 NG AFM)
  },
  downhillSlopeGroundRollPercentPerPercent: 2.5, // AFM: -2.5% to ground roll per +1% slope
};

export const tecnam2002JfPerformance: PerformanceData = {
  source: 'Tecnam P2002JF AFM, Section 5 (3rd Edition, Rev. 0)',
  takeoff: {
    conditions: 'Flaps T/O, power full forward, dry level runway, no wind',
    referenceWeightsKg: [620, 550, 500],
    speedsByWeight: [
      { weightKg: 620, speeds: { vR: 42, v50: 52 } },
      { weightKg: 550, speeds: { vR: 42, v50: 52 } },
      { weightKg: 500, speeds: { vR: 42, v50: 52 } },
    ],
    tables: [takeoffTable620, takeoffTable550, takeoffTable500],
    safetyFactor: 1.25,
    corrections: takeoffCorrections,
    cautions: [
      'AFM distances are published for a dry, level GRASS runway - tables have been converted to a paved baseline (ground roll / 0.94)',
      'Maximum demonstrated crosswind: 22 kt',
      'Grass corrections for medium/long grass, wet grass and grass above 25 cm are conservative estimates - not published in the AFM',
      'AFM wind corrections are absolute (-2.5 m/kt headwind, +10 m/kt tailwind) - converted to percent of the ISA sea-level distance',
      'Values outside the OAT range -25 to +50 deg C are not published',
    ],
  },
  landing: {
    conditions: 'Flaps LAND, power idle, dry level runway, no wind',
    referenceWeightsKg: [620, 550, 500],
    speedsByWeight: [
      { weightKg: 620, speeds: { vREF: 51 } },
      { weightKg: 550, speeds: { vREF: 51 } },
      { weightKg: 500, speeds: { vREF: 51 } },
    ],
    tables: [landingTable620, landingTable550, landingTable500],
    safetyFactor: 1.43,
    corrections: landingCorrections,
    cautions: [
      'AFM distances are published for a dry, level GRASS runway - tables have been converted to a paved baseline (ground roll / 0.94)',
      'Maximum demonstrated crosswind: 22 kt',
      'Long-grass, wet/soft-grass and wet-paved corrections are conservative estimates - not published in the AFM',
      'AFM wind corrections are absolute (-5 m/kt headwind, +11 m/kt tailwind) - converted to percent of the ISA sea-level distance',
      'Values outside the OAT range -25 to +50 deg C are not published',
    ],
  },
};
