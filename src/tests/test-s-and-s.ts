
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




function lvlToCost(lvl: number, initialCost: number): number {
  return initialCost * (1.03 ** lvl);
}

function lvlToIncome(lvl: number, initialIncome: number): number {
  return initialIncome * (2 ** lvlToStepMultiplier(lvl)) * lvl;
}

function lvlToDuration(lvl: number, initialDuration: number): number {
  return initialDuration * (0.8 ** lvlToStepMultiplier(lvl));
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


const chair: RevenuePart = {
  cost: 22,
  income: 1,
  duration: 72,
  durationRatio: 0.5,
  incomeRation: 1,
};

const popCorn: RevenuePart = {
  cost: 116 /*100*/,
  income: 10,
  duration: 6 * 60,
  durationRatio: 1,
  incomeRation: 1,
};

const parking: RevenuePart = {
  cost: 2515 /*2500*/,
  income: 40,
  duration: 12 * 60,
  durationRatio: 1,
  incomeRation: 1,
};

const trap: RevenuePart = {
  cost: 50015/*50000*/,
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

    max_x = Math.max(max_x, l2);

    for (let j = 0; j < l2; j++) {
      min_y = Math.min(min_y, data[j]);
      max_y = Math.max(max_y, data[j]);
    }
  }

  const scale_x = ctx.canvas.width / max_x;
  const scale_y = ctx.canvas.height/ max_y;

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

function optimize(): void {
  const partsLength: number = parts.length;
  // const initialPartsLvl: number[] = parts.map(() => 0);
  // initialPartsLvl[0] = 1;
  const initialPartsLvl: number[] = [
    378,
    320,
    187,
    88,
    1,
    0
  ];

  const optimalLvL: number = 100;
  const optimalLvLRecoverDurations = parts.map((part) => {
    return lvlToRecoverDuration(optimalLvL, part);
  });

  const partsLvl: number[] = initialPartsLvl.slice();

  const order = Array.from({ length: 500, }, () => {
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
          lines.push(`part #${ currentValue } up to lvl ${ partsLvl[currentValue] } => ${ count } times, cost ${ Math.floor(lvlToCost(partsLvl[currentValue], parts[currentValue].cost)) }`);
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
  }

  resumeOrder(order);
  console.log(order);
  console.log(partsLvl);
}


export function testSAndF() {
  // listStats(0, chair);

  // console.log('best chair', findBestLvl(chair));
  // console.log('best popCorn', findBestLvl(popCorn));
  // console.log('best parking', findBestLvl(parking));
  // console.log('best trap', findBestLvl(trap));
  //
  const dataLists = [
    chair,
    popCorn,
    parking,
    trap,
    drink,
    deadlyTrap,
  ].map(type => new Float64Array(Array.from({ length: 400, }, (v: any, index: number) => lvlToRecoverDuration(index + 1, type))));
  //
  // console.log(dataLists);
  plotter(dataLists);

  optimize();

  console.log('ok');
}
