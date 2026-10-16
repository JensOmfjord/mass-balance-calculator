import {
  LandingCorrections,
  LandingPerformanceData,
  PerformanceData,
  PerformanceTable,
  PerformanceTableRow,
  TakeoffCorrections,
  TakeoffPerformanceData,
} from '../../../models/Performance';

// Diamond DA40 NG take-off and landing performance
// Source: DA40 NG Airplane Flight Manual, Section 5.3
// All distances in meters, indexed by pressure altitude (ft) and OAT (deg C)
// Take-off: flaps T/O, power MAX, dry paved level runway
// Landing: flaps LDG, power IDLE, dry paved level runway

const OAT_SETS: Record<number, number[]> = {
  6: [0, 10, 20, 30, 40, 50],
  5: [0, 10, 20, 30, 40],
  4: [0, 10, 20, 30],
};

const row = (
  pressureAltitudeFt: number,
  groundRollM: number[],
  distanceM: number[],
  isaGroundRollM: number,
  isaDistanceM: number
): PerformanceTableRow => ({
  pressureAltitudeFt,
  oatsC: OAT_SETS[groundRollM.length],
  groundRollM,
  distanceM,
  isa: { groundRollM: isaGroundRollM, distanceM: isaDistanceM },
});

const takeoffTable1310: PerformanceTable = {
  weightKg: 1310,
  rows: [
    row(0, [365, 385, 410, 430, 460, 495], [550, 580, 610, 640, 680, 720], 397, 590),
    row(1000, [390, 410, 435, 465, 500, 535], [580, 610, 640, 680, 730, 770], 418, 616),
    row(2000, [415, 440, 465, 500, 540, 575], [610, 640, 680, 730, 780, 830], 439, 646),
    row(3000, [440, 470, 500, 540, 580, 625], [650, 680, 720, 780, 840, 890], 463, 677),
    row(4000, [470, 500, 540, 590, 630, 680], [690, 720, 780, 840, 900, 960], 490, 708),
    row(5000, [505, 535, 585, 640, 685], [730, 770, 840, 910, 970], 519, 745),
    row(6000, [540, 585, 640, 700, 750], [770, 830, 900, 980, 1040], 549, 783),
    row(7000, [580, 640, 700, 765, 820], [820, 900, 980, 1060, 1130], 585, 828),
    row(8000, [635, 700, 770, 845, 900], [890, 970, 1060, 1160, 1230], 628, 881),
    row(9000, [695, 770, 850, 915, 990], [970, 1060, 1160, 1250, 1330], 674, 937),
    row(10000, [765, 850, 910, 995], [1050, 1160, 1240, 1340], 729, 1000),
  ],
};

const takeoffTable1280: PerformanceTable = {
  weightKg: 1280,
  rows: [
    row(0, [365, 385, 405, 425, 460, 490], [540, 570, 600, 630, 670, 710], 391, 581),
    row(1000, [390, 405, 430, 455, 495, 530], [570, 600, 630, 670, 720, 760], 413, 601),
    row(2000, [415, 435, 460, 495, 530, 570], [595, 630, 670, 715, 770, 825], 436, 625),
    row(3000, [440, 465, 500, 535, 575, 620], [630, 665, 710, 765, 825, 885], 460, 655),
    row(4000, [465, 500, 540, 580, 630, 675], [665, 710, 760, 820, 885, 950], 486, 686),
    row(5000, [500, 530, 580, 630, 675], [700, 740, 815, 895, 975], 513, 735),
    row(6000, [535, 580, 635, 695, 745], [745, 820, 905, 985, 1055], 544, 772),
    row(7000, [580, 635, 700, 760, 815], [795, 875, 960, 1060, 1150], 581, 820),
    row(8000, [625, 695, 760, 835, 900], [860, 950, 1055, 1165, 1255], 623, 870),
    row(9000, [675, 745, 820, 900, 975], [935, 1035, 1145, 1265, 1370], 668, 927),
    row(10000, [730, 815, 890, 995], [1015, 1125, 1245, 1385], 723, 992),
  ],
};

const takeoffTable1200: PerformanceTable = {
  weightKg: 1200,
  rows: [
    row(0, [325, 345, 365, 385, 410, 440], [490, 520, 540, 570, 610, 640], 352, 524),
    row(1000, [345, 365, 390, 415, 445, 475], [520, 550, 570, 610, 650, 690], 371, 548),
    row(2000, [365, 390, 415, 445, 480, 515], [550, 580, 610, 650, 700, 740], 391, 576),
    row(3000, [390, 415, 445, 485, 520, 560], [580, 610, 650, 700, 750, 800], 413, 602),
    row(4000, [420, 445, 480, 525, 565, 610], [610, 640, 700, 750, 800, 860], 438, 633),
    row(5000, [450, 480, 525, 575, 615], [650, 690, 750, 810, 870], 462, 666),
    row(6000, [480, 525, 575, 630, 670], [690, 740, 810, 880, 940], 491, 700),
    row(7000, [520, 570, 630, 690, 735], [740, 800, 880, 960, 1010], 524, 741),
    row(8000, [570, 630, 695, 760, 810], [800, 870, 960, 1040, 1110], 563, 789),
    row(9000, [625, 695, 765, 830, 895], [870, 950, 1050, 1120, 1200], 606, 839),
    row(10000, [690, 765, 825, 900], [950, 1040, 1110, 1210], 656, 899),
  ],
};

const takeoffTable1100: PerformanceTable = {
  weightKg: 1100,
  rows: [
    row(0, [280, 295, 310, 330, 355, 380], [430, 450, 470, 490, 530, 560], 303, 457),
    row(1000, [295, 315, 335, 355, 385, 410], [450, 470, 500, 530, 570, 600], 318, 478),
    row(2000, [315, 335, 355, 385, 415, 445], [480, 500, 530, 570, 600, 650], 336, 498),
    row(3000, [340, 360, 385, 415, 450, 480], [500, 530, 560, 610, 650, 690], 356, 523),
    row(4000, [360, 385, 415, 455, 490, 525], [530, 560, 600, 650, 700, 750], 377, 549),
    row(5000, [385, 415, 455, 495, 530], [560, 600, 650, 710, 750], 399, 578),
    row(6000, [415, 455, 495, 545, 580], [600, 650, 700, 770, 820], 423, 608),
    row(7000, [450, 495, 545, 600, 640], [640, 700, 770, 830, 890], 452, 644),
    row(8000, [490, 545, 605, 660, 705], [690, 760, 840, 910, 970], 485, 684),
    row(9000, [540, 600, 665, 725, 780], [760, 830, 910, 980, 1050], 523, 730),
    row(10000, [600, 665, 715, 785], [830, 910, 970, 1060], 567, 786),
  ],
};

const landingTable1310: PerformanceTable = {
  weightKg: 1310,
  rows: [
    row(0, [305, 315, 325, 335, 355, 375], [620, 650, 670, 680, 720, 760], 318, 650),
    row(1000, [315, 325, 335, 350, 370, 395], [640, 660, 680, 700, 740, 790], 327, 660),
    row(2000, [325, 335, 350, 370, 390, 415], [650, 670, 690, 730, 770, 810], 336, 670),
    row(3000, [335, 350, 365, 385, 410, 435], [670, 690, 710, 750, 800, 840], 345, 681),
    row(4000, [350, 360, 380, 405, 430, 455], [680, 700, 740, 780, 830, 870], 356, 692),
    row(5000, [360, 375, 400, 425, 450], [700, 720, 770, 810, 860], 366, 704),
    row(6000, [375, 395, 420, 445, 475], [710, 750, 790, 840, 890], 378, 717),
    row(7000, [400, 430, 460, 485, 515], [750, 790, 840, 890, 940], 404, 746),
    row(8000, [455, 485, 520, 550, 585], [810, 870, 920, 970, 1020], 452, 806),
    row(9000, [520, 555, 585, 625, 660], [890, 950, 1000, 1060, 1120], 508, 875),
    row(10000, [580, 620, 655, 695], [970, 1030, 1090, 1140], 565, 936),
  ],
};

const landingTable1280: PerformanceTable = {
  weightKg: 1280,
  rows: [
    row(0, [295, 305, 320, 330, 345, 365], [610, 630, 650, 670, 710, 750], 310, 639),
    row(1000, [305, 320, 330, 340, 365, 385], [630, 650, 670, 690, 730, 770], 320, 647),
    row(2000, [320, 330, 340, 360, 380, 405], [640, 660, 680, 720, 750, 800], 329, 657),
    row(3000, [330, 340, 355, 375, 400, 425], [650, 670, 700, 740, 780, 830], 338, 667),
    row(4000, [340, 355, 375, 395, 420, 445], [670, 690, 720, 770, 810, 860], 348, 679),
    row(5000, [355, 370, 390, 415, 440], [680, 710, 750, 800, 840], 359, 690),
    row(6000, [365, 385, 415, 440, 465], [700, 740, 780, 830, 870], 370, 702),
    row(7000, [395, 420, 450, 475, 505], [730, 780, 820, 870, 920], 396, 732),
    row(8000, [450, 480, 510, 540, 570], [800, 850, 900, 950, 1010], 445, 792),
    row(9000, [510, 545, 580, 615, 650], [880, 930, 990, 1040, 1100], 501, 861),
    row(10000, [575, 610, 650, 685], [960, 1010, 1070, 1130], 557, 925),
  ],
};

const landingTable1200: PerformanceTable = {
  weightKg: 1200,
  rows: [
    row(0, [280, 290, 300, 310, 325, 345], [600, 620, 640, 660, 690, 730], 293, 626),
    row(1000, [290, 300, 310, 320, 340, 360], [610, 630, 650, 680, 720, 760], 301, 633),
    row(2000, [300, 310, 320, 340, 360, 380], [620, 640, 660, 700, 740, 780], 310, 639),
    row(3000, [310, 320, 335, 355, 375, 400], [630, 650, 680, 720, 760, 800], 319, 649),
    row(4000, [320, 335, 350, 375, 395, 420], [650, 670, 700, 740, 790, 830], 329, 657),
    row(5000, [335, 345, 370, 395, 415], [660, 690, 730, 770, 810], 338, 668),
    row(6000, [345, 365, 390, 415, 435], [680, 710, 750, 800, 840], 348, 679),
    row(7000, [370, 400, 425, 450, 475], [710, 750, 790, 840, 890], 373, 707),
    row(8000, [425, 455, 485, 515, 545], [780, 820, 870, 920, 980], 423, 768),
    row(9000, [490, 525, 555, 590, 620], [860, 910, 960, 1020, 1070], 482, 839),
    row(10000, [560, 590, 630, 665], [930, 990, 1050, 1100], 540, 905),
  ],
};

const landingTable1100: PerformanceTable = {
  weightKg: 1100,
  rows: [
    row(0, [255, 265, 275, 285, 300, 320], [590, 610, 630, 640, 680, 720], 270, 612),
    row(1000, [265, 275, 285, 295, 315, 335], [590, 610, 630, 660, 690, 730], 278, 615),
    row(2000, [275, 285, 295, 310, 330, 350], [600, 620, 640, 670, 710, 750], 286, 617),
    row(3000, [285, 295, 310, 330, 345, 370], [610, 630, 650, 690, 730, 770], 294, 623),
    row(4000, [295, 305, 325, 345, 365, 385], [620, 640, 670, 710, 750, 800], 302, 630),
    row(5000, [305, 320, 340, 360, 385], [630, 650, 690, 730, 780], 311, 637),
    row(6000, [320, 335, 355, 380, 405], [640, 680, 720, 760, 800], 321, 644),
    row(7000, [345, 365, 390, 415, 440], [670, 710, 750, 800, 840], 345, 671),
    row(8000, [400, 425, 450, 480, 510], [740, 790, 840, 880, 930], 394, 736),
    row(9000, [465, 495, 525, 560, 590], [830, 880, 930, 980, 1030], 457, 810),
    row(10000, [535, 565, 600, 635], [910, 960, 1010, 1070], 518, 880),
  ],
};

const takeoffCorrections: TakeoffCorrections = {
  wind: {
    headwindPercentPerKt: -10 / 12,
    tailwindPercentPerKt: 10 / 2,
  },
  grass: {
    dryShortGroundRollPercent: 10,
    dryMediumGroundRollPercent: 30,
    dryLongGroundRollPercent: 45,
    wetPercentOfDryGrass: 20,
    noTakeoffAboveCm: 25,
  },
  softGroundGroundRollPercent: 50,
  uphillSlopeGroundRollPercentPerPercent: 15,
  wheelFairings: { groundRollMeters: 20, distanceMeters: 30 },
};

const landingCorrections: LandingCorrections = {
  wind: {
    headwindPercentPerKt: -10 / 20,
    tailwindPercentPerKt: 10 / 3,
  },
  pavedWetPercent: 15,
  grass: {
    dryShortGroundRollPercent: 30,
    dryLongGroundRollPercent: 45,
    wetOrSoftGroundRollPercent: 15,
  },
  downhillSlopeGroundRollPercentPerPercent: 10,
};

export const da40NgPerformance: PerformanceData = {
  source: 'Diamond DA40 NG AFM, Section 5.3',
  takeoff: {
    conditions: 'Flaps T/O, power MAX, dry paved level runway, no wind',
    referenceWeightsKg: [1310, 1280, 1200, 1100],
    speedsByWeight: [
      { weightKg: 1310, speeds: { vR: 67, v50: 72 } },
      { weightKg: 1280, speeds: { vR: 67, v50: 72 } },
      { weightKg: 1200, speeds: { vR: 65, v50: 70 } },
      { weightKg: 1100, speeds: { vR: 61, v50: 67 } },
    ],
    tables: [takeoffTable1310, takeoffTable1280, takeoffTable1200, takeoffTable1100],
    safetyFactor: 1.25,
    corrections: takeoffCorrections,
    cautions: [
      'Published values are for dry, paved, level runway - other conditions may increase distances significantly',
      'Grass higher than 25 cm: no take-off',
      'Published slope data is net slope - verify before flight',
      'Wet grass: dry grass ground roll value increased by 20%',
    ],
  },
  landing: {
    conditions: 'Flaps LDG, power IDLE, dry paved level runway, no wind',
    referenceWeightsKg: [1310, 1280, 1200, 1100],
    speedsByWeight: [
      { weightKg: 1310, speeds: { vREF: 77 } },
      { weightKg: 1280, speeds: { vREF: 77 } },
      { weightKg: 1200, speeds: { vREF: 76 } },
      { weightKg: 1100, speeds: { vREF: 72 } },
    ],
    tables: [landingTable1310, landingTable1280, landingTable1200, landingTable1100],
    safetyFactor: 1.43,
    corrections: landingCorrections,
    cautions: [
      'Published values are for dry, paved, level runway - other conditions may increase distances significantly',
      'Grass corrections apply to ground roll',
      'Grass wet or soft: +15% ground roll (as published in AFM)',
    ],
  },
};
