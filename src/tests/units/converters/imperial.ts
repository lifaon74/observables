import { NumericTypeConverter, RegisterNumericTypeConverter } from './core';

export interface ImperialLengthConverter extends NumericTypeConverter {
  feet?: number;
}

export const IMPERIAL_LENGTH_CONVERTERS: ImperialLengthConverter[] = [
  {
    name: 'thou',
    symbols: ['th'],
    feet: 1 / 12e3,
    multiplier: 2.54e-5,
  }, {
    name: 'inch',
    symbols: ['in', '"'],
    feet: 1 / 12,
    multiplier: 2.54e-2,
  }, {
    name: 'foot',
    symbols: ['ft'],
    feet: 1,
    multiplier: 0.3048,
  }, {
    name: 'yard',
    symbols: ['yd'],
    feet: 3,
    multiplier: 0.9144,
  }, {
    name: 'chain',
    symbols: ['ch'],
    feet: 66,
    multiplier: 20.1168,
  }, {
    name: 'furlong',
    symbols: ['fur'],
    feet: 660,
    multiplier: 201.168,
  }, {
    name: 'mile',
    symbols: ['mi'],
    feet: 5280,
    multiplier: 1609.344,
  }, {
    name: 'league',
    symbols: ['lea'],
    feet: 15840,
    multiplier: 4828.032,
  }, /* maritime units */ {
    name: 'fathom',
    symbols: ['ftm'],
    feet: 6.0761,
    multiplier: 1.852,
  }, {
    name: 'cable',
    symbols: [],
    feet: 607.61,
    multiplier: 185.2,
  }, {
    name: 'nautical mile',
    symbols: [],
    feet: 6076.1,
    multiplier: 1852,
  }, {
    name: 'link',
    symbols: [],
    feet: 66 / 100,
    multiplier: 0.201168,
  }, {
    name: 'rod',
    symbols: [],
    feet: 66 / 4,
    multiplier: 5.0292,
  }
];

export function GenerateImperialLengthUnitConverters(meterUnit: string = 'meter'): void {
  IMPERIAL_LENGTH_CONVERTERS.forEach((converter: ImperialLengthConverter) => {
    RegisterNumericTypeConverter(meterUnit, converter);
  });
}


