import {
  MultiplierTypeConverter, RegisterMultiplierTypeConverterByName, RegisterMultiplierTypeConverter,
  RegisterMultiplierTypeConverterBySymbols, RegisterMultiplierTypeConverterSymbolsAsAliases, RegisterTypeAliases
} from './register';

/**
 * Contains function used by the International System of Units (SI)
 * https://en.wikipedia.org/wiki/International_System_of_Units
 */

export interface SIMultiplier extends MultiplierTypeConverter {
}

/**
 * The list of SI multiplier prefixes:
 * @example: <kilo | milli | ...>[unit]
 */
export const SI_MULTIPLIERS: SIMultiplier[] = [
  {
    name: 'deci',
    multiplier: 0.1,
    symbols: ['d']
  }, {
    name: 'centi',
    multiplier: 0.01,
    symbols: ['c']
  }, {
    name: 'milli',
    multiplier: 0.001,
    symbols: ['m']
  }, {
    name: 'micro',
    multiplier: 0.000001,
    symbols: ['µ', 'u']
  }, {
    name: 'nano',
    multiplier: 1e-9,
    symbols: ['n']
  }, {
    name: 'pico',
    multiplier: 1e-12,
    symbols: ['p']
  },
   {
    name: 'femto',
    multiplier: 1e-15,
    symbols: ['f']
  }, {
    name: 'atto',
    multiplier: 1e-18,
    symbols: ['a']
  }, {
    name: 'zepto',
    multiplier: 1e-21,
    symbols: ['z']
  }, {
    name: 'yocto',
    multiplier: 1e-24,
    symbols: ['y']
  }, {
    name: 'deca',
    multiplier: 10,
    symbols: ['da']
  }, {
    name: 'hecto',
    multiplier: 10,
    symbols: ['h']
  }, {
    name: 'kilo',
    multiplier: 1000,
    symbols: ['k']
  }, {
    name: 'mega',
    multiplier: 1000000,
    symbols: ['M']
  }, {
    name: 'giga',
    multiplier: 1000000000,
    symbols: ['G']
  }, {
    name: 'tera',
    multiplier: 1000000000000,
    symbols: ['T']
  }, {
    name: 'peta',
    multiplier: 1000000000000000,
    symbols: ['P']
  }, {
    name: 'exa',
    multiplier: 1000000000000000000,
    symbols: ['E']
  }, {
    name: 'zetta',
    multiplier: 1e+21, symbols: ['Z']
  }, {
    name: 'yotta',
    multiplier: 1e+24,
    symbols: ['Y']
  }
];

/**
 * Returns the composed name of an unit ant an SI multiplier
 */
export function PrefixSIUnit(unit: string, siMultiplierName: string): string {
  return `${ siMultiplierName }${ unit }`;
}


/**
 * Merges an SI multiplier with an unit and a symbol to create a new MultiplierTypeConverter
 */
export function SIMultiplierToMultiplierTypeConverter(unit: string, symbol: string, siMultiplier: SIMultiplier): MultiplierTypeConverter {
  return {
    ...siMultiplier,
    name: PrefixSIUnit(unit, siMultiplier.name),
    symbols: (siMultiplier.symbols === void 0)
      ? []
      : siMultiplier.symbols.map(siSymbol => PrefixSIUnit(symbol, siSymbol))
  }
}

export function GenerateSIUnitMultiplierConvertersUsingNames(unit: string): void {
  SI_MULTIPLIERS.forEach((siMultiplier: SIMultiplier) => {
    RegisterMultiplierTypeConverterByName(unit, SIMultiplierToMultiplierTypeConverter(unit, '', siMultiplier));
  });
}

export function GenerateSIUnitMultiplierConvertersUsingSymbols(symbol: string): void {
  SI_MULTIPLIERS.forEach((siMultiplier: SIMultiplier) => {
    RegisterMultiplierTypeConverterBySymbols(symbol, SIMultiplierToMultiplierTypeConverter('', symbol, siMultiplier));
  });
}

export function GenerateSIUnitMultiplierConverters(unit: string, symbol: string): void {
  SI_MULTIPLIERS.forEach((siMultiplier: SIMultiplier) => {
    RegisterMultiplierTypeConverter(unit, SIMultiplierToMultiplierTypeConverter(unit, symbol, siMultiplier));
  });
  RegisterTypeAliases(unit, [symbol]);
}

