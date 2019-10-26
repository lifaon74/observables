import { RegisterCompleteTypeConverter } from './core';

export interface SIMultiplier {
  multiplier: number;
  symbols: [string, ...string[]];
}

export const SIMMultipliers: SIMultiplier[] = [
  {
    multiplier: 0.1,
    symbols: ['d']
  }, {
    multiplier: 0.01,
    symbols: ['c']
  }, {
    multiplier: 0.001,
    symbols: ['m']
  }, {
    multiplier: 0.000001,
    symbols: ['µ', 'u']
  }, {
    multiplier: 1e-9,
    symbols: ['n']
  }, {
    multiplier: 1e-12,
    symbols: ['p']
  },
  {
    multiplier: 1e-15,
    symbols: ['f']
  }, {
    multiplier: 1e-18,
    symbols: ['a']
  }, {
    multiplier: 1e-21,
    symbols: ['z']
  }, {
    multiplier: 1e-24,
    symbols: ['y']
  }, {
    multiplier: 10,
    symbols: ['da']
  }, {
    multiplier: 10,
    symbols: ['h']
  }, {
    multiplier: 1000,
    symbols: ['k']
  }, {
    multiplier: 1000000,
    symbols: ['M']
  }, {
    multiplier: 1000000000,
    symbols: ['G']
  }, {
    multiplier: 1000000000000,
    symbols: ['T']
  }, {
    multiplier: 1000000000000000,
    symbols: ['P']
  }, {
    multiplier: 1000000000000000000,
    symbols: ['E']
  }, {
    multiplier: 1e+21, symbols: ['Z']
  }, {
    multiplier: 1e+24,
    symbols: ['Y']
  }
];

export function GenerateSIUnitConverters(unit: string): void {
  const siMultipliersLength: number = SIMMultipliers.length;
  for (let siMultipliersIndex = 0; siMultipliersIndex < siMultipliersLength; siMultipliersIndex++) {
    const siMultiplier: SIMultiplier = SIMMultipliers[siMultipliersIndex];
    const multiplier: number = siMultiplier.multiplier;
    const symbols: string[] = siMultiplier.symbols;
    for (let symbolsIndex = 0, symbolsLength = symbols.length; symbolsIndex < symbolsLength; symbolsIndex++) {
      RegisterCompleteTypeConverter(
        unit, `${ symbols[symbolsIndex] }${ unit }`,
        (input: number): number => (input / multiplier),
        (input: number): number => (input * multiplier),
      );
    }
  }
  //
  // if (full) {
  //   for (let siMultipliersIndex1 = 0; siMultipliersIndex1 < siMultipliersLength; siMultipliersIndex1++) {
  //     const siMultiplier1: SIMultiplier = SIMMultipliers[siMultipliersIndex1];
  //     const multiplier1: number = siMultiplier1.multiplier;
  //     const symbols1: string[] = siMultiplier1.symbols;
  //     for (let symbolsIndex1 = 0, symbolsLength2 = symbols1.length; symbolsIndex1 < symbolsLength2; symbolsIndex1++) {
  //       const unit1: TType = `${ symbols1[symbolsIndex1] }${ unit }`;
  //       for (let siMultipliersIndex2 = 0; siMultipliersIndex2 < siMultipliersLength; siMultipliersIndex2++) {
  //         const siMultiplier2: SIMultiplier = SIMMultipliers[siMultipliersIndex2];
  //         const symbols2: string[] = siMultiplier2.symbols;
  //         const multiplier: number = multiplier1 / siMultiplier2.multiplier;
  //         for (let symbolsIndex2 = 0, symbolsLength2 = symbols2.length; symbolsIndex2 < symbolsLength2; symbolsIndex2++) {
  //           RegisterTypeConverter(
  //             unit1, `${ symbols2[symbolsIndex2] }${ unit }`,
  //             (input: number): number => (input * multiplier),
  //           );
  //         }
  //       }
  //     }
  //   }
  // }
}

export function GenerateSILengthUnitConverters(): void {
  GenerateSIUnitConverters('m');
}

