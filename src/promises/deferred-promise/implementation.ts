import { IDeferredPromise, TDeferredPromiseAllReturn, TDeferredPromiseRaceReturn, TPromiseStatus } from './interfaces';
import { ConstructClassWithPrivateMembers } from '../../misc/helpers/ClassWithPrivateMembers';
import { IsObject, noop } from '../../helpers';
import { TPromiseOrValue, TPromiseOrValueTupleToValueTuple, TPromiseOrValueTupleToValueUnion } from '../interfaces';


export const DEFERRED_PROMISE_PRIVATE = Symbol('deferred-promise-private');

export interface IDeferredPromisePrivate<T> {
  promise: Promise<T>;
  resolve: ((value?: TPromiseOrValue<T>) => void);
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

  privates.promise = new Promise<T>((resolve: (value?: TPromiseOrValue<T>) => void, reject: (reason?: any) => void) => {
    privates.resolve = (value: TPromiseOrValue<T>): void => {
      privates.status = 'resolving';
      resolve(value);
    };
    privates.reject = (reason?: any): void => {
      privates.status = 'resolving';
      reject(reason);
    };

    if (callback !== void 0) {
      callback.call(this, this);
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


export function DeferredPromiseResolve<T>(instance: IDeferredPromise<T>, value?: TPromiseOrValue<T>): void {
  if ((instance as IDeferredPromiseInternal<T>)[DEFERRED_PROMISE_PRIVATE].status === 'pending') {
    (instance as IDeferredPromiseInternal<T>)[DEFERRED_PROMISE_PRIVATE].resolve(value);
  } else {
    throw new Error(`Cannot call 'resolve' on a DeferredPromise in state '${(instance as IDeferredPromiseInternal<T>)[DEFERRED_PROMISE_PRIVATE].status}'`);
  }
}

export function DeferredPromiseReject<T>(instance: IDeferredPromise<T>, reason?: any): void {
  if ((instance as IDeferredPromiseInternal<T>)[DEFERRED_PROMISE_PRIVATE].status === 'pending') {
    (instance as IDeferredPromiseInternal<T>)[DEFERRED_PROMISE_PRIVATE].reject(reason);
  } else {
    throw new Error(`Cannot call 'reject' on a DeferredPromise in state '${(instance as IDeferredPromiseInternal<T>)[DEFERRED_PROMISE_PRIVATE].status}'`);
  }
}

export function DeferredPromiseTry<T>(instance: IDeferredPromise<T>, callback: () => TPromiseOrValue<T>): void {
  if (typeof callback !== 'function') {
    throw new TypeError(`Expected function as callback`);
  } else if ((instance as IDeferredPromiseInternal<T>)[DEFERRED_PROMISE_PRIVATE].status === 'pending') {
    (instance as IDeferredPromiseInternal<T>)[DEFERRED_PROMISE_PRIVATE].resolve(new Promise<T>((resolve: any) => {
      resolve(callback());
    }));
  } else {
    throw new Error(`Cannot call 'try' on a DeferredPromise in state '${(instance as IDeferredPromiseInternal<T>)[DEFERRED_PROMISE_PRIVATE].status}'`);
  }
}

export function DeferredPromiseRace<T>(instance: IDeferredPromise<T>, values: TPromiseOrValue<any>[]): void {
  if ((instance as IDeferredPromiseInternal<T>)[DEFERRED_PROMISE_PRIVATE].status === 'pending') {
    (instance as IDeferredPromiseInternal<T>)[DEFERRED_PROMISE_PRIVATE].resolve(Promise.race(values) as unknown as Promise<T>);
  } else {
    throw new Error(`Cannot call 'race' on a DeferredPromise in state '${(instance as IDeferredPromiseInternal<T>)[DEFERRED_PROMISE_PRIVATE].status}'`);
  }
}

export function DeferredPromiseAll<T>(instance: IDeferredPromise<T>, values: TPromiseOrValue<any>[]): void {
  if ((instance as IDeferredPromiseInternal<T>)[DEFERRED_PROMISE_PRIVATE].status === 'pending') {
    (instance as IDeferredPromiseInternal<T>)[DEFERRED_PROMISE_PRIVATE].resolve(Promise.all(values) as unknown as Promise<T>);
  } else {
    throw new Error(`Cannot call 'all' on a DeferredPromise in state '${(instance as IDeferredPromiseInternal<T>)[DEFERRED_PROMISE_PRIVATE].status}'`);
  }
}


export function DeferredPromiseThen<T, TResult1 = T, TResult2 = never>(
  instance: IDeferredPromise<T>,
  onFulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
  onRejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
): IDeferredPromise<TResult1 | TResult2> {
  return new DeferredPromise<TResult1 | TResult2>((deferred: DeferredPromise<TResult1 | TResult2>) => {
    (instance as IDeferredPromiseInternal<T>)[DEFERRED_PROMISE_PRIVATE].promise
      .then((result: T) => {
        DeferredPromiseTry<TResult1 | TResult2>(deferred, () => onFulfilled(result));
        // deferred.try(() => onFulfilled(result));
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
  onRejected?: ((reason: any) => TPromiseOrValue<TResult>) | undefined | null
): IDeferredPromise<T | TResult> {
  return new DeferredPromise<T | TResult>((deferred: DeferredPromise<T | TResult>) => {
    (instance as IDeferredPromiseInternal<T>)[DEFERRED_PROMISE_PRIVATE].promise
      .then((result: T) => {
        DeferredPromiseResolve<T | TResult>(deferred, result);
        // deferred.resolve(result);
      }, (reason: any) => {
        DeferredPromiseTry<T | TResult>(deferred, () => onRejected(reason));
        // deferred.try(() => onRejected(reason));
      });
  });
}


export function DeferredPromiseFinally<T>(
  instance: IDeferredPromise<T>,
  onFinally?: (() => void) | undefined | null
): IDeferredPromise<T> {
  if (typeof onFinally !== 'function') {
    onFinally = noop;
  }
  return new DeferredPromise<T>((deferred: DeferredPromise<T>) => {
    (instance as IDeferredPromiseInternal<T>)[DEFERRED_PROMISE_PRIVATE].promise
      .then((result: T) => {
        return new Promise<void>(resolve => resolve(onFinally()))
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
        return new Promise<void>(resolve => resolve(onFinally()))
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


export class DeferredPromise<T> implements IDeferredPromise<T> {

  static resolve(): DeferredPromise<void>;
  static resolve<T>(value: TPromiseOrValue<T>): DeferredPromise<T>;
  static resolve<T>(value?: TPromiseOrValue<T>): DeferredPromise<T> {
    return new DeferredPromise<T>().resolve(value);
  }

  static reject<T = never>(reason?: any): DeferredPromise<T> {
    return new DeferredPromise<T>().reject(reason);
  }

  static try<T>(callback: () => TPromiseOrValue<T>): DeferredPromise<T> {
    return new DeferredPromise<T>().try(callback);
  }

  static race<TTuple extends TPromiseOrValue<any>[]>(values: TTuple): DeferredPromise<TPromiseOrValueTupleToValueUnion<TTuple>> {
    return new DeferredPromise<TPromiseOrValueTupleToValueUnion<TTuple>>().race(values);
  }

  static all<TTuple extends TPromiseOrValue<any>[]>(values: TTuple): Promise<TPromiseOrValueTupleToValueTuple<TTuple>> {
    return new DeferredPromise<TPromiseOrValueTupleToValueTuple<TTuple>>().all(values);
  }


  constructor(callback?: (deferred: IDeferredPromise<T>) => any) {
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


  resolve(value: TPromiseOrValue<T>): this {
    DeferredPromiseResolve<T>(this, value);
    return this;
  }

  reject(reason?: any): this {
    DeferredPromiseReject<T>(this, reason);
    return this;
  }

  try(callback: () => TPromiseOrValue<T>): this {
    DeferredPromiseTry<T>(this, callback);
    return this;
  }

  race<TTuple extends TPromiseOrValue<any>[]>(values: TTuple): TDeferredPromiseRaceReturn<TTuple, T, this> {
    DeferredPromiseRace<T>(this, values);
    return this as TDeferredPromiseRaceReturn<TTuple, T, this>;
  }

  all<TTuple extends TPromiseOrValue<any>[]>(values: TTuple): TDeferredPromiseAllReturn<TTuple, T, this> {
    DeferredPromiseAll<T>(this, values);
    return this as TDeferredPromiseAllReturn<TTuple, T, this>;
  }


  then<TResult1 = T, TResult2 = never>(
    onFulfilled?: ((value: T) => TPromiseOrValue<TResult1>) | undefined | null,
    onRejected?: ((reason: any) => TPromiseOrValue<TResult2>) | undefined | null
  ): IDeferredPromise<TResult1 | TResult2> {
    return DeferredPromiseThen<T, TResult1, TResult2>(this, onFulfilled, onRejected);
  }

  catch<TResult = never>(
    onRejected?: ((reason: any) => TPromiseOrValue<TResult>) | undefined | null
  ): IDeferredPromise<T | TResult> {
    return DeferredPromiseCatch<T, TResult>(this, onRejected);
  }

  finally(onFinally?: (() => void) | undefined | null): IDeferredPromise<T> {
    return DeferredPromiseFinally<T>(this, onFinally);
  }
}


// export function testDeferredPromise() {
//   const a = new DeferredPromise();
//   a
//     .then((value: number) => {
//       console.log('1', value);
//       return value * 2;
//     })
//     .then((value: number) => {
//       console.log('2', value);
//     });
//
//   a.resolve(1);
// }
