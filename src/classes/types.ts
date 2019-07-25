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


export type RequireProperties<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
export type PartialProperties<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
// export type RequireProperties<T, K extends keyof T> = T & {
//   [P in K]-?: T[P];
// };


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


export type TObject = { [key in any]: any };

// https://github.com/Microsoft/TypeScript/issues/26223
// https://github.com/ksxnodemodules/typescript-tuple/blob/master/lib/utils.ts



export type ToTuple<T> = {
  [K in Extract<keyof T, number>]: T[K];
};

export type IsEmptyTuple<Tuple extends any[]> = Tuple extends [] ? true : false;

// const a1: IsEmptyTuple<[]> = true;
// const a2: IsEmptyTuple<[1]> = false;

/**
 * Returns 'Finite' if the tuple is Finite, else returns 'Infinite'
 */
export type TupleIsFinite<Tuple extends any[], Finite, Infinite> = {
  empty: Finite
  nonEmpty: ((...list: Tuple) => any) extends ((first: infer First, ...rest: infer Rest) => any)
    ? TupleIsFinite<Rest, Finite, Infinite>
    : never
  infinite: Infinite
}[
  Tuple extends []
    ? 'empty'
    : Tuple extends (infer Item)[]
    ? Item[] extends Tuple
      ? 'infinite'
      : 'nonEmpty'
    : never
  ];

// const a1: IsFinite<[], true, false> = true;
// const a2: IsFinite<any[], true, false>  = false;

/**
 * Creates a union from the types of an Array or tuple
 */
export type TupleToUnion<Tuple extends any[]> = Tuple[number];

/**
 * Returns the length of an array or tuple
 */
export type TupleLength<Tuple extends any[]> = Tuple['length'];

/**
 * Returns all but the first item's type in a tuple/array
 */
export type TupleShift<Tuple extends any[]> =
  ((...list: Tuple) => any) extends ((first: any, ...rest: infer R) => any) ? R : never;

/**
 * Returns the given tuple/array with the item type prepended to it
 */
export type TupleUnshift<Tuple extends any[], Item> =
  ((first: Item, ...rest: Tuple) => any) extends ((...list: infer R) => any) ? R : never;

/**
 * Reverses items of a tuple
 */
export type TupleReverse<Tuple extends any[], Prefix extends any[] = []> = {
  empty: Prefix,
  nonEmpty: ((...list: Tuple) => any) extends ((first: infer First, ...rest: infer Rest) => any)
    ? TupleReverse<Rest, TupleUnshift<Prefix, First>>
    : never
  infinite: Array<any> & {
    ERROR: 'Cannot reverse an infinite tuple'
    CODENAME: 'InfiniteTuple'
  }
}[
  // Tuple extends [any, ...any[]]
  //   ? TupleIsFinite<Tuple, 'nonEmpty', 'infinite'>
  //   : 'empty'
  Tuple extends []
    ? 'empty'
    : TupleIsFinite<Tuple, 'nonEmpty', 'infinite'>
  ];

// const a: TupleReverse<[1, 2]>;
// const a: TupleReverse<[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]>;
// const a: TupleReverse<any[]>;

// export type TuplePush<T extends any[], Item> = T & {
//   [K in Extract<T['length'], number>]: Item;
// };

// export type TuplePush<T extends any[], Item, R = CreateRange<T['length']>> = {
//   [K in keyof R]: T[Extract<keyof T, K>];
// };

export type TuplePush<Tuple extends any[], Item> = TupleReverse<TupleUnshift<TupleReverse<Tuple>, Item>>

// const a: TuplePush<[1, 2], 3>;

export type TupleConcat<Left extends any[], Right extends any[]> = {
  emptyLeft: Right
  singleLeft: Left extends [infer Item]
    ? TupleUnshift<Right, Item>
    : never
  multiLeft: ((...list: TupleReverse<Left>) => any) extends ((first: infer LeftLast, ...rest: infer ReversedLeftRest) => any)
    ? TupleConcat<TupleReverse<ReversedLeftRest>, TupleUnshift<Right, LeftLast>>
    : never
  infiniteLeft: Array<any> & {
    ERROR: 'Left is not finite',
    CODENAME: 'InfiniteLeft' & 'Infinite'
  }
}[
  Left extends [] ? 'emptyLeft' :
    Left extends [any] ? 'singleLeft' :
      TupleIsFinite<Left, 'multiLeft', 'infiniteLeft'>
  ];


// const a: TupleConcat<[1, 2], [3, 4]>;
// const a: TupleReverse<[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]>;
// const a: TupleReverse<any[]>;


export type TupleEquals<T, S> =
  [T] extends [S] ? (
    [S] extends [T] ? true : false
    ) : false;

export type CreateRange<N, T extends number[] = []> = {
  0: T,
  1: CreateRange<N, TupleUnshift<T, TupleLength<T>>>,
}[TupleEquals<TupleLength<TupleShift<T>>, N> extends true ? 0 : 1];


export type TupleFirst<Tuple extends any[], Default = never> =
  Tuple extends [any, ...any[]] ? Tuple[0] : Default

export type TupleLast<Tuple extends any[], Default = never> = {
  empty: Default
  single: Tuple extends [infer Item] ? Item : never
  multi: ((...list: Tuple) => any) extends ((first: any, ...rest: infer Next) => any) ? TupleLast<Next> : Default
  infinite: Tuple extends (infer Item)[] ? Item : never
}[
  Tuple extends [] ? 'empty' :
    Tuple extends [any] ? 'single' :
      Tuple extends (infer Item)[]
        ? Item[] extends Tuple ? 'infinite'
        : 'multi'
        : never
  ]


// const a: TupleShift<[1, 2]>;
// const a: TupleUnshift<[1, 2], 3>;
// const a: TupleLast<[1, 2]>;

// const a: TuplePush<[1, 2], 3>;
// const b = a[6];
// a[1] = 5;

// const a: CreateRange<10>;


/**
 * Tests if two types are equal
 */
type Equals<T, S> =
  [T] extends [S] ? (
    [S] extends [T] ? true : false
    ) : false;


// export type IsSubSet<TSet, TReferenceSet> = Clone<TSet> extends TReferenceSet
export type IsSubSet<TSet, TReferenceSet> = [TSet] extends [TReferenceSet]
  ? true
  : false;

export type IsSuperSet<TSet, TReferenceSet> = IsSubSet<TReferenceSet, TSet>;

export type IsEqualSet<TSet1, TSet2> = [TSet1] extends [TSet2]
  ? Clone<TSet2> extends TSet1
    ? true
    : false
  : false;

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
  [T] extends [UnionToIntersection<T>]
    ? false
    : Not<IsIntersection<T>>;

export type IsSingleton<T> =
  Clone<T> extends T
    ? [T] extends [UnionToIntersection<T>]
      ? true
      : false
    : false;

export type IsType<TargetType, T> =
  false extends (
      TargetType extends T
        ? T extends TargetType
          ? true
          : false
        : false
      )
    ? false
    : true;


// export type IsReadonly<T extends object, K extends keyof T> = T extends {
//   readonly [P in K]: T[P];
// } ? true : false;
//
//
// const a1: { a: string } extends { readonly a: string } ? true : false = true;
// const a2: { readonly a: string } extends { a: string } ? true : false = true;
// const a3: readonly [string] extends [string] ? true : false = false;
// const a4: [string] extends readonly [string] ? true : false = true;
// const a5: readonly [string] extends readonly [string] ? true : false = true;
// // const a: IsReadonly<{ a: string }, 'a'> = false;

// const y0: IsType<string, any> = false;
// const y1: IsType<string, 'a'> = false;
// const y2: IsType<string , string> = true;
// const y3: IsType<string , 'a' | string> = true;
// const y4: IsType<string , 'a' | 'b'> = false;

// const b0: IsSubSet<'a', 'a' | 'b'> = true;
// const b1: IsSubSet<'a' | 'b', 'a' | 'b' | 'c'> = true;
// const b2: IsSubSet<'a' | 'b' | 'c', 'a' | 'b'> = false;
// const b3: IsSubSet<'a' | 'd', 'a' | 'b'> = false;
// const b4: IsSubSet<'a' | 'b', string> = true;
// const b5: IsSubSet<string, 'a' | 'b'> = false;
// const b6: IsSubSet<'a' | 'b', 'a' | 'b'> = true;
// const b7: IsSubSet<Uint8Array, Uint8Array> = true;

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
//
// const z0: IsType<any, any> = true;
// const z1: IsType<any, 'a'> = false;
// const z2: IsType<any, 'a' | any> = true;


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
