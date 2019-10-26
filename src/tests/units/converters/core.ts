
export type TType = string;
export type TTypeConverter<TFrom, TTo> = (input: TFrom) => TTo;
export type TTypeConverterFromType<TConverter> = TConverter extends TTypeConverter<infer TFrom, any>
  ? TFrom
  : never;
export type TTypeConverterToType<TConverter> = TConverter extends TTypeConverter<any, infer TTo>
  ? TTo
  : never;


const TYPE_CONVERTER = new Map<TType, Map<TType, TTypeConverter<any, any>>>();
(window as any).TYPE_CONVERTER = TYPE_CONVERTER; // TODO
const passthrough = (value: any) => value;

export function RegisterTypeConverter(from: TType, to: TType, converter: TTypeConverter<any, any>): void {
  // console.log('register', from, to);
  if (from === to) {
    throw new Error(`'from' and 'to' have the same value '${ from }'`);
  } else {
    let toMap: Map<TType, TTypeConverter<any, any>>;
    if (TYPE_CONVERTER.has(from)) {
      toMap = TYPE_CONVERTER.get(from) as Map<TType, TTypeConverter<any, any>>;
      if (toMap.has(to)) {
        throw new Error(`Type converter from '${ from }' to '${ to }' already existing`);
      }
    } else {
      toMap = new Map<TType, TTypeConverter<any, any>>();
      TYPE_CONVERTER.set(from, toMap);
    }

    toMap.set(to, converter);
  }
}

export function RegisterCompleteTypeConverter(
  type1: TType,
  type2: TType,
  type1ToUnit2Converter: TTypeConverter<any, any>,
  type2ToUnit1Converter: TTypeConverter<any, any>,
): void {
  RegisterTypeConverter(type1, type2, type1ToUnit2Converter);
  RegisterTypeConverter(type2, type1, type2ToUnit1Converter);
}


export function RegisterTypeAliases(type: TType, aliases: TType[]): void {
  for (let i = 0, l = aliases.length; i < l; i++) {
    RegisterCompleteTypeConverter(type, aliases[i], passthrough, passthrough);
  }
}


/*---------------------*/

export interface NumericTypeConverter {
  name: string;
  multiplier: number;
  symbols?: string[];
}

export function RegisterMultiplierConverter(type1: TType, type2: TType, multiplier: number): void {
  RegisterCompleteTypeConverter(
    type1, type2,
    (input: number): number => (input / multiplier),
    (input: number): number => (input * multiplier),
  );
}

export function RegisterNumericTypeConverterByName(type: TType, converter: NumericTypeConverter): void {
  RegisterMultiplierConverter(type, converter.name, converter.multiplier);
}

export function RegisterNumericTypeConverterBySymbols(type: TType, converter: NumericTypeConverter): void {
  if (converter.symbols !== void 0) {
    const symbols: string[] = converter.symbols;
    for (let i = 0, l = symbols.length; i < l; i++) {
      RegisterMultiplierConverter(type, symbols[i], converter.multiplier);
    }
  }
}

export function RegisterNumericTypeConverterSymbolsAsAliases(type: TType, converter: NumericTypeConverter): void {
  if (converter.symbols !== void 0) {
    RegisterTypeAliases(type, converter.symbols);
  }
}

export function RegisterNumericTypeConverterSymbolsAsAliasesOfName(converter: NumericTypeConverter): void {
  if (converter.symbols !== void 0) {
    RegisterTypeAliases(converter.name, converter.symbols);
  }
}

export function RegisterNumericTypeConverter(type: TType, converter: NumericTypeConverter): void {
  RegisterNumericTypeConverterByName(type, converter);
  RegisterNumericTypeConverterBySymbols(type, converter);
  RegisterNumericTypeConverterSymbolsAsAliasesOfName(converter);
}

/*---------------------*/


// export function GetTypeConverter<TConverter extends TTypeConverter<any, any>>(from: TType, to: TType, store: boolean = false, depth: number = 5): TConverter | null {
//   if (from === to) {
//     return passthrough as TConverter;
//   } else if (TYPE_CONVERTER.has(from)) {
//     const toMap: Map<TType, TTypeConverter<any, any>> = TYPE_CONVERTER.get(from) as Map<TType, TTypeConverter<any, any>>;
//     if (toMap.has(to)) {
//       return toMap.get(to) as TConverter;
//     } else {
//       if (depth <= 0) {
//         return null;
//       } else {
//         const iterator: Iterator<[TType, TTypeConverter<any, any>]> = toMap.entries();
//         let result: IteratorResult<[TType, TTypeConverter<any, any>]>;
//         while (!(result = iterator.next()).done) {
//           const [intermediateType, fromTypeToIntermediateTypeConverter] = result.value;
//           const intermediateTypeToToTypeConverter: TTypeConverter<any, any> | null = GetTypeConverter(intermediateType, to, store, depth - 1);
//           if (intermediateTypeToToTypeConverter !== null) {
//             const converter: TConverter = ((input: TTypeConverterFromType<TConverter>): TTypeConverterToType<TConverter> => {
//               return intermediateTypeToToTypeConverter(fromTypeToIntermediateTypeConverter(input));
//             }) as TConverter;
//             if (store) {
//               RegisterTypeConverter(from, to, converter);
//             }
//             return converter;
//           }
//         }
//         return null;
//       }
//     }
//   } else {
//     return null;
//   }
// }

export interface ITypeConverterAndPath<TConverter extends TTypeConverter<any, any>> {
  types: TType[];
  converter: TConverter;
}

export function FastGetTypeConverter<TConverter extends TTypeConverter<any, any>>(from: TType, to: TType): TConverter | undefined {
  if (from === to) {
    return passthrough as TConverter;
  } else if (TYPE_CONVERTER.has(from)) {
    return (TYPE_CONVERTER.get(from) as Map<TType, TTypeConverter<any, any>>).get(to) as TConverter | undefined;
  } else {
    return void 0;
  }
}

export function GetTypeConverters<TConverter extends TTypeConverter<any, any>>(from: TType, to: TType, depth: number = 5, memory: Set<string> = new Set<string>()): ITypeConverterAndPath<TConverter>[] {
  if (depth >= 0) {
    const key: string = `${ JSON.stringify(from) }-${ JSON.stringify(to) }`;
    if (memory.has(key)) {
      return [];
    } else {
      memory.add(key);
    }
    if (from === to) {
      return [{
        types: [from, to],
        converter: passthrough as TConverter
      }];
    } else if (TYPE_CONVERTER.has(from)) {
      const toMap: Map<TType, TTypeConverter<any, any>> = TYPE_CONVERTER.get(from) as Map<TType, TTypeConverter<any, any>>;
      if (toMap.has(to)) {
        return [{
          types: [from, to],
          converter: toMap.get(to) as TConverter
        }];
      } else {
        const list: ITypeConverterAndPath<TConverter>[] = [];
        const iterator: Iterator<[TType, TTypeConverter<any, any>]> = toMap.entries();
        let result: IteratorResult<[TType, TTypeConverter<any, any>]>;
        while (!(result = iterator.next()).done) {
          const [intermediateType, fromTypeToIntermediateTypeConverter] = result.value;
          list.push(
            ...GetTypeConverters(intermediateType, to, depth - 1, memory).map((intermediateTypeToToTypeConverter: ITypeConverterAndPath<TTypeConverter<any, any>>) => {
              const _intermediateTypeToToTypeConverter: TTypeConverter<any, any> = intermediateTypeToToTypeConverter.converter;
              const converter: TConverter = ((input: TTypeConverterFromType<TConverter>): TTypeConverterToType<TConverter> => {
                return _intermediateTypeToToTypeConverter(fromTypeToIntermediateTypeConverter(input));
              }) as TConverter;
              return {
                types: [from, ...intermediateTypeToToTypeConverter.types],
                converter: converter,
              } as ITypeConverterAndPath<TConverter>;
            })
          );
        }
        if (list.length > 0) {
          list.sort((a:  ITypeConverterAndPath<TConverter>, b:  ITypeConverterAndPath<TConverter>) => {
            return a.types.length - b.types.length;
          });

          RegisterTypeConverter(from, to, list[0].converter);
        }

        return list;
      }
    } else {
      return [];
    }
  } else {
    return [];
  }
}

// export function GetTypeConverter<TConverter extends TTypeConverter<any, any>>(from: TType, to: TType, depth?: number): TConverter | null {
//   const converters: ITypeConverterAndPath<TConverter>[] = GetTypeConverters<TConverter>(from, to, depth);
//   return (converters.length === 0)
//     ? null
//     : converters[0].converter;
// }

export function GetTypeConverterOrThrow<TConverter extends TTypeConverter<any, any>>(from: TType, to: TType, depth?: number): TConverter {
  const converter: TConverter | undefined= FastGetTypeConverter<TConverter>(from, to);
  if (converter === undefined) {
    const converters: ITypeConverterAndPath<TConverter>[] = GetTypeConverters<TConverter>(from, to, depth);
    if (converters.length === 0) {
      throw new Error(`No converter found from '${ from }' to '${ to }'`);
    } else {
      return converters[0].converter;
    }
  } else {
    return converter;
  }
}
