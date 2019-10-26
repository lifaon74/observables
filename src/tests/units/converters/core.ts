export type TType = string;
export type TTypeConverter<TFrom, TTo> = (input: TFrom) => TTo;
export type TTypeConverterFromType<TConverter> = TConverter extends TTypeConverter<infer TFrom, any>
  ? TFrom
  : never;
export type TTypeConverterToType<TConverter> = TConverter extends TTypeConverter<any, infer TTo>
  ? TTo
  : never;


const TYPE_CONVERTER = new Map<TType, Map<TType, TTypeConverter<any, any>>>();

export function RegisterTypeConverter<TConverter extends TTypeConverter<any, any>>(from: TType, to: TType, converter: TConverter): TConverter {
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

  return converter;
}

export function RegisterCompleteTypeConverter<TConverter1 extends TTypeConverter<any, any>, TConverter2 extends TTypeConverter<any, any>>(
  type1: TType,
  type2: TType,
  type1ToUnit2Converter: TConverter1,
  type2ToUnit1Converter: TConverter2,
): [TConverter1, TConverter2] {
  return [
    RegisterTypeConverter<TConverter1>(type1, type2, type1ToUnit2Converter),
    RegisterTypeConverter<TConverter2>(type2, type1, type2ToUnit1Converter),
  ];
}


export function GetTypeConverter<TConverter extends TTypeConverter<any, any>>(from: TType, to: TType, store: boolean = true, depth: number = 10): TConverter | null {
  if (TYPE_CONVERTER.has(from)) {
    const toMap: Map<TType, TTypeConverter<any, any>> = TYPE_CONVERTER.get(from) as Map<TType, TTypeConverter<any, any>>;
    if (toMap.has(to)) {
      return toMap.get(to) as TConverter;
    } else {
      if (depth <= 0) {
        return null;
      } else {
        const iterator: Iterator<[TType, TTypeConverter<any, any>]> = toMap.entries();
        let result: IteratorResult<[TType, TTypeConverter<any, any>]>;
        while (!(result = iterator.next()).done) {
          const [intermediateType, fromTypeToIntermediateTypeConverter] = result.value;
          const intermediateTypeToToTypeConverter: TTypeConverter<any, any> | null = GetTypeConverter(intermediateType, to, store, depth - 1);
          if (intermediateTypeToToTypeConverter !== null) {
            const fromTypeToIntermediateTypeConverter: TTypeConverter<any, any> = toMap.get(intermediateType) as TTypeConverter<any, any>;
            const converter: TConverter = ((input: TTypeConverterFromType<TConverter>): TTypeConverterToType<TConverter> => {
              return intermediateTypeToToTypeConverter(fromTypeToIntermediateTypeConverter(input));
            }) as TConverter;
            return store
              ? RegisterTypeConverter(from, to, converter)
              : converter;
          }
        }
        return null;
      }
    }
  } else {
    return null;
  }
}

export function GetTypeConverterOrThrow<TConverter extends TTypeConverter<any, any>>(from: TType, to: TType, store?: boolean, depth?: number): TConverter {
  const converter: TConverter | null = GetTypeConverter<TConverter>(from, to, store, depth);
  if (converter === null) {
    throw new Error(`Expected converter from '${ from }' to '${ to }'`);
  } else {
    return converter;
  }
}
