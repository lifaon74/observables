import { MultiplierTypeConverter, RegisterCompleteTypeConverter, RegisterMultiplierTypeConverter } from '../register';
import { IMPERIAL_LENGTH_CONVERTERS, ImperialLengthConverter } from '../length/imperial';

export interface TimeMultiplier extends MultiplierTypeConverter {
}


export const TimeMultipliers: TimeMultiplier[] = [
  {
    name: 'second',
    symbols: ['s'],
    multiplier: 1,
  }, {
    name: 'minute',
    symbols: ['m'],
    multiplier: 60,
  }, {
    name: 'hour',
    symbols: ['h'],
    multiplier: 60 * 60,
  }, {
    name: 'day',
    symbols: ['d'],
    multiplier: 60 * 60 * 24,
  }, {
    name: 'year',
    symbols: ['y'],
    multiplier: 60 * 60 * 24 * 365,
  }, {
    name: 'century',
    symbols: [],
    multiplier: 60 * 60 * 24 * 365 * 100,
  },
];

export function GenerateTimeUnitConverters(): void {
  IMPERIAL_LENGTH_CONVERTERS.forEach((converter: ImperialLengthConverter) => {
    RegisterMultiplierTypeConverter('second', converter);
  });
}
