import { ICancellablePromise } from './cancellable-promise/interfaces';
import { IAdvancedAbortController } from '../misc/advanced-abort-controller/interfaces';
import { IAdvancedAbortSignal } from '../misc/advanced-abort-controller/advanced-abort-signal/interfaces';

/**
 * BETTER DEFINITIONS AND HELPERS FOR PROMISE
 */

export type TPromiseStatus =
  'fulfilled' // promise is fulfilled
  | 'rejected' // promise is rejected
  | 'pending' // promise is neither resolved nor resolving
  | 'resolving';


export type TPromiseFulfilledArgument<TIn, TOut> = ((value: TIn) => TPromiseOrValue<TOut>) | undefined | null;
export type TPromiseRejectedArgument<TOut> = ((reason: any) => TPromiseOrValue<TOut>) | undefined | null;

export type TPromiseThenReturnedValue<T, TFulfilled extends TPromiseFulfilledArgument<T, any>, TRejected extends TPromiseRejectedArgument<any>> =
  TPromiseFulfilledReturnedValue<T, TFulfilled>
  | TPromiseRejectedReturnedValue<T, TRejected>;

export type TPromiseFulfilledReturnedValue<T, TFulfilled extends TPromiseFulfilledArgument<T, any>> =
  TFulfilled extends (value: T) => TPromiseOrValue<infer TFulfilledValue>
    ? TFulfilledValue
    : T;

export type TPromiseRejectedReturnedValue<T, TRejected extends TPromiseRejectedArgument<any>> =
  TRejected extends (reason: any) => TPromiseOrValue<infer TRejectedValue>
    ? TRejectedValue
    : never;


export type TPromiseThenReturn<T, TFulfilled extends TPromiseFulfilledArgument<T, any>, TRejected extends TPromiseRejectedArgument<any>> =
  TPromise<TPromiseThenReturnedValue<T, TFulfilled, TRejected>>;

export type TPromiseCatchReturn<T, TRejected extends TPromiseRejectedArgument<any>> =
  TPromiseThenReturn<T, undefined, TRejected>;


export interface TPromiseLike<T> extends PromiseLike<T> {
  then(): TPromiseThenReturn<T, undefined, undefined>;

  then<TFulfilled extends TPromiseFulfilledArgument<T, any>>(
    onFulfilled: TFulfilled,
  ): TPromiseThenReturn<T, TFulfilled, undefined>;

  then<TFulfilled extends TPromiseFulfilledArgument<T, any>, TRejected extends TPromiseRejectedArgument<any>>(
    onFulfilled: TFulfilled,
    onRejected: TRejected,
  ): TPromiseThenReturn<T, TFulfilled, TRejected>;

  // then<TFulfilled extends TFulfilledArgument<T, any>, TRejected extends TRejectedArgument<any>>(
  //   onFulfilled?: TFulfilled,
  //   onRejected?: TRejected,
  // ): TPromiseThenReturn<T, TFulfilled, TRejected>;

  // then(
  //   onFulfilled?: undefined | null,
  //   onRejected?: undefined | null
  // ): TPromise<T>;
  // then<TFulfilled>(
  //   onFulfilled: (value: T) => TPromiseOrValue<TFulfilled>,
  //   onRejected?: undefined | null
  // ): TPromise<TFulfilled>;
  // then<TFulfilled>(
  //   onFulfilled?: (value: T) => TPromiseOrValue<TFulfilled> | undefined | null,
  //   onRejected?: undefined | null
  // ): TPromise<T | TFulfilled>;
  // then<TRejected>(
  //   onFulfilled: undefined | null,
  //   onRejected: (reason: any) => TPromiseOrValue<TRejected>
  // ): TPromise<T | TRejected>;
  // then<TFulfilled, TRejected>(
  //   onFulfilled: (value: T) => TPromiseOrValue<TFulfilled>,
  //   onRejected: (reason: any) => TPromiseOrValue<TRejected>
  // ): TPromise<TFulfilled | TRejected>;
  // then<TFulfilled, TRejected>(
  //   onFulfilled?: ((value: T) => TPromiseOrValue<TFulfilled>) | undefined | null,
  //   onRejected?: ((reason: any) => TPromiseOrValue<TRejected>) | undefined | null
  // ): TPromise<T | never | TFulfilled | TRejected>;
}

/**
 * Better definition of a Promise
 */
export interface TPromise<T> extends Promise<T> {
  then(): TPromiseThenReturn<T, undefined, undefined>;

  then<TFulfilled extends TPromiseFulfilledArgument<T, any>>(
    onFulfilled: TFulfilled,
  ): TPromiseThenReturn<T, TFulfilled, undefined>;

  then<TFulfilled extends TPromiseFulfilledArgument<T, any>, TRejected extends TPromiseRejectedArgument<any>>(
    onFulfilled: TFulfilled,
    onRejected: TRejected,
  ): TPromiseThenReturn<T, TFulfilled, TRejected>;

  // then<TFulfilled extends TFulfilledArgument<T, any>, TRejected extends TRejectedArgument<any>>(
  //   onFulfilled?: TFulfilled,
  //   onRejected?: TRejected,
  // ): TPromiseThenReturn<T, TFulfilled, TRejected>;

  catch(): TPromiseCatchReturn<T, undefined>;

  catch<TRejected extends TPromiseRejectedArgument<any>>(onRejected: TRejected): TPromiseCatchReturn<T, TRejected>;

  // catch<TRejected extends TRejectedArgument<any>>(onRejected?: TRejected): TPromiseCatchReturn<TRejected>;

  finally(onFinally?: (() => void) | undefined | null): TPromise<T>;
}


// type T1 = (() => 1) | undefined;
// const g: TPromiseThenReturn<boolean, T1, undefined>;
//
// const a: TPromise<boolean> = null as any;
// const b = a.then(() => 1); // TPromise<number>
// const b = a.then(() => 1); // TPromise<number>
// const c = a.then((3 as unknown as T1)); // TPromise<boolean | number>
// const b = a.then(void 0); // TPromise<boolean>
// const b = a.then(void 0, () => 'a'); // TPromise<boolean | string>
// const b = a.then(() => 'a', () => 1); // TPromise<string | number>
// const b = c.then((v: boolean) => null);  // TPromise<null>
// const b = a.catch(); // TPromise<boolean | never>
// const b = a.catch((v: boolean) => null); // TPromise<boolean | null>

/**
 * Better definition of a PromiseConstructor
 */
export interface TPromiseConstructor extends PromiseConstructor {
  resolve(): TPromise<void>;

  resolve<T>(value: TPromiseOrValue<T>): TPromise<T>;

  reject(reason?: any): TPromise<never>;
}


// const a: (TPromise<number> extends PromiseLike<number> ? true : false);


export type TPromiseOrValue<T> = T | PromiseLike<T>;
export type TPromiseOrValueFactory<T> = (...args: any[]) => TPromiseOrValue<T>;
export type TPromiseFactory<T> = (...args: any[]) => TPromise<T>;

export type TPromiseType<P> = P extends PromiseLike<infer T>
  ? T extends PromiseLike<any>
    ? never
    : T
  : P;

export type TPromiseOrValueFactoryType<F extends TPromiseOrValueFactory<any>> = F extends TPromiseOrValueFactory<infer P>
  ? TPromiseType<P>
  : never;


export type TPromiseOrValueTupleToCancellablePromiseTuple<TTuple extends TPromiseOrValue<any>[]> = {
  [K in keyof TTuple]: ICancellablePromise<TTuple[K] extends TPromiseOrValueFactory<infer P>
    ? TPromiseType<P>
    : TTuple[K]>;
};

export type TPromiseOrValueTupleToValueTuple<TTuple extends TPromiseOrValue<any>[]> = {
  [K in keyof TTuple]: TPromiseType<TTuple[K]>;
};

export type TPromiseOrValueFactoryTupleToValueTuple<TTuple extends TPromiseOrValueFactory<any>[]> = {
  [K in keyof TTuple]: TTuple[K] extends TPromiseOrValueFactory<infer P>
    ? TPromiseType<P>
    : TTuple[K];
};

export type TPromiseOrValueTupleToValueUnion<TTuple extends TPromiseOrValue<any>[]> = TPromiseOrValueTupleToValueTuple<TTuple>[Extract<keyof TTuple, number>];
export type TPromiseOrValueFactoryTupleToValueUnion<TTuple extends TPromiseOrValueFactory<any>[]> = TPromiseOrValueFactoryTupleToValueTuple<TTuple>[Extract<keyof TTuple, number>];


export type TPromiseCreateCallback<T> = (resolve: (value?: TPromiseOrValue<T>) => void, reject: (reason?: any) => void) => void;
export type TPromiseConstructorLike<P extends PromiseLike<any> = TPromiseLike<any>> = new(executor: TPromiseCreateCallback<TPromiseType<P>>) => P;


// export type TCancellablePromiseTuple<T> = [Promise<T>, ICancelToken];
export type ICancellablePromiseTuple<T> = {
  promise: TPromise<T>,
  controller: IAdvancedAbortController,
};

export type IPromiseAndSignalTuple<T> = {
  promise: TPromise<T>,
  signal: IAdvancedAbortSignal,
};


export interface PromiseFulfilledObject<T> {
  status: 'fulfilled';
  value: T;
}

export interface PromiseRejectedObject {
  status: 'rejected';
  reason: any;
}

export type AllSettledResult<T> = PromiseFulfilledObject<T> | PromiseRejectedObject;

