import { RegisterCompleteTypeConverter } from './core';

export interface TimeMultiplier {
  name: string;
  symbols:  string[];
  seconds: number;
}

export const TimeMultipliers: TimeMultiplier[] = [
  {
    name: 'second',
    symbols: ['s'],
    seconds: 1,
  }, {
    name: 'minute',
    symbols: ['m'],
    seconds: 60,
  }, {
    name: 'hour',
    symbols: ['h'],
    seconds: 60 * 60,
  }, {
    name: 'day',
    symbols: ['d'],
    seconds: 60 * 60 * 24,
  }, {
    name: 'year',
    symbols: ['y'],
    seconds: 60 * 60 * 24 * 365,
  }, {
    name: 'century',
    symbols: [],
    seconds: 60 * 60 * 24 * 365 * 100,
  },
];

export function GenerateTimeUnitConvertersUsingNames(): void {
  for (let timeMultipliersIndex = 1, timeMultipliersLength = TimeMultipliers.length; timeMultipliersIndex < timeMultipliersLength; timeMultipliersIndex++) {
    const timeMultiplier: TimeMultiplier = TimeMultipliers[timeMultipliersIndex];
    const seconds: number = timeMultiplier.seconds;
    RegisterCompleteTypeConverter(
      'second', timeMultiplier.name,
      (input: number): number => (input / seconds),
      (input: number): number => (input * seconds),
    );
  }
}

export function GenerateTimeUnitConvertersUsingSymbols(): void {
  for (let timeMultipliersIndex = 1, timeMultipliersLength = TimeMultipliers.length; timeMultipliersIndex < timeMultipliersLength; timeMultipliersIndex++) {
    const timeMultiplier: TimeMultiplier = TimeMultipliers[timeMultipliersIndex];
    const symbols: string[] =  timeMultiplier.symbols;
    const seconds: number = timeMultiplier.seconds;
    for (let symbolsIndex = 0, symbolsLength = symbols.length; symbolsIndex < symbolsLength; symbolsIndex++) {
      RegisterCompleteTypeConverter(
        's', symbols[symbolsIndex],
        (input: number): number => (input / seconds),
        (input: number): number => (input * seconds),
      );
    }
  }
}

export function GenerateTimeUnitConverters(): void {
  GenerateTimeUnitConvertersUsingNames();
  // GenerateTimeUnitConvertersUsingSymbols();
}
