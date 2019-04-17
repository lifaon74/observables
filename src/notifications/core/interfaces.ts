
// export type KeyValueMap<TKVMap extends { [key: string]: T }, T> =
//   any extends TKVMap
//     ? never
//     : {
//       [K in KeyValueMapKeys<TKVMap>]: T;
//     };

export type KeyValueMap<TKVMap extends { [key: string]: T }, T> =
  any extends TKVMap
    ? never
    : {
      [K in Extract<keyof TKVMap, string>]: T;
    };

export type KeyValueMapKeys<TKVMap> = TKVMap extends never ? never : Extract<keyof TKVMap, string>;
export type KeyValueMapValues<TKVMap> = TKVMap extends never ? never : TKVMap[KeyValueMapKeys<TKVMap>];

export type KeyValueMapGeneric = KeyValueMap<{ [key: string]: any }, any>;








