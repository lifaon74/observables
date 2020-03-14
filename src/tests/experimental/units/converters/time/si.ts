import { MultiplierTypeConverter, RegisterCompleteTypeConverter, RegisterMultiplierTypeConverter } from '../register';

export interface TimeConverter extends MultiplierTypeConverter {
}

export const TIME_CONVERTERS: TimeConverter[] = [
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
  TIME_CONVERTERS.forEach((converter: TimeConverter) => {
    if (converter.name !== 'second') {
      RegisterMultiplierTypeConverter('second', converter);
    }
  });
}
