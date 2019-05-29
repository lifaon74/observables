import { TPromiseOrValue, TPromiseOrValueTupleToValueTuple, TPromiseOrValueTupleToValueUnion } from '../interfaces';
import { IsSubSet } from '../../classes/types';

/** TYPES **/

export type TPromiseStatus = 'fulfilled' | 'rejected' | 'pending' | 'resolving';

export type TDeferredPromiseRaceReturn<TTuple extends TPromiseOrValue<any>[], TReference, TReturn> =
  true extends {
    [key in keyof TTuple]: TTuple[key] extends Promise<infer T>
      ? IsSubSet<T, TReference>
      : IsSubSet<TTuple[key], TReference>
  }[keyof TTuple] ? TReturn : never;


export type TDeferredPromiseAllReturn<TTuple extends TPromiseOrValue<any>[], TReference, TReturn> =
  TPromiseOrValueTupleToValueTuple<TTuple> extends TReference
    ? TReturn
    : never;


/** INTERFACES **/

export interface IDeferredPromiseConstructor {

  readonly FULFILLED: 'fulfilled';
  readonly REJECTED: 'rejected';
  readonly PENDING: 'pending';

  resolve(): IDeferredPromise<void>;

  resolve<T>(value: TPromiseOrValue<T>,): IDeferredPromise<T>;

  reject<T = never>(reason?: any,): IDeferredPromise<T>;

  try<T>(callback: () => TPromiseOrValue<T>): IDeferredPromise<T>;

  race<TTuple extends TPromiseOrValue<any>[]>(values: TTuple): IDeferredPromise<TPromiseOrValueTupleToValueUnion<TTuple>>;

  all<TTuple extends TPromiseOrValue<any>[]>(values: TTuple): Promise<TPromiseOrValueTupleToValueTuple<TTuple>>;

  new<T>(callback?: (deferred: IDeferredPromise<T>) => any): IDeferredPromise<T>;
}

export interface IDeferredPromiseCodes {
  readonly FULFILLED: 'fulfilled';
  readonly REJECTED: 'rejected';
  readonly PENDING: 'pending';
  readonly RESOLVING: 'resolving';
}

export interface IDeferredPromise<T> extends IDeferredPromiseCodes, Promise<T> {
  readonly status: TPromiseStatus;
  readonly promise: Promise<T>;


  resolve(value?: TPromiseOrValue<T>): this;

  reject(reason?: any): this;

  try(callback: () => TPromiseOrValue<T>): this;

  race<TTuple extends TPromiseOrValue<any>[]>(values: TTuple): TDeferredPromiseRaceReturn<TTuple, T, this>;

  all<TTuple extends TPromiseOrValue<any>[]>(values: TTuple): TDeferredPromiseAllReturn<TTuple, T, this>;


  then<TResult1 = T, TResult2 = never>(
    onFulfilled?: ((value: T) => TPromiseOrValue<TResult1>) | undefined | null,
    onRejected?: ((reason: any) => TPromiseOrValue<TResult2>) | undefined | null
  ): IDeferredPromise<TResult1 | TResult2>;

  catch<TResult = never>(
    onRejected?: ((reason: any) => TPromiseOrValue<TResult>) | undefined | null
  ): IDeferredPromise<T | TResult>;

  finally(onFinally?: (() => void) | undefined | null): IDeferredPromise<T>;

}

// const v: unknown = null;
//
// const a = (v as IDeferredPromise<1>).race(v as [1, 2]).then;
// const a = (v as IDeferredPromise<1>).race(v as [2]).then; // should fail
// const a = (v as IDeferredPromise<number>).race(v as [2]).then;
// const a = (v as IDeferredPromise<1>).race(v as number[]).then; // should fail
//
// const a = (v as IDeferredPromise<1>).all(v as [1, 2]).then; // should fail because its not an array
// const a = (v as IDeferredPromise<[1, 2]>).all(v as [1, 2]).then;
// const a = (v as IDeferredPromise<[1, 2]>).all(v as [Promise<1>, 2]).then;
// const a = (v as IDeferredPromise<[1, 2, 3]>).all(v as [Promise<1>, 2]).then; // should fail
// const a = (v as IDeferredPromise<number[]>).all(v as [Promise<1>, 2]).then;
// const a = (v as IDeferredPromise<[1, 3]>).all(v as [1, 2]).then; // should fail
