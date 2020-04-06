import { IsSubSet } from '../../classes/types';
import {
  TInferNativePromiseLikeOrValueTupleToValueTuple, TInferNativePromiseOrValueTupleToValueUnion,
  TNativePromiseLikeOrValue, TPromiseStatus
} from '../types/native';

/** TYPES **/

// promise is resolving => its final state is not known yet, but the promise's resolve/reject functions can't be called anymore

export type TDeferredPromiseRaceReturn<TTuple extends TNativePromiseLikeOrValue<any>[], TReference, TReturn> =
  true extends {
    [key in keyof TTuple]: TTuple[key] extends Promise<infer T>
      ? IsSubSet<T, TReference>
      : IsSubSet<TTuple[key], TReference>
  }[keyof TTuple] ? TReturn : never;


export type TDeferredPromiseAllReturn<TTuple extends TNativePromiseLikeOrValue<any>[], TReference, TReturn> =
  TInferNativePromiseLikeOrValueTupleToValueTuple<TTuple> extends TReference
    ? TReturn
    : never;


/** INTERFACES **/

export interface IDeferredPromiseCodes {
  readonly FULFILLED: 'fulfilled';
  readonly REJECTED: 'rejected';
  readonly PENDING: 'pending';
  readonly RESOLVING: 'resolving';
}

export interface IDeferredPromiseConstructor extends IDeferredPromiseCodes {

  // Equivalent of Promise.resolve
  resolve(): IDeferredPromise<void>;

  resolve<T>(value: TNativePromiseLikeOrValue<T>,): IDeferredPromise<T>;

  // Equivalent of Promise.reject
  reject<T = never>(reason?: any,): IDeferredPromise<T>;

  // Equivalent of new Promise(_ => _(callback())
  try<T>(callback: () => TNativePromiseLikeOrValue<T>): IDeferredPromise<T>;

  // Equivalent of Promise.race
  race<TTuple extends TNativePromiseLikeOrValue<any>[]>(values: TTuple): IDeferredPromise<TInferNativePromiseOrValueTupleToValueUnion<TTuple>>;

  // Equivalent of Promise.all
  all<TTuple extends TNativePromiseLikeOrValue<any>[]>(values: TTuple): Promise<TInferNativePromiseLikeOrValueTupleToValueTuple<TTuple>>;

  /**
   * Creates a new DeferredPromise.
   * You may provide a 'callback' providing a 'deferred' argument (referencing this DeferredPromise)
   * If 'callback' throws, the DeferredPromise is rejected
   * @param callback
   */
  new<T>(callback?: (deferred: IDeferredPromise<T>) => any): IDeferredPromise<T>;
}


/**
 * A DeferredPromise is a Promise exposing its resolve/reject functions
 */
export interface IDeferredPromise<T> extends IDeferredPromiseCodes, Promise<T> {
  readonly status: TPromiseStatus; // the status of this DeferredPromise
  readonly promise: Promise<T>; // a promise resolved when this DeferredPromise will resolve

  /**
   * INFO: resolve, reject, try, race, and all will resolve this DeferredPromise.
   * The DeferredPromise will enter in a 'resolving' state
   * Trying to call one of these functions after the DeferredPromise leaved its 'pending' state will throw an Error
   */

  // Resolves this DeferredPromise with value
  resolve(value?: TNativePromiseLikeOrValue<T>): this;

  // Rejects this DeferredPromise with value
  reject(reason?: any): this;

  /**
   * Resolves this DeferredPromise with the result of 'callback':
   *  - kind of this.resolve(new Promise(_ => _(callback())))
   * @param callback
   */
  try(callback: () => TNativePromiseLikeOrValue<T>): this;

  /**
   * Resolves this DeferredPromise with the first value/promise to resolve from 'values'
   * @param values
   */
  race<TTuple extends TNativePromiseLikeOrValue<any>[]>(values: TTuple): TDeferredPromiseRaceReturn<TTuple, T, this>;

  /**
   * Resolves this DeferredPromise when all 'values' are resolved
   * @param values
   */
  all<TTuple extends TNativePromiseLikeOrValue<any>[]>(values: TTuple): TDeferredPromiseAllReturn<TTuple, T, this>;


  // Equivalent of the 'then' of a Promise
  then<TResult1 = T, TResult2 = never>(
    onFulfilled?: ((value: T) => TNativePromiseLikeOrValue<TResult1>) | undefined | null,
    onRejected?: ((reason: any) => TNativePromiseLikeOrValue<TResult2>) | undefined | null
  ): IDeferredPromise<TResult1 | TResult2>;

  // Equivalent of the 'catch' of a Promise
  catch<TResult = never>(
    onRejected?: ((reason: any) => TNativePromiseLikeOrValue<TResult>) | undefined | null
  ): IDeferredPromise<T | TResult>;

  // Equivalent of the 'finally' of a Promise
  finally(onFinally?: (() => void) | undefined | null): IDeferredPromise<T>;

}

/*
// Example

export async function deferredPromiseExample(): Promise<void> {
  function iterable(): AsyncIterableIterator<number> {
    const deferredQueue: DeferredPromise<IteratorResult<number>>[] = [];

    let i: number = 0;
    setInterval(() => {
      if (deferredQueue.length > 0) {
        deferredQueue[0].resolve({
          value: i,
          done: false,
        });
        i++;
        deferredQueue.splice(0, 1);
      }
    }, 500);

    return {
      next: (): Promise<IteratorResult<number>> => {
        const deferred: IDeferredPromise<IteratorResult<number>> = new DeferredPromise<IteratorResult<number>>();
        deferredQueue.push(deferred);
        return deferred;
      },
      [Symbol.asyncIterator]() {
        return this;
      }
    };
  }

  for await (const value of iterable()) {
    console.log(value); // prints 0, 1, 2, 3, ... every 500ms
  }
}
*/


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
