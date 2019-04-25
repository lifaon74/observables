
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

export type KeyValueMapGeneric = KeyValueMap<{ [key: string]: any }, any>;








