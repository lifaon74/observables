
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


// export type KeyValueMap<TKVMap, T> = {
//     [K in Extract<keyof TKVMap, string>]: T;
// };
//
// export type KeyValueMapConstraint<TKVMap, T> = KeyValueMap<TKVMap, any> extends TKVMap
//   ? KeyValueMap<TKVMap, T>
//   : never;

// export type KeyValueMapConstraint<TKVMap extends object, TKVMapRef extends object> = KeyValueMap<TKVMap> extends TKVMapRef
//   ? KeyValueMap<TKVMap>
//   : IsAny<TKVMap> extends true
//     ? KeyValueMap<TKVMap>
//     : never;



export type KeyValueMap<TKVMap extends object> = {
    [K in Extract<keyof TKVMap, string>]: TKVMap[K];
    // [K in keyof TKVMap]: TKVMap[K];
};

export type KeyValueMapConstraint<TKVMap extends object, TKVMapRef extends object> = KeyValueMap<TKVMap> extends TKVMap
  ? KeyValueMap<TKVMap> extends TKVMapRef
    ? KeyValueMap<TKVMap>
    : never
  : never;

export type KeyValueMapKeys<TKVMap extends object> = TKVMap extends never ? never : Extract<keyof TKVMap, string>;
export type KeyValueMapValues<TKVMap extends object> = TKVMap extends never ? never : TKVMap[KeyValueMapKeys<TKVMap>];

export type KeyValueMapGeneric = { [key: string]: any };
export type KeyValueMapGenericConstraint<TKVMap extends object> = KeyValueMapConstraint<TKVMap, KeyValueMapGeneric>;

export type KVRecord<T extends string, V> = Record<Extract<T, string>, V>;





//
// class A<TKVMap extends KeyValueMapConstraint<TKVMap, { load: Event }>> {
//
// }
//
// class B<TKVMap extends KeyValueMapGenericConstraint<TKVMap>> {
//
// }
//
// export type Z<TKVMap extends object> =
//     TKVMap extends KeyValueMapGenericConstraint<TKVMap>
//       ? KeyValueMap<TKVMap>
//       : never;
//
// export type Clone1<T> = IsType<string, T> extends true ? string : never;
//
// // type Record<K extends StringConstraint<K>, T> = KeyValueMapConstraint<{
// //     [P in K]: T;
// // }, KeyValueMapGeneric>;
//
// // export type X<T extends string, V> =
// //   'a' extends string
// //     ? Record<'a', V>
// //     : never;
//
// export type X<T extends string, V> =
//   'a' extends string
//     ? Pick<KeyValueMapGeneric, T>
//     : never;
//
// export type Y<T extends string, V> = X<T, V>;
//
// // export type Y<TKVMap extends object> =
// //   TKVMap extends { [key: string]: infer V }
// //     //? Record<T, V> extends KeyValueMapConstraint<Record<T, V>, KeyValueMapGeneric>
// //     ? Record<string, any>
// //     : never
// //   // : never
// //   ;
//
// type StringConstraint<T> = IsType<string, T> extends true
//   ? string
//   : never;
//
// const a: B<{a: 1 | 3} | {a: 4, b: 2}>;
// const a: Y<'a' | 'c', 'b'>;
//
// class C<T extends string> extends B<KVRecord<T, any>> {
// // class C<T extends string> extends B<Y<T, any>> {
// // class C<T extends string> extends B<Y<Record<T, any>>> {
//
// }
//

// const b =  new C<0>();
// const b =  new C<'a'>();
// const b =  new C<string>();

// const a: KeyValueMap<any> extends any ? true : false;
// const a: never extends any ? true : false; // true
// const a: any extends never ? true : false; // boolean
// const a: any extends number ? true : false; // boolean
// const a: number extends any ? true : false; // true
// const a: KeyValueMap<never> ;
// const b =  new A<0>();
// const b =  new A<{j: 1}>();
// const b =  new A<{ load: Event }>();
// const b =  new A<WindowEventMap>();
// const b = new A<never>();
// const b = new A<any>();

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







