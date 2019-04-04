

// type AMapKeys<TKVMap> = Extract<keyof TKVMap, string>;
//
// type AMap<TKVMap, T> = {
//   [K in AMapKeys<TKVMap>]: K extends string ? T : never;
// };
//
// interface A<TKVMap extends AMap<TKVMap, number>, N extends AMapKeys<TKVMap>> {
//   name: N;
//   a<K extends keyof TKVMap>(a: K, b: TKVMap[K]): void;
// }
//
// type Generic = AMap<{ [key: string]: any }, any>;
//
// interface C<TKVMap extends Generic, N extends AMapKeys<TKVMap>> {
//   name: AMapKeys<TKVMap>;
//   a<K extends keyof TKVMap>(a: K, b: TKVMap[K]): void;
// }
//
// const a0: A<{ a: 1 }, 'a'> = null;
// const a1: A<{ a: 1 }, 'a' | 'b'> = null;
// const a2: A<{ a: 'a' }, 'a'> = null;
// const a3: A<[1], 0> = null;
// const a4: A<{ a: 1 }, 0> = null;
// const a5: A<{ [key: string]: number }, 'a' | 'b'> = null;
//
// a0.name = 'a';
// a0.name = 'b';
// a0.a('a', 1);
// a0.a('a', 2);
// a0.a('b', 2);
//
// const b0: A<{ a: 1, b: 2 }, 'a' | 'b'> = null;
// b0.a('a', 1);
// b0.a('a', 2);
// b0.a<'a' | 'b'>('a', 2);
// b0.a<'c'>('a', 2);




export type KeyValueMap<TKVMap, T> = {
  // [K in KeyValueMapKeys<TKVMap>]: K extends string ? T : never;
  [K in KeyValueMapKeys<TKVMap>]: T;
  // [K in keyof TKVMap]: T;
};

export type KeyValueMapKeys<TKVMap> = Extract<keyof TKVMap, string>;
// export type KeyValueMapKeys<TKVMap> = keyof TKVMap;
export type KeyValueMapValues<TKVMap> = TKVMap[KeyValueMapKeys<TKVMap>];

export type KeyValueMapGeneric = KeyValueMap<{ [key: string]: any }, any>;








