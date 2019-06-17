import { IPromiseCancelToken, } from '../../notifications/observables/promise-observable/promise-cancel-token/interfaces';
import { PromiseCancelToken } from '../../notifications/observables/promise-observable/promise-cancel-token/implementation';
import { ICancellablePromise, TCancellablePromiseCreateCallback } from './interfaces';
import { ConstructClassWithPrivateMembers } from '../../misc/helpers/ClassWithPrivateMembers';
import { IsObject } from '../../helpers';
import { TPromiseOrValue, TPromiseOrValueTupleToValueTuple, TPromiseOrValueTupleToValueUnion } from '../interfaces';
import { Finally, IsPromiseLike } from '../helpers';


export const CANCELLABLE_PROMISE_PRIVATE = Symbol('cancellable-promise-private');

export interface ICancellablePromisePrivate<T> {
  promise: Promise<T>;
  token: IPromiseCancelToken;
}

export interface ICancellablePromiseInternal<T> extends ICancellablePromise<T> {
  [CANCELLABLE_PROMISE_PRIVATE]: ICancellablePromisePrivate<T>;
}


export function ConstructCancellablePromise<T>(
  instance: ICancellablePromise<T>,
  promiseOrCallback: Promise<T> | TCancellablePromiseCreateCallback<T>,
  token: IPromiseCancelToken = new PromiseCancelToken(),
): void {
  ConstructClassWithPrivateMembers(instance, CANCELLABLE_PROMISE_PRIVATE);
  const privates: ICancellablePromisePrivate<T> = (instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE];

  privates.token = token;


  if (typeof promiseOrCallback === 'function') {
    // ensures promiseOrCallback is called only if token is not cancelled
    privates.promise = privates.token.wrapFunction(() => {
      return new Promise<T>((resolve: (value?: TPromiseOrValue<T>) => void, reject: (reason?: any) => void) => {
        promiseOrCallback.call(instance, resolve, reject, privates.token);
      })
    }, 'never')() as Promise<T>;
  } else if (IsPromiseLike(promiseOrCallback)) {
    privates.promise = IsCancellablePromiseWithSameToken(promiseOrCallback, instance)
      ? promiseOrCallback
      : (privates.token.wrapPromise<T>(promiseOrCallback, 'never') as Promise<T>);
  } else {
    throw new TypeError(`Expected Promise or function as CancellablePromise first argument.`);
  }
}


export function IsCancellablePromise(value: any): value is ICancellablePromise<any> {
  return IsObject(value)
    && value.hasOwnProperty(CANCELLABLE_PROMISE_PRIVATE as symbol);
}

export function IsCancellablePromiseWithSameToken<T>(value: any, instance: ICancellablePromise<T>): boolean {
  return IsCancellablePromise(value)
    && (value.token === instance.token);
}


// export function CancellablePromiseToPromise<T>(
//   instance: ICancellablePromise<T>,
//   strategy?: TCancelStrategy
// ): Promise<T> {
//   return (instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].token.wrapPromise<Promise<T>>((instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].promise, strategy);
// }

export function CancellablePromiseFulfillInternal<T, TResult>(
  instance: ICancellablePromise<T>,
  onFulfilled: ((value: T, token: IPromiseCancelToken) => TPromiseOrValue<TResult>) | undefined | null,
): (value: T) => Promise<TResult> {
  return (instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].token.wrapFunction((value: T) => {
    if (typeof onFulfilled === 'function') {
      return onFulfilled.call(instance, value, (instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].token);
    } else {
      return value;
    }
  }, 'never');

  // if ((instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].token.cancelled) {
  //   return void 0;
  // } else if (typeof onFulfilled === 'function') {
  //   return onFulfilled.call(instance, value, (instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].token);
  // } else {
  //   return value;
  // }
}

export function CancellablePromiseCatchInternal<T, TResult>(
  instance: ICancellablePromise<T>,
  onRejected: ((reason: any, token: IPromiseCancelToken) => TPromiseOrValue<TResult>) | undefined | null,
): (reason: any) => Promise<TResult | never> {
  return (instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].token.wrapFunction((reason: any) => {
    if (typeof onRejected === 'function') {
      return onRejected.call(instance, reason, (instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].token);
    } else {
      throw reason;
    }
  }, 'never');
}


export function CancellablePromiseFinallyInternal<T>(
  instance: ICancellablePromise<T>,
  onFinally?: ((token: IPromiseCancelToken) => void) | undefined | null,
): () => Promise<void> {
  return (instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].token.wrapFunction(() => {
    if (typeof onFinally === 'function') {
      return onFinally.call(instance, (instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].token);
    }
  }, 'never');
}


// export function CancellablePromiseCancelledInternalOld<T>(
//   instance: ICancellablePromise<T>,
//   onCancelled?: ((token: IPromiseCancelToken) => TPromiseOrValue<void>) | undefined | null
// ): () => Promise<void> {
//   return () => {
//     return new Promise<void>((resolve: any) => {
//       if (((instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].token.cancelled) && (typeof onCancelled === 'function')){
//         resolve(onCancelled.call(instance, (instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].token));
//       } else {
//         resolve();
//       }
//     });
//   };
// }

export function CancellablePromiseCancelledInternal<T>(
  instance: ICancellablePromise<T>,
  onCancelled?: ((token: IPromiseCancelToken) => TPromiseOrValue<void>) | undefined | null
): Promise<T | void> {
  return (instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].token.wrapPromise(
    (instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].promise,
    'never',
    () => {
      if (typeof onCancelled === 'function') {
        return onCancelled.call(instance, (instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].token);
      }
    }
  );
}


export function CancellablePromiseThen<T, TResult1 = T, TResult2 = never>(
  instance: ICancellablePromise<T>,
  onFulfilled?: ((value: T, token: IPromiseCancelToken) => TPromiseOrValue<TResult1>) | undefined | null,
  onRejected?: ((reason: any, token: IPromiseCancelToken) => TPromiseOrValue<TResult2>) | undefined | null
): ICancellablePromise<TResult1 | TResult2> {
  return new CancellablePromise<TResult1 | TResult2>(
    (instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].promise
      .then(
        CancellablePromiseFulfillInternal<T, TResult1>(instance, onFulfilled),
        CancellablePromiseCatchInternal<T, TResult2>(instance, onRejected)
      ),
    (instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].token
  );
}

export function CancellablePromiseCatch<T, TResult = never>(
  instance: ICancellablePromise<T>,
  onRejected?: ((reason: any, token: IPromiseCancelToken) => TPromiseOrValue<TResult>) | undefined | null
): ICancellablePromise<T | TResult> {
  return new CancellablePromise<T | TResult>(
    (instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].promise
      .then<T, TResult>(
        void 0,
        CancellablePromiseCatchInternal<T, TResult>(instance, onRejected)
      ),
    (instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].token
  );
}


export function CancellablePromiseFinally<T>(
  instance: ICancellablePromise<T>,
  onFinally?: ((token: IPromiseCancelToken) => void) | undefined | null
): ICancellablePromise<T> {
  return new CancellablePromise<T>(
    (instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].promise
      .then.apply(
        (instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].promise,
        Finally<T>(CancellablePromiseFinallyInternal<T>(instance, onFinally))
      ) as Promise<T>,
    (instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].token
  );
}

export function CancellablePromiseCancelled<T>(
  instance: ICancellablePromise<T>,
  onCancelled: ((token: IPromiseCancelToken) => void) | undefined | null
): ICancellablePromise<T> {
  return new CancellablePromise<T>(
    CancellablePromiseCancelledInternal<T>(instance, onCancelled) as Promise<T>,
    (instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].token
  );
  // return new CancellablePromise<T>(
  //   (instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].promise
  //     .then.apply(
  //     (instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].promise,
  //     Finally<T>(CancellablePromiseCancelledInternal<T>(instance, onCancelled))
  //   ) as Promise<T>,
  //   (instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].token
  // );
}


export function CancellablePromiseFastThen<T, TResult1 = T, TResult2 = never>(
  instance: ICancellablePromise<T>,
  onFulfilled?: ((value: T, token: IPromiseCancelToken) => TPromiseOrValue<TResult1>) | undefined | null,
  onRejected?: ((reason: any, token: IPromiseCancelToken) => TResult2 | PromiseLike<TResult2>) | undefined | null
): ICancellablePromise<TResult1 | TResult2> {
  return IsCancellablePromiseWithSameToken((instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].promise, instance)
    ? ((instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].promise as ICancellablePromise<T>).then<TResult1, TResult2>(onFulfilled, onRejected)
    : CancellablePromiseThen<T, TResult1, TResult2>(instance, onFulfilled, onRejected);
}

export function CancellablePromiseFastCatch<T, TResult = never>(
  instance: ICancellablePromise<T>,
  onRejected?: ((reason: any, token: IPromiseCancelToken) => TPromiseOrValue<TResult>) | undefined | null
): ICancellablePromise<T | TResult> {
  return IsCancellablePromiseWithSameToken((instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].promise, instance)
    ? ((instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].promise as ICancellablePromise<T>).catch<TResult>(onRejected)
    : CancellablePromiseCatch<T, TResult>(instance, onRejected);
}

export function CancellablePromiseFastFinally<T>(
  instance: ICancellablePromise<T>,
  onFinally?: ((token: IPromiseCancelToken) => void) | undefined | null
): ICancellablePromise<T> {
  return IsCancellablePromiseWithSameToken((instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].promise, instance)
    ? ((instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].promise as ICancellablePromise<T>).finally(onFinally)
    : CancellablePromiseFinally<T>(instance, onFinally);
}

export function CancellablePromiseFastCancelled<T>(
  instance: ICancellablePromise<T>,
  onCancelled: ((token: IPromiseCancelToken) => void) | undefined | null
): ICancellablePromise<T> {
  return IsCancellablePromiseWithSameToken((instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].promise, instance)
    ? ((instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].promise as ICancellablePromise<T>).cancelled(onCancelled)
    : CancellablePromiseCancelled<T>(instance, onCancelled);
}


export function CancellablePromiseOf<T>(promiseOrCallback: Promise<T> | TCancellablePromiseCreateCallback<T>, token?: IPromiseCancelToken): ICancellablePromise<T> {
  return (
    IsCancellablePromise(promiseOrCallback)
    && (promiseOrCallback.token === token)
  )
    ? promiseOrCallback
    : new CancellablePromise<T>(promiseOrCallback, token);
}

export class CancellablePromise<T> implements ICancellablePromise<T> {

  static resolve(): CancellablePromise<void>;
  static resolve<T>(value: TPromiseOrValue<T>, token?: IPromiseCancelToken): ICancellablePromise<T>;
  static resolve<T>(value?: TPromiseOrValue<T>, token?: IPromiseCancelToken): ICancellablePromise<T | void> {
    return new CancellablePromise<T | void>(Promise.resolve<T | void>(value), token);
  }

  static reject<T = never>(reason?: any, token?: IPromiseCancelToken): ICancellablePromise<T> {
    return new CancellablePromise<T>(Promise.reject<T>(reason), token);
  }

  static try<T>(callback: (this: ICancellablePromise<T>, token: IPromiseCancelToken) => TPromiseOrValue<T>, token?: IPromiseCancelToken): ICancellablePromise<T> {
    return new CancellablePromise<T>(function (resolve: any, reject: any, token: IPromiseCancelToken) {
      resolve(callback.call(this, token));
    }, token);
  }

  static race<TTuple extends TPromiseOrValue<any>[]>(values: TTuple, token?: IPromiseCancelToken): ICancellablePromise<TPromiseOrValueTupleToValueUnion<TTuple>> {
    return new CancellablePromise<TPromiseOrValueTupleToValueUnion<TTuple>>(Promise.race(values), token);
  }

  static raceCallback<TTuple extends TPromiseOrValue<any>[]>(callback: (this: ICancellablePromise<TPromiseOrValueTupleToValueUnion<TTuple>>, token: IPromiseCancelToken) => TTuple, token?: IPromiseCancelToken): ICancellablePromise<TPromiseOrValueTupleToValueUnion<TTuple>> {
    return CancellablePromise.try<TPromiseOrValueTupleToValueUnion<TTuple>>(function (token: IPromiseCancelToken) {
      return Promise.race(callback.call(this, token) as TTuple);
    }, token);
  }

  static all<TTuple extends TPromiseOrValue<any>[]>(values: TTuple, token?: IPromiseCancelToken): ICancellablePromise<TPromiseOrValueTupleToValueTuple<TTuple>> {
    return new CancellablePromise<TPromiseOrValueTupleToValueTuple<TTuple>>(Promise.all(values) as any, token);
  }

  static allCallback<TTuple extends TPromiseOrValue<any>[]>(callback: (this: ICancellablePromise<TPromiseOrValueTupleToValueTuple<TTuple>>, token: IPromiseCancelToken) => TTuple, token?: IPromiseCancelToken): ICancellablePromise<TPromiseOrValueTupleToValueTuple<TTuple>> {
    return CancellablePromise.try<TPromiseOrValueTupleToValueTuple<TTuple>>(function (token: IPromiseCancelToken) {
      return Promise.all(callback.call(this, token) as TTuple) as unknown as TPromiseOrValueTupleToValueTuple<TTuple>;
    }, token);
  }

  static fetch(requestInfo: RequestInfo, requestInit?: RequestInit, token?: IPromiseCancelToken): ICancellablePromise<Response> {
    return new CancellablePromise<Response>((resolve: any, reject: any, token: IPromiseCancelToken) => {
      resolve(fetch(...token.wrapFetchArguments(requestInfo, requestInit)));
    }, token);
  }

  static of<T>(promiseOrCallback: Promise<T> | TCancellablePromiseCreateCallback<T>, token?: IPromiseCancelToken): ICancellablePromise<T> {
    return CancellablePromiseOf<T>(promiseOrCallback, token);
  }

  constructor(promiseOrCallback: Promise<T> | TCancellablePromiseCreateCallback<T>, token?: IPromiseCancelToken) {
    ConstructCancellablePromise(this, promiseOrCallback, token);
  }

  get promise(): Promise<T> {
    return ((this as unknown) as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].promise;
  }

  get token(): IPromiseCancelToken {
    return ((this as unknown) as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].token;
  }

  get [Symbol.toStringTag](): string {
    return 'CancellablePromise';
  }


  then<TResult1 = T, TResult2 = never>(
    onFulfilled?: ((this: this, value: T, token: IPromiseCancelToken) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onRejected?: ((this: this, reason: any, token: IPromiseCancelToken) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): ICancellablePromise<TResult1 | TResult2> {
    return CancellablePromiseFastThen<T, TResult1, TResult2>(this, onFulfilled, onRejected);
  }

  catch<TResult = never>(
    onRejected?: ((this: this, reason: any, token: IPromiseCancelToken) => TPromiseOrValue<TResult>) | undefined | null
  ): ICancellablePromise<T | TResult> {
    return CancellablePromiseFastCatch<T, TResult>(this, onRejected);
  }

  finally(onFinally?: ((this: this, token: IPromiseCancelToken) => void) | undefined | null): ICancellablePromise<T> {
    return CancellablePromiseFastFinally<T>(this, onFinally);
  }

  cancelled(onCancelled: ((this: this, token: IPromiseCancelToken) => void) | undefined | null): ICancellablePromise<T> {
    return CancellablePromiseFastCancelled<T>(this, onCancelled);
  }
}



