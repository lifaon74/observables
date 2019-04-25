
// export type KeyValueMap<TKVMap extends { [key: string]: T }, T> =
//   any extends TKVMap
//     ? never
//     : {
//       [K in KeyValueMapKeys<TKVMap>]: T;
//     };

// export type KeyValueMap<TKVMap, T> =
//   any extends TKVMap
//     ? never
//     : {
//       [K in Extract<keyof TKVMap, string>]: T;
//     };


export type KeyValueMap<TKVMap, T> = {
    [K in Extract<keyof TKVMap, string>]: T;
};

// export type KVMap<TKVMap, T> = {
//     [K in Extract<keyof TKVMap, string>]: T;
// };

export type KeyValueMapConstraint<TKVMap, T> = KeyValueMap<TKVMap, any> extends TKVMap
  ? KeyValueMap<TKVMap, T>
  : never;

export type KeyValueMapKeys<TKVMap> = TKVMap extends never ? never : Extract<keyof TKVMap, string>;
export type KeyValueMapValues<TKVMap> = TKVMap extends never ? never : TKVMap[KeyValueMapKeys<TKVMap>];

export type KeyValueMapGenericConstraint<TKVMap> = KeyValueMapConstraint<TKVMap, any>;
// export type KeyValueMapGeneric = KeyValueMap<{ [key: string]: any }, any>;
export type KeyValueMapGeneric = { [key: string]: any };




// interface Foo<TKVMap extends KeyValueMapGenericConstraint<TKVMap>> {
//
// }
// type A<U extends StringConstraint<U>, V> = Foo<Record<Extract<U, string>, any>>;
//
// // function bar<U extends string, V>(): Foo<Record<Extract<Clone<U>, string>, any>> {
// //    return null;
// // }
//
// const a: A<'a', 'b'>;







