
// type TCostFn = (lvl: number) => number;
// type TIncomeFn = (lvl: number) => number;

interface RevenuePart {
  cost: number;
  income: number;
  duration: number;
  durationRatio: number;
  incomeRation: number;
}

function lvlToStepMultiplier(lvl: number): number {
  let i: number = 0;
  let j: number = 0;
  const steps = [25, 50, 100];
  let step: number = steps[j];
  while (lvl >= step) {
    i++;
    j = (j + 1) % steps.length;
    step = steps[j] * (10 ** Math.floor (i / steps.length));
  }
  return  i;
}


function runesToIncomeBonus(runes: number): number {
  return 1 + (runes * 0.05);
}

function lvlToCost(lvl: number, initialCost: number): number {
  let cost: number = initialCost;
  for (let i = 0; i < lvl; i++) {
    cost = Math.ceil(cost * 1.03);
  }
  return cost;
}

function lvlToTotalCost(lvl: number, initialCost: number): number {
  let cost: number = initialCost;
  let totalCost: number = 0;
  for (let i = 0; i < lvl; i++) {
    totalCost += cost;
    cost = Math.ceil(cost * 1.03);
  }
  return totalCost;
}

function lvlToIncome(lvl: number, initialIncome: number): number {
  return initialIncome * (2 ** lvlToStepMultiplier(lvl)) * lvl * runesToIncomeBonus(BONUS_RUNES);
}

function lvlToDuration(lvl: number, initialDuration: number): number {
  return initialDuration * (0.8 ** lvlToStepMultiplier(lvl));
}

function lvlToIncomePerSecond(lvl: number, part: RevenuePart): number {
  return (lvlToIncome(lvl, part.income) * part.incomeRation)
  / (lvlToDuration(lvl, part.duration)  * part.durationRatio);
}

function lvlToRecoverDuration(lvl: number, part: RevenuePart): number {
  return recoverDuration(
    lvlToCost(lvl, part.cost),
    lvlToIncome(lvl, part.income) * part.incomeRation,
    lvlToDuration(lvl, part.duration)  * part.durationRatio
  );
}

function recoverDuration(
  cost: number,
  income: number,
  duration: number,
): number {
  return (cost * duration) / income;
}


function findBestLvl(part: RevenuePart): number {
  let i: number = -1;
  const data = new Float64Array(Array.from({ length: 300, }, (v: any, index: number) => lvlToRecoverDuration(index + 1, part)));
  let min: number = Number.POSITIVE_INFINITY;
  for (let j = 0, l = data.length; j < l; j++) {
    if (data[j] < min) {
      i = j;
      min = data[j];
    }
  }
  return i;
}

function listStats(lvl: number, part: RevenuePart): void {
  const cost: number = lvlToCost(lvl, part.cost);
  const income: number = lvlToIncome(lvl, part.income);
  const duration: number = lvlToDuration(lvl, part.duration);

  console.log('step', lvlToStepMultiplier(lvl));
  console.log('cost', cost);
  console.log('income', income);
  console.log('duration', duration);
  console.log('income / s', Math.floor(income / duration));
  console.log('recover duration', recoverDuration(cost, income, duration));
}

function getInitialPartsLvl(): number[] {
  const initialPartsLvl: number[] = parts.map(() => 0);
  initialPartsLvl[0] = 1;
  return initialPartsLvl;
}


function plotter(dataLists: Float64Array[]) {
  const canvas: HTMLCanvasElement = document.createElement('canvas');
  document.body.appendChild(canvas);
  const ctx: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;
  ctx.canvas.width = 1000;
  ctx.canvas.height = 1000;
  ctx.canvas.style.border = `2px solid black`;
  ctx.lineWidth = 1;

  let max_x: number = 0;
  let min_y: number = Number.POSITIVE_INFINITY;
  let max_y: number = Number.NEGATIVE_INFINITY;
  const l1: number = dataLists.length;

  for (let i = 0; i < l1; i++) {
    const data: Float64Array = dataLists[i];
    const l2: number = data.length;

    max_x = Math.max(max_x, l2 - 1);

    for (let j = 0; j < l2; j++) {
      min_y = Math.min(min_y, data[j]);
      max_y = Math.max(max_y, data[j]);
    }
  }

  const scale_x = ctx.canvas.width / max_x;
  const scale_y = ctx.canvas.height / max_y;

  for (let i = 0; i < l1; i++) {
    const data: Float64Array = dataLists[i];
    const l2: number = data.length;

    ctx.beginPath();
    ctx.moveTo(0, ctx.canvas.height);

    ctx.strokeStyle = `hsl(${ i / l1 * 360}, 100%, 50%)`;

    for (let j = 0; j < l2; j++) {
      ctx.lineTo(j * scale_x, ctx.canvas.height - (data[j] * scale_y));
    }

    ctx.stroke();
  }
}

function getOptimizedOrder(partsLvl: number[], length: number) {
  const partsLength: number = parts.length;

  const optimalLvL: number = 100;
  const optimalLvLRecoverDurations = parts.map((part) => {
    return lvlToRecoverDuration(optimalLvL, part);
  });

  return Array.from({ length: length, }, () => {
    const partsNextLvLRecoverDuration = parts
      .map((part, partIndex) => {
        return (partsLvl[partIndex] < optimalLvL)
          ? optimalLvLRecoverDurations[partIndex]
          : lvlToRecoverDuration(partsLvl[partIndex] + 1, part);
      });

    let min: number = Number.POSITIVE_INFINITY;
    let minIndex: number = -1;

    for (let i = 0; i < partsLength; i++) {
      if (partsNextLvLRecoverDuration[i] < min) {
        minIndex = i;
        min = partsNextLvLRecoverDuration[i];
      }
    }

    partsLvl[minIndex]++;

    return minIndex;
  });
}

function optimize(): void {

  const order = getOptimizedOrder(initialPartsLvl.slice(), 30);

  function resumeOrder(order: number[]) {
    const lines: string[] = [];
    let count: number = 0;
    let currentValue: number = -1;
    const partsLvl: number[] = initialPartsLvl.slice();

    for (let i = 0, l = order.length; i < l; i++) {
      const value = order[i];
      partsLvl[value]++;

      if (value !== currentValue) {
        if (count !== 0) {
          // if (partsLvl[currentValue] === initialPartsLvl[currentValue] + 1) {
          //   lines.push('\n-------------------------------------------------------------------------------');
          // }
          lines.push(`part #${ currentValue } up to lvl ${ partsLvl[currentValue] } => ${ count } times`);
        }
        currentValue = value;
        count = 1;
      } else {
        count++;
      }
    }

    if (count !== 0) {
      lines.push(`part #${ currentValue } up to lvl ${partsLvl[currentValue] } => ${ count } times`);
    }

    console.log(lines.join('\n'));
    console.log('partsLvl', partsLvl.join(', '));
  }

  resumeOrder(order);
  // console.log(order);

}

function computeTotalCost(partsLvl: number[]): number {
  return partsLvl.reduce((sum: number, lvl: number, index: number) => {
    return sum + lvlToTotalCost(lvl, parts[index].cost);
  }, 0);
}

function computeAllCosts(partsLvl: number[]): number {
  return partsLvl.reduce((sum: number, lvl: number, index: number) => {
    return sum + ((lvl === 0) ? 0 : lvlToCost(lvl - 1, parts[index].cost));
  }, 0);
}

function computeTotalIncome(partsLvl: number[]) {
  return partsLvl.reduce((sum: number, lvl: number, index: number) => {
    return sum + lvlToIncomePerSecond(lvl, parts[index]);
  }, 0);
}


function plotLvlToRecoverDuration() {
  const dataLists = [
    chair,
    popCorn,
    parking,
    trap,
    drink,
    deadlyTrap,
  ].map(type => new Float64Array(Array.from({ length: 400, }, (v: any, index: number) => lvlToRecoverDuration(index + 1, type))));

  // console.log(dataLists);
  plotter(dataLists);
}


function plotLvlToIncome() {
  const order = getOptimizedOrder(getInitialPartsLvl(), 2000);
  const partsLvl: number[] = getInitialPartsLvl();

  const totalCosts = new Float64Array(order.length);
  const incomes = new Float64Array(order.length);
  const allCosts = new Float64Array(order.length);
  const ratio = new Float64Array(order.length);

  for (let i = 0; i < order.length; i++) {
    totalCosts[i] = computeTotalCost(partsLvl);
    allCosts[i] = computeAllCosts(partsLvl);
    incomes[i] = computeTotalIncome(partsLvl);
    ratio[i] = allCosts[i] / incomes[i];
    partsLvl[order[i]]++;
  }

  plotter([totalCosts]);
  plotter([allCosts]);
  plotter([incomes]);
  plotter([ratio]);
  // console.log(order);
  const min = Math.min(...ratio as any);
  console.log(min, ratio.findIndex(_ => _ === min));
  console.log(partsLvl); // 2100 => [594, 534, 414, 328, 231, 0]
  // 1020 => [391, 329, 201, 100, 0, 0]
}

function plotRunes() {
  const runes = new Float64Array(20);
  runes[1] = 2062418;
  runes[2] = 6518191;
  runes[3] = 13259511;
  runes[4] = 18297536;
  runes[5] = 23797603;
  runes[6] = 30504895;
  runes[7] = 37920122;
  runes[8] = 44100056;
  runes[9] = 51288496;
  runes[10] = 58517955;
  runes[11] = 69892866;
  runes[12] = 74291930;
  runes[13] = 81554596;
  runes[14] = 0;
  runes[15] = 0;
  runes[16] = 105664156;

  // runes[24] = 143740176;
  // runes[28] = 216181353;
  // runes[29] = 217166981;
  // runes[30] = 230439372;
  // runes[32] = 245970598;
  // runes[34] = 272390343;
  // runes[35] = 292390343;

  // 2062418 => 1 => precise
  // 6518191 => 2 => precise
  // 13259511 => 3 => precise (+-5min @ 2200$/s)
  // 18297536 => 4 => precise
  // 23797603 => 5 => precise ( => +5 500 000)
  // 30504895 => 6 => precise ( => +6 700 000)
  // 37920122 => 7 => precise ( => +7 415 227)
  // 44100056 => 8 => precise ( => +6 179 934)
  // 51288496 => 9 => precise ( => +7 188 440)
  // 58517955 => 10 => precise (+-5min @ 3400$/s)
  // 69892866 => 11 => (+-5min @ 3400$/s)
  // 74291930 => 12 => (+-5min @ 3400$/s)
  // 81554596 => 13 => precise
  // 95582133 => 14

  // 105664156 => 16 => precise
  // 268250129 => 34 => precise

  plotter([runes]);
}



const BONUS_RUNES: number = 35;


const chair: RevenuePart = {
  cost: 5,
  income: 1,
  duration: 72,
  durationRatio: 0.5,
  incomeRation: 2,
};

const popCorn: RevenuePart = {
  cost: 100,
  income: 10,
  duration: 6 * 60,
  durationRatio: 0.5,
  incomeRation: 1,
};

const parking: RevenuePart = {
  cost: 2500,
  income: 40,
  duration: 12 * 60,
  durationRatio: 1,
  incomeRation: 1,
};

const trap: RevenuePart = {
  cost: 50000,
  income: 120,
  duration: 18 * 60,
  durationRatio: 1,
  incomeRation: 1,
};


const drink: RevenuePart = {
  cost: 1000000,
  income: 320,
  duration: 24 * 60,
  durationRatio: 1,
  incomeRation: 2,
};

const deadlyTrap: RevenuePart = {
  cost: 25000000,
  income: 1100,
  duration: 36 * 60,
  durationRatio: 1,
  incomeRation: 1,
};


const vipChair: RevenuePart = { // TODO
  cost: 500000000,
  income: 1100,
  duration: 36 * 60,
  durationRatio: 1,
  incomeRation: 1,
};

const parts = [
  chair,
  popCorn,
  parking,
  trap,
  drink,
  deadlyTrap
];



const initialPartsLvl: number[] = [ // lifaon
  423,
  362,
  208,
  109,
  0,
  0
];

// const initialPartsLvl: number[] = [ // redgeek
//   250,
//   250,
//   241,
//   101,
//   1,
//   0
// ];


// const initialPartsLvl: number[] = [ // zorkain
//   250,
//   250,
//   250,
//   140,
//   0,
//   0
// ];

// const initialPartsLvl: number[] = [ // crakdos
//   200,
//   50,
//   25,
//   8,
//   0,
//   0
// ];



export function testSAndF() {
  // plotLvlToRecoverDuration();
  // plotLvlToIncome();

  optimize();
  plotRunes();

  console.log('totalCost', computeTotalCost(initialPartsLvl));
  console.log('totalIncome', computeTotalIncome(initialPartsLvl));
  //
  // console.log('ok');
}



