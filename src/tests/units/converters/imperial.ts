import { RegisterCompleteTypeConverter } from './core';

export interface ImperialLengthMultiplier {
  name: string;
  symbols:  [string, ...string[]];
  feet: number;
  meters: number;
}

export const ImperialLengthMultipliers: ImperialLengthMultiplier[] = [
  {
    name: 'thou',
    symbols: ['th'],
    feet: 1 / 12e3,
    meters: 2.54e-5,
  }, {
    name: 'inch',
    symbols: ['in', '"'],
    feet: 1 / 12,
    meters: 2.54e-2,
  }, {
    name: 'foot',
    symbols: ['ft'],
    feet: 1,
    meters: 0.3048,
  }, {
    name: 'yard',
    symbols: ['yd'],
    feet: 3,
    meters: 0.9144,
  }, {
    name: 'chain',
    symbols: ['ch'],
    feet: 66,
    meters: 20.1168,
  }, {
    name: 'furlong',
    symbols: ['fur'],
    feet: 660,
    meters: 201.168,
  }, {
    name: 'mile',
    symbols: ['mi'],
    feet: 5280,
    meters: 1609.344,
  }, {
    name: 'league',
    symbols: ['lea'],
    feet: 15840,
    meters: 4828.032,
  }, /* maritime units */ {
    name: 'fathom',
    symbols: ['ftm'],
    feet: 6.0761,
    meters: 1.852,
  }, {
    name: 'cable',
    symbols: ['cable'],
    feet: 607.61,
    meters: 185.2,
  }, {
    name: 'nautical mile',
    symbols: ['nautical mile'],
    feet: 6076.1,
    meters: 1852,
  }, {
    name: 'link',
    symbols: ['link'],
    feet: 66 / 100,
    meters: 0.201168,
  }, {
    name: 'rod',
    symbols: ['rod'],
    feet: 66 / 4,
    meters: 5.0292,
  }
];

export function GenerateImperialLengthUnitConverters(): void {
  for (let imperialLengthMultipliersIndex = 0, imperialLengthMultipliersLength = ImperialLengthMultipliers.length; imperialLengthMultipliersIndex < imperialLengthMultipliersLength; imperialLengthMultipliersIndex++) {
    const imperialLengthMultiplier: ImperialLengthMultiplier = ImperialLengthMultipliers[imperialLengthMultipliersIndex];
    const symbols: string[] =  imperialLengthMultiplier.symbols;
    const meters: number = imperialLengthMultiplier.meters;
    for (let symbolsIndex = 0, symbolsLength = symbols.length; symbolsIndex < symbolsLength; symbolsIndex++) {
      RegisterCompleteTypeConverter(
        'm', symbols[symbolsIndex],
        (input: number): number => (input / meters),
        (input: number): number => (input * meters),
      );
    }
  }
}
