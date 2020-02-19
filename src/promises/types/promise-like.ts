

// very generic PromiseLike, used to infer its type
export interface ILightPromiseLike<T> {
  then(cb: (value: T, ...args: any[]) => any): any;
}

// returns the type of a PromiseLike, or never
export type TInferLightPromiseLikeType<T extends ILightPromiseLike<unknown>> = T extends ILightPromiseLike<infer TValue>
  ? TValue
  : never;

// // INFO debug TInferLightPromiseLikeType
// const a: TInferLightPromiseLikeType<IPromiseLike<unknown>>;
// const a: TInferLightPromiseLikeType<IPromiseLike<number>>;
// const a: TInferLightPromiseLikeType<IPromiseLike<number | string>>;


// returns all the key of an union of types
export type KeysOfUnion<T> = T extends any ? keyof T : never;

// INFO debug KeysOfUnion
// const a: KeysOfUnion<unknown>;
// const a: KeysOfUnion<any>; // nope
// const a: KeysOfUnion<never>;
// const a: KeysOfUnion<undefined>;
// const a: KeysOfUnion<number>;
// const a: KeysOfUnion<string>;
// const a: KeysOfUnion<null>;
// const a: KeysOfUnion<object>;
// const a: KeysOfUnion<{}>;
// const a: KeysOfUnion<{ a: 1 } | { b: 2 }>;

// returns true if T contains the property 'then'
export type TContainsThen<T> = KeysOfUnion<T> extends never
  ? false
  // : KeysOfUnion<any> extends KeysOfUnion<T>
  // ? false
  : (
    'then' extends KeysOfUnion<T>
  ? true
  : false
);

// INFO debug TContainsThen
// const a: TContainsThen<unknown> = false;
// const a: TContainsThen<any> = true; // nope
// const a: TContainsThen<never> = false;
// const a: TContainsThen<undefined> = false;
// const a: TContainsThen<number> = false;
// const a: TContainsThen<string> = false;
// const a: TContainsThen<null> = false;
// const a: TContainsThen<object> = false;
// const a: TContainsThen<{}> = false;
// const a: TContainsThen<{ a: 1 } | { b: 2 }> = false;
// const a: TContainsThen<{ a: 1 } | Promise<number>> = true;

// OLD
// type TPromiseLikeConstraint<T> = KeysOfUnion<T> extends never
//   ? unknown
//     // : KeyOf<any> extends KeyOf<T>
//     // ? any
//   : (
//     'then' extends KeysOfUnion<T>
//       ? never
//       : unknown
//     );

// constraints T to have no property 'then'
export type TPromiseLikeConstraint<T> = TContainsThen<T> extends true ? never : unknown;

// INFO debug TPromiseLikeConstraint
// const a: TPromiseLikeConstraint<unknown>;
// const a: TPromiseLikeConstraint<any>; // nope
// const a: TPromiseLikeConstraint<never>;
// const a: TPromiseLikeConstraint<undefined>;
// const a: TPromiseLikeConstraint<number>;
// const a: TPromiseLikeConstraint<string>;
// const a: TPromiseLikeConstraint<null>;
// const a: TPromiseLikeConstraint<object>;
// const a: TPromiseLikeConstraint<{}>;
// const a: TPromiseLikeConstraint<{ a: 1 } | { b: 2 }>;
// const a: TPromiseLikeConstraint<{ a: 1 } | Promise<number>>;


// better definition of a PromiseLike
export interface IPromiseLike<T extends TPromiseLikeConstraint<T>> {
  then(): TInferPromiseLikeReturnedByThen<T, undefined, undefined>;
  then<
    TFulfilled extends TPromiseLikeFulfilledArgument<T>,
  >(fulfilled: TFulfilled): TInferPromiseLikeReturnedByThen<T, TFulfilled, undefined>;
  then<
    TFulfilled extends TPromiseLikeFulfilledArgument<T>,
    TRejected extends TPromiseLikeRejectedArgument
  >(fulfilled: TFulfilled, rejected: TRejected): TInferPromiseLikeReturnedByThen<T, TFulfilled, TRejected>;
}

// returns an IPromiseLike<T> if T fulfills the constraint, else returns never
export type IPromiseLikeNonConstrained<T> = [T] extends [TPromiseLikeConstraint<T>] ? IPromiseLike<T> : never;


// // INFO debug IPromiseLike
// const a: IPromiseLike<unknown>;
// const a: IPromiseLike<any>; // nope
// const a: IPromiseLike<never>;
// const a: IPromiseLike<undefined>;
// const a: IPromiseLike<number>;
// const a: IPromiseLike<string>;
// const a: IPromiseLike<null>;
// const a: IPromiseLike<object>;
// const a: IPromiseLike<{}>;
// const a: IPromiseLike<{ a: 1 } | { b: 2 }>;
// const a: IPromiseLike<{ a: 1 } | Promise<number>>; // nope

// a PromiseLike or a value of type T
export type TPromiseLikeOrValue<T extends TPromiseLikeConstraint<T>> = IPromiseLike<T> | T;

// the 'fulfilled' (first argument of 'then') callback definition
export type TPromiseLikeFulfilledCallback<Tin extends TPromiseLikeConstraint<Tin>> = (value: Tin) => TPromiseLikeOrValue<unknown>;

// the 'fulfilled' (first argument of 'then') argument definition
export type TPromiseLikeFulfilledArgument<Tin extends TPromiseLikeConstraint<Tin>> =
  TPromiseLikeFulfilledCallback<Tin>
  | undefined
  | null;

// // INFO debug IPromiseLike fulfilled
// const a: IPromiseLike<string> = null as any;
// a.then(() => {}); // OK
// a.then((v: string) => {}); // OK
// a.then((v: string, a: number) => {}); // nope
// a.then((v: number) => {}); // nope
// a.then((v: number | string) => {}); // OK
//
// const b: IPromiseLike<string | number> = null as any;
// b.then(() => {}); // OK
// b.then((v: Promise<number>) => {}); // nope
// b.then((v: string) => {}); // nope
// b.then((v: number) => {}); // nope
// b.then((v: number | string) => {}); // OK
//
// const c: IPromiseLike<string> = null as any;
// c.then(() => 5); // OK
// c.then(() => 'abc'); // OK
// c.then(() => ('abc' as any as Promise<string>)); // OK
// c.then(() => ('abc' as any as Promise<Promise<string>>)); // OK => MUST return never
//
// const d: IPromiseLike<string> = null as any;
// d.then(void 0); // OK
// d.then(null); // OK

// the 'rejected' (second argument of 'then') callback definition
export type TPromiseLikeRejectedCallback = (reason: any) => TPromiseLikeOrValue<unknown>;

// the 'rejected' (second argument of 'then') argument definition
export type TPromiseLikeRejectedArgument =
  TPromiseLikeRejectedCallback
  | undefined
  | null;


// infers returned value of the 'then' method of a PromiseLike. If one of the types is incorrect, returns never
export type TInferPromiseLikeReturnedByThen<Tin extends TPromiseLikeConstraint<Tin>,
  TFulfilled extends TPromiseLikeFulfilledArgument<Tin>,
  TRejected extends TPromiseLikeRejectedArgument> =
  TFulfilled extends (...args: any[]) => infer TFulfillValue
    ? ( // TFulfilled is a function
      TFulfillValue extends ILightPromiseLike<infer TFulfillPromiseValue>
        ? TInferPromiseLikeReturnedByThenRejectNonConstrained<TFulfillPromiseValue, TRejected> // TFulfilled returned value is a PromiseLike
        : TInferPromiseLikeReturnedByThenRejectNonConstrained<TFulfillValue, TRejected> // TFulfilled returned value is a simple value
      )
    : ( // TFulfilled is a not function
      TFulfilled extends (null | undefined)
        ? TInferPromiseLikeReturnedByThenReject<Tin, TRejected> // TFulfilled is null, so returned value is: Tin or ...
        : never
      )
  ;

// infers returned value of the 'then' method of a PromiseLike, working on the TRejected definition. If one of the types is incorrect, returns never
export type TInferPromiseLikeReturnedByThenReject<U  extends TPromiseLikeConstraint<U>, TRejected extends TPromiseLikeRejectedArgument> =
  TRejected extends (...args: any[]) => infer TRejectValue
    ? (  // TRejected is a function
      TRejectValue extends ILightPromiseLike<infer TRejectPromiseValue>
        ? IPromiseLikeNonConstrained<U | TRejectPromiseValue> // TRejected returned value is a PromiseLike
        : IPromiseLikeNonConstrained<U | TRejectValue> // TRejected returned value is a simple value
      )
    : ( // TRejected is not a function
      TRejected  extends (null | undefined)
        ? IPromiseLike<U | never> // TRejected is null
        : never
      )
;

// returns an TInferPromiseLikeReturnedByThenReject<U, TRejected> if U fulfills the constraint, else returns never
export type TInferPromiseLikeReturnedByThenRejectNonConstrained<U, TRejected extends TPromiseLikeRejectedArgument> =
  U extends TPromiseLikeConstraint<U>
    ? TInferPromiseLikeReturnedByThenReject<U, TRejected>
    : never;

// INFO debug TInferPromiseLikeReturnedByThen
// const a: TInferPromiseLikeReturnedByThen<'a', null, null>; // 'a'
//
// const a: TInferPromiseLikeReturnedByThen<'a', null, () => 'c'>; // 'a' | 'c'
// const a: TInferPromiseLikeReturnedByThen<'a', null, () => Promise<'c'>>; // 'a' | 'c'
// const a: TInferPromiseLikeReturnedByThen<'a', null, () => Promise<Promise<'c'>>>; // nope
//
// const a: TInferPromiseLikeReturnedByThen<'a', () => 'b', null>; // 'b'
// const a: TInferPromiseLikeReturnedByThen<'a', () => Promise<'b'>, null>; // 'b'
// const a: TInferPromiseLikeReturnedByThen<'a', () => Promise<Promise<'b'>>, null>; // nope
//
// const a: TInferPromiseLikeReturnedByThen<'a', () => 'b', () => 'c'>; // 'b' | 'c'
// const a: TInferPromiseLikeReturnedByThen<'a', () => Promise<'b'>, () => 'c'>; // 'b' | 'c'
// const a: TInferPromiseLikeReturnedByThen<'a', () => 'b', () => Promise<'c'>>; // 'b' | 'c'
// const a: TInferPromiseLikeReturnedByThen<'a', () => Promise<'b'>, () => Promise<'c'>>; // 'b' | 'c'
// const a: TInferPromiseLikeReturnedByThen<'a', () => 'b', () => Promise<Promise<'c'>>>; // nope
// const a: TInferPromiseLikeReturnedByThen<'a', () => Promise<Promise<'b'>>, () => 'c'>; // nope
// const a: TInferPromiseLikeReturnedByThen<'a', () => Promise<Promise<'b'>>, () => Promise<Promise<'c'>>>; // nope

export type TInferPromiseLikeType<P extends IPromiseLike<unknown>> = P extends IPromiseLike<infer T> ? T : never;


// INFO debug with longer example
// const a: IPromiseLike<'a'> = null as any;
// const b = a.then((): 'b' => 'b', (): 'c' => 'c');
// const c = b.then((v: 'b' | 'c'): 'd' => 'd');
// const d = c.then(void 0, (): 'e' => 'e');

// const a: IPromiseLike<unknown> = null as any;
// const b = a.then((v: unknown) => 'a');

