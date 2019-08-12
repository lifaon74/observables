import { ICancelToken, TCancelStrategy, TCancelStrategyReturn, } from '../../misc/cancel-token/interfaces';
import { CancelToken, IsCancelToken } from '../../misc/cancel-token/implementation';
import {
  ICancellablePromise, ICancellablePromiseConstructor, TCancellablePromiseCreateCallback, TCancellablePromiseEndStatus,
  TCancellablePromiseFactory,
  TCancellablePromiseOnCancelled, TCancellablePromiseOnFinally, TCancellablePromiseOnFulfilled,
  TCancellablePromiseOnRejected
} from './interfaces';
import { ConstructClassWithPrivateMembers } from '../../misc/helpers/ClassWithPrivateMembers';
import { IsObject, TCastableToIteratorStrict, ToIterator } from '../../helpers';
import {
  TPromiseOrValue, TPromiseOrValueFactoryTupleToValueUnion, TPromiseOrValueTupleToValueTuple,
  TPromiseOrValueTupleToValueUnion
} from '../interfaces';
import { Finally, IsPromiseLikeBase, PromiseTry } from '../helpers';
import { Reason } from '../../misc/reason/implementation';
import { RunConcurrentPromises } from '../concurent-promises/helpers';


export const CANCELLABLE_PROMISE_PRIVATE = Symbol('cancellable-promise-private');

export interface ICancellablePromisePrivate<T, TStrategy extends TCancelStrategy> {
  promise: Promise<T>;
  token: ICancelToken;
  strategy: TStrategy;
  isCancellablePromiseWithSameToken: boolean;
}

export interface ICancellablePromiseInternal<T, TStrategy extends TCancelStrategy> extends ICancellablePromise<T, TStrategy> {
  [CANCELLABLE_PROMISE_PRIVATE]: ICancellablePromisePrivate<T, TStrategy>;
}


let CHECK_CANCELLABLE_PROMISE_CONSTRUCT: boolean = true;

export function NewCancellablePromise<T, TStrategy extends TCancelStrategy>(
  promise: Promise<T>,
  token?: ICancelToken,
  strategy?: TStrategy,
  constructor: ICancellablePromiseConstructor = CancellablePromise
): ICancellablePromise<T, TStrategy> {
  CHECK_CANCELLABLE_PROMISE_CONSTRUCT = false;
  const instance: ICancellablePromise<T, TStrategy> = new constructor(promise, token, strategy);
  CHECK_CANCELLABLE_PROMISE_CONSTRUCT = true;
  return instance;
}

export function NewCancellablePromiseFromInstance<T, TStrategy extends TCancelStrategy, TPromise>(
  instance: ICancellablePromise<T, TStrategy>,
  promise: Promise<TPromise>,
  token: ICancelToken = instance.token,
  strategy: TStrategy = (instance as ICancellablePromiseInternal<T, TStrategy>)[CANCELLABLE_PROMISE_PRIVATE].strategy,
): ICancellablePromise<TPromise, TStrategy> {
  return NewCancellablePromise<TPromise, TStrategy>(promise, token, strategy, instance.constructor as ICancellablePromiseConstructor);
}


export function ConstructCancellablePromise<T, TStrategy extends TCancelStrategy>(
  instance: ICancellablePromise<T, TStrategy>,
  promiseOrCallback: Promise<T> | TCancellablePromiseCreateCallback<T, TStrategy>,
  token?: ICancelToken,
  strategy?: TStrategy
): void {
  ConstructClassWithPrivateMembers(instance, CANCELLABLE_PROMISE_PRIVATE);
  const privates: ICancellablePromisePrivate<T, TStrategy> = (instance as ICancellablePromiseInternal<T, TStrategy>)[CANCELLABLE_PROMISE_PRIVATE];

  if (CHECK_CANCELLABLE_PROMISE_CONSTRUCT) {
    if (token === void 0) {
      privates.token = new CancelToken();
    } else if (IsCancelToken(token)) {
      privates.token = token;
    } else {
      throw new TypeError(`Expected CancelToken or void as CancellablePromise second argument.`);
    }

    if (strategy === void 0) {
      privates.strategy = 'never' as TStrategy;
    } else if (['resolve', 'reject', 'never'].includes(strategy)) {
      privates.strategy = strategy;
    } else {
      throw new TypeError(`Expected 'resolve', 'reject', 'never' or void as strategy`);
    }

    if (typeof promiseOrCallback === 'function') {
      privates.isCancellablePromiseWithSameToken = false;
      // ensures promiseOrCallback is called only if token is not cancelled
      privates.promise = privates.token.wrapFunction(() => {
        return new Promise<T>((resolve: (value?: TPromiseOrValue<T>) => void, reject: (reason?: any) => void) => {
          promiseOrCallback.call(instance, resolve, reject, privates.token);
        });
      }, privates)() as Promise<T>;
    } else if (IsPromiseLikeBase(promiseOrCallback)) {
      privates.isCancellablePromiseWithSameToken = IsCancellablePromiseWithSameToken(promiseOrCallback, instance);
      privates.promise = privates.isCancellablePromiseWithSameToken
        ? promiseOrCallback
        : (privates.token.wrapPromise<T, TStrategy, never>(promiseOrCallback, privates) as Promise<T>);
    } else {
      throw new TypeError(`Expected Promise or function as CancellablePromise first argument.`);
    }
  } else {
    privates.token = token as ICancelToken;
    privates.strategy = strategy as TStrategy;
    privates.isCancellablePromiseWithSameToken = IsCancellablePromiseWithSameToken(promiseOrCallback, instance);
    privates.promise = promiseOrCallback as Promise<T>;
  }
}


export function IsCancellablePromise(value: any): value is ICancellablePromise<any, any> {
  return IsObject(value)
    && value.hasOwnProperty(CANCELLABLE_PROMISE_PRIVATE as symbol);
}

export function IsCancellablePromiseWithSameToken<T, TStrategy extends TCancelStrategy>(value: any, instance: ICancellablePromise<T, TStrategy>): boolean {
  return IsCancellablePromise(value)
    && (value.token === instance.token);
}


export function CancellablePromiseFulfillInternal<T, TStrategy extends TCancelStrategy, TRejected>(
  instance: ICancellablePromise<T, TStrategy>,
  onFulfilled: TCancellablePromiseOnFulfilled<T, TStrategy, TRejected> | undefined | null,
): (value: T) => Promise<TRejected> {
  const privates: ICancellablePromisePrivate<T, TStrategy> = (instance as ICancellablePromiseInternal<T, TStrategy>)[CANCELLABLE_PROMISE_PRIVATE];
  return privates.token.wrapFunction((value: T) => {
    if (typeof onFulfilled === 'function') {
      return onFulfilled.call(instance, value, privates.token);
    } else {
      return value;
    }
  }, privates);
}

export function CancellablePromiseCatchInternal<T, TStrategy extends TCancelStrategy, TRejected>(
  instance: ICancellablePromise<T, TStrategy>,
  onRejected: TCancellablePromiseOnRejected<T, TStrategy, TRejected> | undefined | null,
): (reason: any) => Promise<TRejected | never> {
  const privates: ICancellablePromisePrivate<T, TStrategy> = (instance as ICancellablePromiseInternal<T, TStrategy>)[CANCELLABLE_PROMISE_PRIVATE];
  return privates.token.wrapFunction((reason: any) => {
    if (typeof onRejected === 'function') {
      return onRejected.call(instance, reason, privates.token);
    } else {
      throw reason;
    }
  }, privates);
}


// export function CancellablePromiseFinallyInternal<T, TStrategy extends TCancelStrategy>(
//   instance: ICancellablePromise<T, TStrategy>,
//   onFinally: TCancellablePromiseOnFinally<T, TStrategy> | undefined | null,
//   status: TCancellablePromiseEndStatus,
// ): () => Promise<void> {
//   const privates: ICancellablePromisePrivate<T, TStrategy> = (instance as ICancellablePromiseInternal<T, TStrategy>)[CANCELLABLE_PROMISE_PRIVATE];
//   return privates.token.wrapFunction(() => {
//     if (typeof onFinally === 'function') {
//       return onFinally.call(instance, status, privates.token);
//     }
//   }, privates);
// }

export function CancellablePromiseCancelledInternal<T, TStrategy extends TCancelStrategy, TCancelled>(
  instance: ICancellablePromise<T, TStrategy>,
  onCancelled?: TCancellablePromiseOnCancelled<T, TStrategy, TCancelled> | undefined | null
): Promise<T | TCancelled | TCancelStrategyReturn<TStrategy>> {
  const privates: ICancellablePromisePrivate<T, TStrategy> = (instance as ICancellablePromiseInternal<T, TStrategy>)[CANCELLABLE_PROMISE_PRIVATE];
  return privates.token.wrapPromise<T, TStrategy, never>( // not great because privates.promise is already wrapped
    privates.promise,
    {
      strategy: privates.strategy,
      onCancelled: (reason: any, rethrowCancelled: () => Promise<TCancelStrategyReturn<TStrategy>>) => {
        if (typeof onCancelled === 'function') {
          return onCancelled.call(instance, reason, privates.token, rethrowCancelled);
        } else {
          return rethrowCancelled();
        }
      }
    }
  );
}


export function CancellablePromiseThen<T, TStrategy extends TCancelStrategy, TFulfilled, TRejected, TCancelled>(
  instance: ICancellablePromise<T, TStrategy>,
  onFulfilled?: TCancellablePromiseOnFulfilled<T, TStrategy, TFulfilled> | undefined | null,
  onRejected?: TCancellablePromiseOnRejected<T, TStrategy, TRejected> | undefined | null,
  onCancelled?: TCancellablePromiseOnCancelled<T, TStrategy, TCancelled> | undefined | null,
): ICancellablePromise<TFulfilled | TRejected | TCancelled, TStrategy> {
  return NewCancellablePromiseFromInstance<T, TStrategy, TFulfilled | TRejected | TCancelled>(
    instance,
    (
      (typeof onCancelled === 'function')
        ? CancellablePromiseCancelledInternal<T, TStrategy, TCancelled>(instance, onCancelled)
        : (instance as ICancellablePromiseInternal<T, TStrategy>)[CANCELLABLE_PROMISE_PRIVATE].promise
    ).then(
      CancellablePromiseFulfillInternal<T, TStrategy, TFulfilled>(instance, onFulfilled),
      CancellablePromiseCatchInternal<T, TStrategy, TRejected>(instance, onRejected)
    ),
  );
}

export function CancellablePromiseCatch<T, TStrategy extends TCancelStrategy, TRejected>(
  instance: ICancellablePromise<T, TStrategy>,
  onRejected?: TCancellablePromiseOnRejected<T, TStrategy, TRejected> | undefined | null
): ICancellablePromise<T | TRejected, TStrategy> {
  return NewCancellablePromiseFromInstance<T, TStrategy, T | TRejected>(
    instance,
    (instance as ICancellablePromiseInternal<T, TStrategy>)[CANCELLABLE_PROMISE_PRIVATE].promise
      .then<T, TRejected>(
        void 0,
        CancellablePromiseCatchInternal<T, TStrategy, TRejected>(instance, onRejected)
      )
  );
}


export function CancellablePromiseFinally<T, TStrategy extends TCancelStrategy>(
  instance: ICancellablePromise<T, TStrategy>,
  onFinally?: TCancellablePromiseOnFinally<T, TStrategy> | undefined | null,
  includeCancelled?: boolean
): ICancellablePromise<T, TStrategy> {
  const privates: ICancellablePromisePrivate<T, TStrategy> = (instance as ICancellablePromiseInternal<T, TStrategy>)[CANCELLABLE_PROMISE_PRIVATE];
  let promise: Promise<T | TCancelStrategyReturn<TStrategy>>;

  if (typeof onFinally === 'function') {
    promise = includeCancelled
      ? CancellablePromiseCancelledInternal<T, TStrategy, TCancelStrategyReturn<TStrategy>>(instance, (reason: any, rethrowCancelled: () => Promise<TCancelStrategyReturn<TStrategy>>) => {
        return PromiseTry<void>(() => {
          return onFinally.call(instance, 'cancelled', privates.token);
        })
          .then<TCancelStrategyReturn<TStrategy>, never>(() => rethrowCancelled());
      })
      : privates.promise;

    promise = promise.then<T | TCancelStrategyReturn<TStrategy>, never | TCancelStrategyReturn<TStrategy>>(
      privates.token.wrapFunction<(value: T) => Promise<T>, TStrategy, never>((value: T) => {
        return PromiseTry<void>(() => {
          return onFinally.call(instance, 'fulfilled', privates.token);
        })
          .then<T, never>(() => value);
      }),
      privates.token.wrapFunction<(reason: any) => Promise<never>, TStrategy, never>((reason: any) => {
        return PromiseTry<void>(() => {
          return onFinally.call(instance, 'rejected', privates.token);
        })
          .then<never, never>(() => {
            throw reason;
          });
      })
    );
  } else {
    promise = privates.promise;
  }

  return NewCancellablePromiseFromInstance<T, TStrategy, T>(instance, promise as Promise<T>);
}

export function CancellablePromiseCancelled<T, TStrategy extends TCancelStrategy, TCancelled>(
  instance: ICancellablePromise<T, TStrategy>,
  onCancelled: TCancellablePromiseOnCancelled<T, TStrategy, TCancelled> | undefined | null
): ICancellablePromise<T | TCancelled, TStrategy> {
  return NewCancellablePromiseFromInstance<T, TStrategy, T | TCancelled>(
    instance,
    CancellablePromiseCancelledInternal<T, TStrategy, TCancelled>(instance, onCancelled) as Promise<T>,
  );
}

export function CancellablePromiseFastThen<T, TStrategy extends TCancelStrategy, TFulfilled, TRejected, TCancelled>(
  instance: ICancellablePromise<T, TStrategy>,
  onFulfilled?: TCancellablePromiseOnFulfilled<T, TStrategy, TFulfilled> | undefined | null,
  onRejected?: TCancellablePromiseOnRejected<T, TStrategy, TRejected> | undefined | null,
  onCancelled?: TCancellablePromiseOnCancelled<T, TStrategy, TCancelled> | undefined | null,
): ICancellablePromise<TFulfilled | TRejected | TCancelled, TStrategy> {
  const privates: ICancellablePromisePrivate<T, TStrategy> = (instance as ICancellablePromiseInternal<T, TStrategy>)[CANCELLABLE_PROMISE_PRIVATE];
  return privates.isCancellablePromiseWithSameToken
    ? (privates.promise as ICancellablePromise<T, TStrategy>).then<TFulfilled, TRejected, TCancelled>(onFulfilled, onRejected, onCancelled)
    : CancellablePromiseThen<T, TStrategy, TFulfilled, TRejected, TCancelled>(instance, onFulfilled, onRejected, onCancelled);
}

export function CancellablePromiseFastCatch<T, TStrategy extends TCancelStrategy, TRejected>(
  instance: ICancellablePromise<T, TStrategy>,
  onRejected?: TCancellablePromiseOnRejected<T, TStrategy, TRejected> | undefined | null
): ICancellablePromise<T | TRejected, TStrategy> {
  const privates: ICancellablePromisePrivate<T, TStrategy> = (instance as ICancellablePromiseInternal<T, TStrategy>)[CANCELLABLE_PROMISE_PRIVATE];
  return privates.isCancellablePromiseWithSameToken
    ? (privates.promise as ICancellablePromise<T, TStrategy>).catch<TRejected>(onRejected)
    : CancellablePromiseCatch<T, TStrategy, TRejected>(instance, onRejected);
}

export function CancellablePromiseFastFinally<T, TStrategy extends TCancelStrategy>(
  instance: ICancellablePromise<T, TStrategy>,
  onFinally?: TCancellablePromiseOnFinally<T, TStrategy> | undefined | null,
  includeCancelled?: boolean
): ICancellablePromise<T, TStrategy> {
  const privates: ICancellablePromisePrivate<T, TStrategy> = (instance as ICancellablePromiseInternal<T, TStrategy>)[CANCELLABLE_PROMISE_PRIVATE];
  return privates.isCancellablePromiseWithSameToken
    ? (privates.promise as ICancellablePromise<T, TStrategy>).finally(onFinally, includeCancelled)
    : CancellablePromiseFinally<T, TStrategy>(instance, onFinally, includeCancelled);
}

export function CancellablePromiseFastCancelled<T, TStrategy extends TCancelStrategy, TCancelled>(
  instance: ICancellablePromise<T, TStrategy>,
  onCancelled: TCancellablePromiseOnCancelled<T, TStrategy, TCancelled> | undefined | null
): ICancellablePromise<T | TCancelled, TStrategy> {
  const privates: ICancellablePromisePrivate<T, TStrategy> = (instance as ICancellablePromiseInternal<T, TStrategy>)[CANCELLABLE_PROMISE_PRIVATE];
  return privates.isCancellablePromiseWithSameToken
    ? (privates.promise as ICancellablePromise<T, TStrategy>).cancelled(onCancelled)
    : CancellablePromiseCancelled<T, TStrategy, TCancelled>(instance, onCancelled);
}


export function CancellablePromiseOf<T, TStrategy extends TCancelStrategy>(
  constructor: ICancellablePromiseConstructor,
  promiseOrCallback: Promise<T> | TCancellablePromiseCreateCallback<T, TStrategy>,
  token?: ICancelToken,
  strategy?: TStrategy
): ICancellablePromise<T, TStrategy> {
  return (
    IsCancellablePromise(promiseOrCallback)
    && ((token === void 0) || (promiseOrCallback.token === token))
  )
    ? promiseOrCallback
    : new constructor(promiseOrCallback, token, strategy);
}


export function CancellablePromiseTry<T, TStrategy extends TCancelStrategy>(
  constructor: ICancellablePromiseConstructor,
  callback: (this: ICancellablePromise<T, TStrategy>, token: ICancelToken) => TPromiseOrValue<T>,
  token?: ICancelToken,
  strategy?: TStrategy
): ICancellablePromise<T, TStrategy> {
  return new constructor(function (resolve: any, reject: any, token: ICancelToken) {
    resolve(callback.call(this, token));
  }, token, strategy);
}

export function CancellablePromiseRaceCallback<TTuple extends TPromiseOrValue<any>[], TStrategy extends TCancelStrategy>(
  constructor: ICancellablePromiseConstructor,
  callback: (this: ICancellablePromise<TPromiseOrValueTupleToValueUnion<TTuple>, TStrategy>, token: ICancelToken) => TTuple,
  token?: ICancelToken,
  strategy?: TStrategy
): ICancellablePromise<TPromiseOrValueTupleToValueUnion<TTuple>, TStrategy> {
  return CancellablePromiseTry<TPromiseOrValueTupleToValueUnion<TTuple>, TStrategy>(constructor, function (token: ICancelToken) {
    return Promise.race(callback.call(this, token) as TTuple);
  }, token, strategy);
}

export function CancellablePromiseRaceCancellable<TTuple extends TCancellablePromiseFactory<any>[], TStrategy extends TCancelStrategy>(
  constructor: ICancellablePromiseConstructor,
  factories: TTuple,
  token?: ICancelToken,
  strategy?: TStrategy
): ICancellablePromise<TPromiseOrValueFactoryTupleToValueUnion<TTuple>, TStrategy> {
  return CancellablePromiseTry<TPromiseOrValueFactoryTupleToValueUnion<TTuple>, TStrategy>(constructor, function (token: ICancelToken) {
    const sharedToken: ICancelToken = new CancelToken();
    return Promise.race<TPromiseOrValueFactoryTupleToValueUnion<TTuple>>(
      factories.map((factory: TCancellablePromiseFactory<any>) => {
          return CancellablePromiseTry<any, TStrategy>(constructor, factory, CancelToken.of(token, sharedToken), strategy);
        }
      )).then(...Finally<TPromiseOrValueFactoryTupleToValueUnion<TTuple>>(() => {
      sharedToken.cancel(new Reason(`One of the promises of raceCancellable is resolved`, 'RACE_CALLBACK_RESOLVED'));
    }));
  }, token, strategy);
}


export function CancellablePromiseAllCallback<TTuple extends TPromiseOrValue<any>[], TStrategy extends TCancelStrategy>(
  constructor: ICancellablePromiseConstructor,
  callback: (this: ICancellablePromise<TPromiseOrValueTupleToValueTuple<TTuple>, TStrategy>, token: ICancelToken) => TTuple,
  token?: ICancelToken,
  strategy?: TStrategy
): ICancellablePromise<TPromiseOrValueTupleToValueTuple<TTuple>, TStrategy> {
  return CancellablePromiseTry<TPromiseOrValueTupleToValueTuple<TTuple>, TStrategy>(constructor, function (token: ICancelToken) {
    return Promise.all(callback.call(this, token) as TTuple) as unknown as TPromiseOrValueTupleToValueTuple<TTuple>;
  }, token, strategy);
}


export function CancellablePromiseConcurrent<T, TStrategy extends TCancelStrategy>(
  constructor: ICancellablePromiseConstructor,
  iterator: TCastableToIteratorStrict<TPromiseOrValue<T>>,
  concurrent?: number,
  token?: ICancelToken,
  strategy?: TStrategy
): ICancellablePromise<void, TStrategy> {
  return CancellablePromiseTry<void, TStrategy>(constructor, function (token: ICancelToken) {
    return RunConcurrentPromises<T>(ToIterator<TPromiseOrValue<T>>(iterator), concurrent, token);
  }, token, strategy);
}

export function * CancellablePromiseFactoriesIteratorToPromiseIterable<T, TStrategy extends TCancelStrategy>(iterator: Iterator<TCancellablePromiseFactory<T>>, token: ICancelToken): IterableIterator<Promise<T>> {
  let result: IteratorResult<TCancellablePromiseFactory<T>>;
  while (!(result = iterator.next()).done) {
    yield PromiseTry<T>(() => result.value.call(null, token));
  }
}

let globalConcurrentPromises: ICancellablePromise<void, TCancelStrategy>;

export function CancellablePromiseConcurrentFactories<T, TStrategy extends TCancelStrategy>(
  constructor: ICancellablePromiseConstructor,
  iterator: TCastableToIteratorStrict<TCancellablePromiseFactory<T>>,
  concurrent?: number,
  global: boolean = false,
  token?: ICancelToken,
  strategy?: TStrategy
): ICancellablePromise<void, TStrategy> {
  const run = () => CancellablePromiseConcurrentFactoriesNonGlobal<T, TStrategy>(constructor, iterator, concurrent, token, strategy);
  if (global) {
    if ((globalConcurrentPromises === void 0) || globalConcurrentPromises.token.cancelled) {
      globalConcurrentPromises = run();
    } else {
      globalConcurrentPromises = globalConcurrentPromises
        .then(run, run, run);
    }
    return globalConcurrentPromises as ICancellablePromise<void, TStrategy>;
  } else {
    return run();
  }
}

export function CancellablePromiseConcurrentFactoriesNonGlobal<T, TStrategy extends TCancelStrategy>(
  constructor: ICancellablePromiseConstructor,
  iterator: TCastableToIteratorStrict<TCancellablePromiseFactory<T>>,
  concurrent?: number,
  token?: ICancelToken,
  strategy?: TStrategy
): ICancellablePromise<void, TStrategy> {
  return CancellablePromiseTry<void, TStrategy>(constructor, function (token: ICancelToken) {
    return RunConcurrentPromises<T>(
      CancellablePromiseFactoriesIteratorToPromiseIterable<T, TStrategy>(ToIterator<TCancellablePromiseFactory<T>>(iterator), token),
      concurrent,
      token
    );
  }, token, strategy);
}

export function CancellablePromiseFetch<TStrategy extends TCancelStrategy>(
  constructor: ICancellablePromiseConstructor,
  requestInfo: RequestInfo,
  requestInit?: RequestInit,
  token?: ICancelToken,
  strategy?: TStrategy
): ICancellablePromise<Response, TStrategy> {
  return new constructor<Response, TStrategy>((resolve: any, reject: any, token: ICancelToken) => {
    resolve(fetch(...token.wrapFetchArguments(requestInfo, requestInit)));
  }, token, strategy);
}


export class CancellablePromise<T, TStrategy extends TCancelStrategy> implements ICancellablePromise<T, TStrategy> {

  static resolve<TStrategy extends TCancelStrategy>(): ICancellablePromise<void, TStrategy>;
  static resolve<T, TStrategy extends TCancelStrategy>(value: TPromiseOrValue<T>, token?: ICancelToken, strategy?: TStrategy): ICancellablePromise<T, TStrategy>;
  static resolve<T, TStrategy extends TCancelStrategy>(value?: TPromiseOrValue<T>, token?: ICancelToken, strategy?: TStrategy): ICancellablePromise<T | void, TStrategy> {
    return new CancellablePromise<T | void, TStrategy>(Promise.resolve<T | void>(value), token, strategy);
  }

  static reject<T, TStrategy extends TCancelStrategy>(reason?: any, token?: ICancelToken, strategy?: TStrategy): ICancellablePromise<T, TStrategy> {
    return new CancellablePromise<T, TStrategy>(Promise.reject<T>(reason), token, strategy);
  }

  static try<T, TStrategy extends TCancelStrategy>(
    callback: (this: ICancellablePromise<T, TStrategy>, token: ICancelToken) => TPromiseOrValue<T>,
    token?: ICancelToken,
    strategy?: TStrategy
  ): ICancellablePromise<T, TStrategy> {
    return CancellablePromiseTry<T, TStrategy>(this, callback, token, strategy);
  }


  static race<TTuple extends TPromiseOrValue<any>[], TStrategy extends TCancelStrategy>(
    values: TTuple,
    token?: ICancelToken,
    strategy?: TStrategy
  ): ICancellablePromise<TPromiseOrValueTupleToValueUnion<TTuple>, TStrategy> {
    return new CancellablePromise<TPromiseOrValueTupleToValueUnion<TTuple>, TStrategy>(Promise.race(values), token, strategy);
  }

  static raceCallback<TTuple extends TPromiseOrValue<any>[], TStrategy extends TCancelStrategy>(
    callback: (this: ICancellablePromise<TPromiseOrValueTupleToValueUnion<TTuple>, TStrategy>, token: ICancelToken) => TTuple,
    token?: ICancelToken,
    strategy?: TStrategy
  ): ICancellablePromise<TPromiseOrValueTupleToValueUnion<TTuple>, TStrategy> {
    return CancellablePromiseRaceCallback<TTuple, TStrategy>(this, callback, token, strategy);
  }

  static raceCancellable<TTuple extends TCancellablePromiseFactory<any>[], TStrategy extends TCancelStrategy>(
    factories: TTuple,
    token?: ICancelToken,
    strategy?: TStrategy
  ): ICancellablePromise<TPromiseOrValueFactoryTupleToValueUnion<TTuple>, TStrategy> {
    return CancellablePromiseRaceCancellable<TTuple, TStrategy>(this, factories, token, strategy);
  }


  static all<TTuple extends TPromiseOrValue<any>[], TStrategy extends TCancelStrategy>(
    values: TTuple,
    token?: ICancelToken,
    strategy?: TStrategy
  ): ICancellablePromise<TPromiseOrValueTupleToValueTuple<TTuple>, TStrategy> {
    return new CancellablePromise<TPromiseOrValueTupleToValueTuple<TTuple>, TStrategy>(Promise.all(values) as any, token, strategy);
  }

  static allCallback<TTuple extends TPromiseOrValue<any>[], TStrategy extends TCancelStrategy>(
    callback: (this: ICancellablePromise<TPromiseOrValueTupleToValueTuple<TTuple>, TStrategy>, token: ICancelToken) => TTuple,
    token?: ICancelToken,
    strategy?: TStrategy
  ): ICancellablePromise<TPromiseOrValueTupleToValueTuple<TTuple>, TStrategy> {
    return CancellablePromiseAllCallback<TTuple, TStrategy>(this, callback, token, strategy);
  }

  static concurrent<T, TStrategy extends TCancelStrategy>(
    iterator: TCastableToIteratorStrict<TPromiseOrValue<T>>,
    concurrent?: number,
    token?: ICancelToken,
    strategy?: TStrategy
  ): ICancellablePromise<void, TStrategy> {
    return CancellablePromiseConcurrent<T, TStrategy>(this, iterator, concurrent, token, strategy);
  }

  static concurrentFactories<T, TStrategy extends TCancelStrategy>(
    iterator: TCastableToIteratorStrict<TCancellablePromiseFactory<T>>,
    concurrent?: number,
    global?: boolean,
    token?: ICancelToken,
    strategy?: TStrategy
  ): ICancellablePromise<void, TStrategy> {
    return CancellablePromiseConcurrentFactories<T, TStrategy>(this, iterator, concurrent, global, token, strategy);
  }

  static fetch<TStrategy extends TCancelStrategy>(
    requestInfo: RequestInfo,
    requestInit?: RequestInit,
    token?: ICancelToken,
    strategy?: TStrategy
  ): ICancellablePromise<Response, TStrategy> {
    return CancellablePromiseFetch<TStrategy>(this, requestInfo, requestInit, token, strategy);
  }

  static of<T, TStrategy extends TCancelStrategy>(
    promiseOrCallback: Promise<T> | TCancellablePromiseCreateCallback<T, TStrategy>,
    token?: ICancelToken,
    strategy?: TStrategy
  ): ICancellablePromise<T, TStrategy> {
    return CancellablePromiseOf<T, TStrategy>(this, promiseOrCallback, token, strategy);
  }

  constructor(promiseOrCallback: Promise<T> | TCancellablePromiseCreateCallback<T, TStrategy>, token?: ICancelToken, strategy?: TStrategy) {
    ConstructCancellablePromise<T, TStrategy>(this, promiseOrCallback, token, strategy);
  }

  get promise(): Promise<T> {
    return ((this as unknown) as ICancellablePromiseInternal<T, TStrategy>)[CANCELLABLE_PROMISE_PRIVATE].promise;
  }

  get token(): ICancelToken {
    return ((this as unknown) as ICancellablePromiseInternal<T, TStrategy>)[CANCELLABLE_PROMISE_PRIVATE].token;
  }

  get [Symbol.toStringTag](): string {
    return 'CancellablePromise';
  }


  then<TFulfilled = T, TRejected = never, TCancelled = never>(
    onFulfilled?: TCancellablePromiseOnFulfilled<T, TStrategy, TFulfilled> | undefined | null,
    onRejected?: TCancellablePromiseOnRejected<T, TStrategy, TRejected> | undefined | null,
    onCancelled?: TCancellablePromiseOnCancelled<T, TStrategy, TCancelled> | undefined | null,
  ): ICancellablePromise<TFulfilled | TRejected | TCancelled, TStrategy> {
    return CancellablePromiseFastThen<T, TStrategy, TFulfilled, TRejected, TCancelled>(this, onFulfilled, onRejected, onCancelled);
  }

  catch<TRejected = never>(
    onRejected?: TCancellablePromiseOnRejected<T, TStrategy, TRejected> | undefined | null
  ): ICancellablePromise<T | TRejected, TStrategy> {
    return CancellablePromiseFastCatch<T, TStrategy, TRejected>(this, onRejected);
  }

  cancelled<TCancelled>(onCancelled: TCancellablePromiseOnCancelled<T, TStrategy, TCancelled> | undefined | null): ICancellablePromise<T | TCancelled, TStrategy> {
    return CancellablePromiseFastCancelled<T, TStrategy, TCancelled>(this, onCancelled);
  }

  finally(onFinally?: TCancellablePromiseOnFinally<T, TStrategy> | undefined | null, includeCancelled?: boolean): ICancellablePromise<T, TStrategy> {
    return CancellablePromiseFastFinally<T, TStrategy>(this, onFinally, includeCancelled);
  }


}



