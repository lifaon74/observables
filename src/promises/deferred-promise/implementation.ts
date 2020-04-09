import {
  IDeferredPromise, IDeferredPromiseCodes, TDeferredPromiseAllReturn, TDeferredPromiseRaceReturn
} from './interfaces';
import { IsObject, noop } from '../../helpers';
import {
  TInferNativePromiseLikeOrValueTupleToValueTuple, TInferNativePromiseOrValueTupleToValueUnion,
  TNativePromiseLikeOrValue, TPromiseStatus
} from '../types/native';
import { ConstructClassWithPrivateMembers } from '@lifaon/class-factory';


export const DEFERRED_PROMISE_PRIVATE = Symbol('deferred-promise-private');

export interface IDeferredPromisePrivate<T> {
  promise: Promise<T>;
  resolve: ((value?: TNativePromiseLikeOrValue<T>) => void);
  reject: ((reason?: any) => void);
  status: TPromiseStatus;
}

export interface IDeferredPromiseInternal<T> extends IDeferredPromise<T> {
  [DEFERRED_PROMISE_PRIVATE]: IDeferredPromisePrivate<T>;
}


export function ConstructDeferredPromise<T>(
  instance: IDeferredPromise<T>,
  callback?: (deferred: IDeferredPromise<T>) => any,
): void {
  ConstructClassWithPrivateMembers(instance, DEFERRED_PROMISE_PRIVATE);
  const privates: IDeferredPromisePrivate<T> = (instance as IDeferredPromiseInternal<T>)[DEFERRED_PROMISE_PRIVATE];

  if ((callback !== void 0) && (typeof callback !== 'function')) {
    throw new TypeError(`Expected function or void as DeferredPromise first argument.`);
  }

  privates.status = 'pending';

  privates.promise = new Promise<T>((resolve: (value?: TNativePromiseLikeOrValue<T>) => void, reject: (reason?: any) => void) => {
    privates.resolve = (value?: TNativePromiseLikeOrValue<T>): void => {
      privates.status = 'resolving';
      resolve(value);
    };
    privates.reject = (reason?: any): void => {
      privates.status = 'resolving';
      reject(reason);
    };

    if (callback !== void 0) {
      try {
        callback.call(instance, instance);
      } catch (error) {
        privates.reject(error);
      }
    }
  }).then((value: T) => {
    privates.status = 'fulfilled';
    return value;
  }, (error: any) => {
    privates.status = 'rejected';
    return Promise.reject(error);
  });
}


export function IsDeferredPromise(value: any): value is IDeferredPromise<any> {
  return IsObject(value)
    && value.hasOwnProperty(DEFERRED_PROMISE_PRIVATE);
}

function EnsuresDeferredPromiseIsPending<T>(instance: IDeferredPromise<T>, methodName: string, callback: () => void): void {
  if ((instance as IDeferredPromiseInternal<T>)[DEFERRED_PROMISE_PRIVATE].status === 'pending') {
    callback();
  } else {
    throw new Error(`Cannot call '${ name }' on a DeferredPromise in state '${ (instance as IDeferredPromiseInternal<T>)[DEFERRED_PROMISE_PRIVATE].status }'`);
  }
}


export function DeferredPromiseResolve<T>(instance: IDeferredPromise<T>, value?: TNativePromiseLikeOrValue<T>): void {
  EnsuresDeferredPromiseIsPending<T>(instance, 'resolve', () => {
    (instance as IDeferredPromiseInternal<T>)[DEFERRED_PROMISE_PRIVATE].resolve(value);
  });
}

export function DeferredPromiseReject<T>(instance: IDeferredPromise<T>, reason?: any): void {
  EnsuresDeferredPromiseIsPending<T>(instance, 'reject', () => {
    (instance as IDeferredPromiseInternal<T>)[DEFERRED_PROMISE_PRIVATE].reject(reason);
  });
}

export function DeferredPromiseTry<T>(instance: IDeferredPromise<T>, callback: () => TNativePromiseLikeOrValue<T>): void {
  if (typeof callback !== 'function') {
    throw new TypeError(`Expected function as callback`);
  } else {
    EnsuresDeferredPromiseIsPending<T>(instance, 'try', () => {
      (instance as IDeferredPromiseInternal<T>)[DEFERRED_PROMISE_PRIVATE].resolve(new Promise<T>((resolve: any) => {
        resolve(callback.call(instance));
      }));
    });
  }
}

export function DeferredPromiseRace<T>(instance: IDeferredPromise<T>, values: TNativePromiseLikeOrValue<any>[]): void {
  EnsuresDeferredPromiseIsPending<T>(instance, 'race', () => {
    (instance as IDeferredPromiseInternal<T>)[DEFERRED_PROMISE_PRIVATE].resolve(Promise.race(values) as unknown as Promise<T>);
  });
}

export function DeferredPromiseAll<T>(instance: IDeferredPromise<T>, values: TNativePromiseLikeOrValue<any>[]): void {
  EnsuresDeferredPromiseIsPending<T>(instance, 'all', () => {
    (instance as IDeferredPromiseInternal<T>)[DEFERRED_PROMISE_PRIVATE].resolve(Promise.all(values) as unknown as Promise<T>);
  });
}


export function DeferredPromiseThen<T, TResult1 = T, TResult2 = never>(
  instance: IDeferredPromise<T>,
  onFulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
  onRejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
): IDeferredPromise<TResult1 | TResult2> {
  return new DeferredPromise<TResult1 | TResult2>((deferred: DeferredPromise<TResult1 | TResult2>) => {
    (instance as IDeferredPromiseInternal<T>)[DEFERRED_PROMISE_PRIVATE].promise
      .then((result: T) => {
        if (typeof onFulfilled === 'function') {
          DeferredPromiseTry<TResult1 | TResult2>(deferred, () => onFulfilled(result));
          // deferred.try(() => onFulfilled(result));
        } else {
          DeferredPromiseResolve<TResult1 | TResult2>(deferred, result as unknown as (TResult1 | TResult2));
          // deferred.resolve(result);
        }
      }, (reason: any) => {
        if (typeof onRejected === 'function') {
          DeferredPromiseTry<TResult1 | TResult2>(deferred, () => onRejected(reason));
          // deferred.try(() => onRejected(reason));
        } else {
          DeferredPromiseReject<TResult1 | TResult2>(deferred, reason);
          // deferred.reject(reason);
        }
      });
  });
}

export function DeferredPromiseCatch<T, TResult = never>(
  instance: IDeferredPromise<T>,
  onRejected?: ((reason: any) => TNativePromiseLikeOrValue<TResult>) | undefined | null
): IDeferredPromise<T | TResult> {
  return new DeferredPromise<T | TResult>((deferred: DeferredPromise<T | TResult>) => {
    (instance as IDeferredPromiseInternal<T>)[DEFERRED_PROMISE_PRIVATE].promise
      .then((result: T) => {
        DeferredPromiseResolve<T | TResult>(deferred, result);
        // deferred.resolve(result);
      }, (reason: any) => {
        if (typeof onRejected === 'function') {
          DeferredPromiseTry<T | TResult>(deferred, () => onRejected(reason));
          // deferred.try(() => onRejected(reason));
        } else {
          DeferredPromiseReject<T | TResult>(deferred, reason);
          // deferred.reject(reason);
        }
      });
  });
}


export function DeferredPromiseFinally<T>(
  instance: IDeferredPromise<T>,
  onFinally: (() => void) | undefined | null
): IDeferredPromise<T> {
  const _onFinally: () => void = (typeof onFinally === 'function') ? onFinally : noop;
  return new DeferredPromise<T>((deferred: DeferredPromise<T>) => {
    (instance as IDeferredPromiseInternal<T>)[DEFERRED_PROMISE_PRIVATE].promise
      .then((result: T) => {
        return new Promise<void>(resolve => resolve(_onFinally()))
          .then(
            () => {
              DeferredPromiseResolve<T>(deferred, result);
              return result;
            },
            (error: any) => {
              DeferredPromiseReject<T>(deferred, error);
              throw error;
            }
          );
      }, (reason: any) => {
        return new Promise<void>(resolve => resolve(_onFinally()))
          .then(
            () => {
              DeferredPromiseReject<T>(deferred, reason);
              throw reason;
            },
            (error: any) => {
              DeferredPromiseReject<T>(deferred, error);
              throw error;
            }
          );
      });
  });
}

export class DeferredPromiseCodes implements IDeferredPromiseCodes {
  static get FULFILLED(): 'fulfilled' {
    return 'fulfilled';
  }

  static get REJECTED(): 'rejected' {
    return 'rejected';
  }

  static get PENDING(): 'pending' {
    return 'pending';
  }

  static get RESOLVING(): 'resolving' {
    return 'resolving';
  }

  get FULFILLED(): 'fulfilled' {
    return 'fulfilled';
  }

  get REJECTED(): 'rejected' {
    return 'rejected';
  }

  get PENDING(): 'pending' {
    return 'pending';
  }

  get RESOLVING(): 'resolving' {
    return 'resolving';
  }
}

export class DeferredPromise<T> extends DeferredPromiseCodes implements IDeferredPromise<T> {

  static resolve(): DeferredPromise<void>;
  static resolve<T>(value: TNativePromiseLikeOrValue<T>): DeferredPromise<T>;
  static resolve<T>(value?: TNativePromiseLikeOrValue<T>): DeferredPromise<T | void> {
    return new DeferredPromise<T | void>().resolve(value);
  }

  static reject<T = never>(reason?: any): DeferredPromise<T> {
    return new DeferredPromise<T>().reject(reason);
  }

  static try<T>(callback: () => TNativePromiseLikeOrValue<T>): DeferredPromise<T> {
    return new DeferredPromise<T>().try(callback);
  }

  static race<TTuple extends TNativePromiseLikeOrValue<any>[]>(values: TTuple): DeferredPromise<TInferNativePromiseOrValueTupleToValueUnion<TTuple>> {
    return new DeferredPromise<TInferNativePromiseOrValueTupleToValueUnion<TTuple>>().race(values);
  }

  static all<TTuple extends TNativePromiseLikeOrValue<any>[]>(values: TTuple): Promise<TInferNativePromiseLikeOrValueTupleToValueTuple<TTuple>> {
    return new DeferredPromise<TInferNativePromiseLikeOrValueTupleToValueTuple<TTuple>>().all(values);
  }


  constructor(callback?: (deferred: IDeferredPromise<T>) => any) {
    super();
    ConstructDeferredPromise(this, callback);
  }

  get promise(): Promise<T> {
    return ((this as unknown) as IDeferredPromiseInternal<T>)[DEFERRED_PROMISE_PRIVATE].promise;
  }

  get status(): TPromiseStatus {
    return ((this as unknown) as IDeferredPromiseInternal<T>)[DEFERRED_PROMISE_PRIVATE].status;
  }

  get [Symbol.toStringTag](): string {
    return 'DeferredPromise';
  }


  resolve(value: TNativePromiseLikeOrValue<T>): this {
    DeferredPromiseResolve<T>(this, value);
    return this;
  }

  reject(reason?: any): this {
    DeferredPromiseReject<T>(this, reason);
    return this;
  }

  try(callback: () => TNativePromiseLikeOrValue<T>): this {
    DeferredPromiseTry<T>(this, callback);
    return this;
  }

  race<TTuple extends TNativePromiseLikeOrValue<any>[]>(values: TTuple): TDeferredPromiseRaceReturn<TTuple, T, this> {
    DeferredPromiseRace<T>(this, values);
    return this as TDeferredPromiseRaceReturn<TTuple, T, this>;
  }

  all<TTuple extends TNativePromiseLikeOrValue<any>[]>(values: TTuple): TDeferredPromiseAllReturn<TTuple, T, this> {
    DeferredPromiseAll<T>(this, values);
    return this as TDeferredPromiseAllReturn<TTuple, T, this>;
  }


  then<TResult1 = T, TResult2 = never>(
    onFulfilled?: ((value: T) => TNativePromiseLikeOrValue<TResult1>) | undefined | null,
    onRejected?: ((reason: any) => TNativePromiseLikeOrValue<TResult2>) | undefined | null
  ): IDeferredPromise<TResult1 | TResult2> {
    return DeferredPromiseThen<T, TResult1, TResult2>(this, onFulfilled, onRejected);
  }

  catch<TResult = never>(
    onRejected?: ((reason: any) => TNativePromiseLikeOrValue<TResult>) | undefined | null
  ): IDeferredPromise<T | TResult> {
    return DeferredPromiseCatch<T, TResult>(this, onRejected);
  }

  finally(onFinally?: (() => void) | undefined | null): IDeferredPromise<T> {
    return DeferredPromiseFinally<T>(this, onFinally);
  }
}

