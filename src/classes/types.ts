
// kind of any, but different => sometimes better for inference
export type Any = boolean | string | number | object | symbol | null | undefined | any[];

// converts a tuple type (ex: [number, string]) to an union of types => 'number' | 'string'
export type TupleTypes<T> = { [P in keyof T]: T[P] } extends { [key: number]: infer V } ? V : never; // type A = TupleTypes<[1, "hello", true]>; // === 1 | "hello" | true

// converts an union of types to an intersection of these types
export type UnionToIntersection<U> = (U extends any ? ((k: U) => void) : never) extends ((k: infer I) => void) ? I : never;

// converts a tuple type to an intersections of these types
export type TupleToIntersection<T> = UnionToIntersection<TupleTypes<T>>;

// converts a pure tuple to an array like tuple
export type TupleArray<TTuple extends any[], TArray> = Array<TArray> & TTuple;

// removes from T (object) the properties K (union)
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

// removes from T (object) the properties K (tuple)
export type ExcludeProperties<T, K extends (keyof T)[]> = Pick<T, Exclude<keyof T, TupleTypes<K>>>;


// https://github.com/Microsoft/TypeScript/issues/9252#issuecomment-472881853
// creates an intersection between T and U
export type Subset<T, U> = {
  [key in keyof T]: key extends keyof U ? T[key] : never
};

export type SuperSet<T, U> = {
  [key in keyof T]: key extends keyof U
    ? (U[key] extends T[key] ? T[key] : never)
    : T[key]
};

// https://stackoverflow.com/questions/51691235/typescript-map-union-type-to-another-union-type
// how to map a union type to another
// export type Distribute<U> = U extends any ? {type: U} : never;

// // if T = { a: 1, b: 2 }, and U = { a: 1, b: 2, c: 3 }
// export type SuperSet2<T, U> = {
//   // keyof T = 'a' | 'b'
//   // keyof U = 'a' | 'b' | 'c'
//   // key = 'a', 'b'
//   [key in keyof T]: key extends keyof U
//     ? (U[key] extends T[key] ? T[key] : never)
//     : T[key]
// };
//
//
// type A1 = ('a' | 'b' | 'c') extends ('a' | 'b') ? boolean : never; // => never
// type A2 = 'a'/* | 'b'*/ extends ('a' | 'b') ? boolean : never; // => boolean
// // with unions, extends behaves like a 'is sub set'
//
// type A3 = SuperSet<{ a: 1, b: 2, g: 1 }, { a: 1, b: 2, c: 3 }>;