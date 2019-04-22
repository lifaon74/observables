
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

export type Clone<T> = {
  [K in keyof T]: T[K]
};

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



export type Extends<A, B> = Clone<A> extends B
  ? true
  : false;

export type Not<A> = A extends true
  ? false
  : true;

export type And<A, B> = A extends true
  ? B extends true
    ? true
    : false
  : false;


export type TupleToUnion<T extends any[]> = T[number];



export type IsSubSet<TSet, TReferenceSet> = Clone<TSet> extends TReferenceSet
  ? true
  : false;

export type IsSuperSet<TSet, TReferenceSet> = IsSubSet<TReferenceSet, TSet>;

// export type IsSuperSet<TSet, TReferenceSet> = UnionToIntersection<TSet> extends UnionToIntersection<TReferenceSet>
//   ? Clone<TSet> extends UnionToIntersection<TReferenceSet>
//     ? false
//     : true
//   : Clone<TReferenceSet> extends UnionToIntersection<TSet>
//     ? true
//     : false;

// export type IsSuperSet<TSet, TReferenceSet> = UnionToIntersection<TSet> extends UnionToIntersection<TReferenceSet>
//   ? Not<Extends<TSet, UnionToIntersection<TReferenceSet>>>
//   : Extends<TReferenceSet, UnionToIntersection<TSet>>;

export type IsIntersecting<TSet, TReferenceSet> =
  true extends (
    TSet extends TReferenceSet
      ? true
      : TReferenceSet extends TSet
        ? true
        : false
  )
    ? true
    : false;


export type IsIntersection<T> = //  extends PropertyKey
    Clone<T> extends T
        ? false
        : true;

export type IsUnion<T> =
    Clone<T> extends UnionToIntersection<T>
        ? false
        : Not<IsIntersection<T>>;

export type IsSingleton<T> =
  Clone<T> extends T
      ? Clone<T> extends UnionToIntersection<T>
        ? true
        : false
    : false;

// const b0: IsSubSet<'a', 'a' | 'b'> = true;
// const b1: IsSubSet<'a' | 'b', 'a' | 'b' | 'c'> = true;
// const b2: IsSubSet<'a' | 'b' | 'c', 'a' | 'b'> = false;
// const b3: IsSubSet<'a' | 'd', 'a' | 'b'> = false;
// const b4: IsSubSet<'a' | 'b', string> = true;
// const b5: IsSubSet<string, 'a' | 'b'> = false;
// const b6: IsSubSet<'a' | 'b', 'a' | 'b'> = true;
//
// const a0: IsSuperSet<'a' | 'b', 'a'> = true;
// const a1: IsSuperSet<'a' | 'b' | 'c', 'a' | 'b'> = true;
// const a2: IsSuperSet<'a' | 'b', 'a' | 'b' | 'c'> = false;
// const a3: IsSuperSet<'a' | 'b', 'a' | 'd'> = false;
// const a4: IsSuperSet<string, 'a' | 'b'> = true;
// const a5: IsSuperSet<'a' | 'b', string> = false;
// const a6: IsSuperSet<'a' | 'b', 'a' | 'b'> = true;


// const c0: IsIntersecting<'a' | 'b', 'a'> = true;
// const c1: IsIntersecting<'a' | 'b', 'a' | 'c'> = true;
// const c2: IsIntersecting<'a', 'a' | 'c'> = true;
// const c3: IsIntersecting<'a', 'b' | 'c'> = false;
// const c4: IsIntersecting<'b' | 'c', 'a'> = false;
// const c5: IsIntersecting<string, 'a'> = true;
// const c6: IsIntersecting<'a', string> = true;
// const c7: IsIntersecting<1 | 3, number> = true;


// const i0: IsIntersection<'a'> = false;
// const i1: IsIntersection<'a' | 'b'> = false;
// const i2: IsIntersection<'a' & 'b'> = true;
//
// const u0: IsUnion<'a'> = false;
// const u1: IsUnion<'a' | 'b'> = true;
// const u2: IsUnion<'a' & 'b'> = false;
//
// const s0: IsSingleton<'a'> = true;
// const s1: IsSingleton<'a' | 'b'> = false;
// const s2: IsSingleton<'a' & 'b'> = false;

// const a: keyof ('a' & 'b');
// const a: keyof ('a' | 'b');

// const a: (string extends ('a' | 'b') ? true : false);
// const a: (string extends ('a' & 'b') ? true : false); // => false
// const a: (('a' & 'b') extends string ? true : false); // => true
// ('a' & 'b' & 'c') extends ('a' & 'b') => true

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
