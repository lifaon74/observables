import { ICancelToken, TCancelStrategy, TCancelStrategyReturn, } from '../../misc/cancel-token/interfaces';
import { CancelToken, IsCancelToken } from '../../misc/cancel-token/implementation';
import {
  ICancellablePromise, ICancellablePromiseConstructor, PromiseCancelledObject, TCancellablePromiseAllCallback,
  TCancellablePromiseCancelledReturn,
  TCancellablePromiseCatchReturn, TCancellablePromiseCreateCallback, TCancellablePromiseFactory,
  TCancellablePromiseOnCancelledArgument, TCancellablePromiseOnFinallyArgument, TCancellablePromiseOnFulfilled,
  TCancellablePromiseOnFulfilledArgument, TCancellablePromiseOnRejected, TCancellablePromiseOnRejectedArgument,
  TCancellablePromiseRaceCallback,
  TCancellablePromiseThenReturn, TCancellablePromiseTryCallback
} from './interfaces';
import { ConstructClassWithPrivateMembers } from '../../misc/helpers/ClassWithPrivateMembers';
import { IsObject, TCastableToIteratorStrict, ToIterator } from '../../helpers';
import {
  PromiseFulfilledObject, PromiseRejectedObject, TPromise, TPromiseOrValue, TPromiseOrValueFactoryTupleToValueUnion,
  TPromiseOrValueTupleToValueTuple, TPromiseOrValueTupleToValueUnion
} from '../interfaces';
import { Finally, IsPromiseLikeBase, PromiseTry } from '../helpers';
import { Reason } from '../../misc/reason/implementation';
import { RunConcurrentPromises } from '../concurent-promises/helpers';


export const CANCELLABLE_PROMISE_PRIVATE = Symbol('cancellable-promise-private');

export interface ICancellablePromisePrivate<T, TStrategy extends TCancelStrategy> {
  promise: TPromise<T | TCancelStrategyReturn<TStrategy>>;
  token: ICancelToken;
  strategy: TStrategy;
  isCancellablePromiseWithSameToken: boolean;
}

export interface ICancellablePromiseInternal<T, TStrategy extends TCancelStrategy> extends ICancellablePromise<T, TStrategy> {
  [CANCELLABLE_PROMISE_PRIVATE]: ICancellablePromisePrivate<T, TStrategy>;
}


let CHECK_CANCELLABLE_PROMISE_CONSTRUCT: boolean = true;

export function NewCancellablePromise<T, TStrategy extends TCancelStrategy>(
  promise: TPromise<T>,
  token?: ICancelToken,
  strategy?: TStrategy,
  constructor: ICancellablePromiseConstructor = CancellablePromise
): ICancellablePromise<T, TStrategy> {
  CHECK_CANCELLABLE_PROMISE_CONSTRUCT = false;
  const instance: ICancellablePromise<T, TStrategy> = new constructor(promise, token, strategy);
  CHECK_CANCELLABLE_PROMISE_CONSTRUCT = true;
  return instance;
}

export function NewCancellablePromiseFromInstance<T, TStrategy extends TCancelStrategy, TPromiseValue>(
  instance: ICancellablePromise<T, TStrategy>,
  promise: TPromise<TPromiseValue>,
  token: ICancelToken = instance.token,
  strategy: TStrategy = (instance as ICancellablePromiseInternal<T, TStrategy>)[CANCELLABLE_PROMISE_PRIVATE].strategy,
): ICancellablePromise<TPromiseValue, TStrategy> {
  return NewCancellablePromise<TPromiseValue, TStrategy>(promise, token, strategy, instance.constructor as ICancellablePromiseConstructor);
}


export function ConstructCancellablePromise<T, TStrategy extends TCancelStrategy>(
  instance: ICancellablePromise<T, TStrategy>,
  promiseOrCallback: TPromise<T> | TCancellablePromiseCreateCallback<T, TStrategy>,
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
      privates.promise = privates.token.wrapFunction<() => TPromise<T>, TStrategy, never>(() => {
        return new Promise<T>((resolve: (value?: TPromiseOrValue<T>) => void, reject: (reason?: any) => void) => {
          promiseOrCallback.call(instance, resolve, reject, privates.token);
        });
      }, privates)();
    } else if (IsPromiseLikeBase(promiseOrCallback)) {
      privates.isCancellablePromiseWithSameToken = IsCancellablePromiseWithSameToken<T, TStrategy>(promiseOrCallback, instance);
      privates.promise = privates.isCancellablePromiseWithSameToken
        ? promiseOrCallback
        : privates.token.wrapPromise<T, TStrategy, never>(promiseOrCallback, privates);
    } else {
      throw new TypeError(`Expected Promise or function as CancellablePromise first argument.`);
    }
  } else {
    privates.token = token as ICancelToken;
    privates.strategy = strategy as TStrategy;
    privates.isCancellablePromiseWithSameToken = IsCancellablePromiseWithSameToken<T, TStrategy>(promiseOrCallback, instance);
    privates.promise = promiseOrCallback as Promise<T | TCancelStrategyReturn<TStrategy>>;
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

/*----------*/

export function CancellablePromiseInternalThen<T, TStrategy extends TCancelStrategy, TFulfilled extends TCancellablePromiseOnFulfilledArgument<T, TStrategy, any>, TRejected extends TCancellablePromiseOnRejectedArgument<T, TStrategy, any>, TCancelled extends TCancellablePromiseOnCancelledArgument<T, TStrategy, any>>(
  instance: ICancellablePromise<T, TStrategy>,
  onFulfilled: TFulfilled,
  onRejected: TRejected,
  onCancelled: TCancelled,
): TCancellablePromiseThenReturn<T, TStrategy, TFulfilled, TRejected, TCancelled> {
  const privates: ICancellablePromisePrivate<T, TStrategy> = (instance as ICancellablePromiseInternal<T, TStrategy>)[CANCELLABLE_PROMISE_PRIVATE];

  type TPromiseValue = T | never | TFulfilled | TRejected | TCancelled | TCancelStrategyReturn<TStrategy>;

  let newToken: ICancelToken;
  let promise: TPromise<TPromiseValue>;

  if (typeof onCancelled === 'function') {
    newToken = new CancelToken();
    promise = privates.token.wrapPromise<T, TStrategy, TCancelled>(
      privates.promise,
      {
        strategy: privates.strategy,
        onCancelled: (reason: any, newToken: ICancelToken) => {
          return onCancelled.call(instance, reason, newToken, privates.token);
        },
        onCancelledToken: newToken
      }
    );
  } else {
    newToken = privates.token;
    promise = privates.promise;
  }

  const onFulfilledDefined: boolean = (typeof onFulfilled === 'function');
  const onRejectedDefined: boolean = (typeof onRejected === 'function');

  if (onFulfilledDefined || onRejectedDefined) {
    promise = promise.then(
      onFulfilledDefined
        ? privates.token.wrapFunction<(value: T) => TPromiseOrValue<TFulfilled>, TStrategy, never>((value: T): TPromiseOrValue<TFulfilled> => {
          return (onFulfilled as TCancellablePromiseOnFulfilled<T, TStrategy, TFulfilled>).call(instance, value, privates.token);
        }, privates)
        : void 0,
      onRejectedDefined
        ? privates.token.wrapFunction<(value: T) => TPromiseOrValue<TRejected>, TStrategy, never>((reason: any) => {
          return (onRejected as TCancellablePromiseOnRejected<T, TStrategy, TRejected>).call(instance, reason, privates.token);
        }, privates)
        : void 0
    );
  }

  return NewCancellablePromiseFromInstance<T, TStrategy, TPromiseValue>(instance, promise, newToken) as TCancellablePromiseThenReturn<T, TStrategy, TFulfilled, TRejected, TCancelled>;
}

export function CancellablePromiseOptimizedThen<T, TStrategy extends TCancelStrategy, TFulfilled extends TCancellablePromiseOnFulfilledArgument<T, TStrategy, any>, TRejected extends TCancellablePromiseOnRejectedArgument<T, TStrategy, any>, TCancelled extends TCancellablePromiseOnCancelledArgument<T, TStrategy, any>>(
  instance: ICancellablePromise<T, TStrategy>,
  onFulfilled: TFulfilled,
  onRejected: TRejected,
  onCancelled: TCancelled,
): TCancellablePromiseThenReturn<T, TStrategy, TFulfilled, TRejected, TCancelled> {
  const privates: ICancellablePromisePrivate<T, TStrategy> = (instance as ICancellablePromiseInternal<T, TStrategy>)[CANCELLABLE_PROMISE_PRIVATE];
  return privates.isCancellablePromiseWithSameToken
    ? (privates.promise as ICancellablePromise<T, TStrategy>).then<TFulfilled, TRejected, TCancelled>(onFulfilled, onRejected, onCancelled)
    : CancellablePromiseInternalThen<T, TStrategy, TFulfilled, TRejected, TCancelled>(instance, onFulfilled, onRejected, onCancelled);
}


export function CancellablePromiseInternalFinally<T, TStrategy extends TCancelStrategy>(
  instance: ICancellablePromise<T, TStrategy>,
  onFinally: TCancellablePromiseOnFinallyArgument<T, TStrategy>,
  includeCancelled: boolean = false
): ICancellablePromise<T, TStrategy> {
  if (typeof onFinally === 'function') {
    const privates: ICancellablePromisePrivate<T, TStrategy> = (instance as ICancellablePromiseInternal<T, TStrategy>)[CANCELLABLE_PROMISE_PRIVATE];
    return CancellablePromiseThen<T, TStrategy, (value: T) => TPromise<T>, (reason: any) => TPromise<never>, ((reason: any, newToken: ICancelToken) => TPromise<never>) | undefined>(
      instance,
      (value: T) => {
        return PromiseTry<void>((): TPromise<void> => {
          return onFinally.call(instance, {
            status: 'fulfilled',
            value: value
          } as PromiseFulfilledObject<T>, privates.token);
        }).then(() => value);
      }, (reason: any): TPromise<never> => {
        return PromiseTry<void>(() => {
          return onFinally.call(instance, {
            status: 'rejected',
            reason: reason
          } as PromiseRejectedObject, privates.token);
        }).then(() => {
          throw reason;
        });
      }, includeCancelled
        ? (reason: any, newToken: ICancelToken): TPromise<never> => {
          return PromiseTry<void>(() => {
            return onFinally.call(instance, {
              status: 'cancelled',
              reason: reason
            } as PromiseCancelledObject, privates.token);
          }).then(() => {
            newToken.cancel(reason);
          });
        }
        : void 0
    ) as ICancellablePromise<T, TStrategy>;
  } else {
    return CancellablePromiseThen<T, TStrategy, undefined, undefined, undefined>(instance, void 0, void 0, void 0) as ICancellablePromise<T, TStrategy>;
  }
}

export function CancellablePromiseOptimizedFinally<T, TStrategy extends TCancelStrategy>(
  instance: ICancellablePromise<T, TStrategy>,
  onFinally: TCancellablePromiseOnFinallyArgument<T, TStrategy>,
  includeCancelled?: boolean
): ICancellablePromise<T, TStrategy> {
  const privates: ICancellablePromisePrivate<T, TStrategy> = (instance as ICancellablePromiseInternal<T, TStrategy>)[CANCELLABLE_PROMISE_PRIVATE];
  return privates.isCancellablePromiseWithSameToken
    ? (privates.promise as ICancellablePromise<T, TStrategy>).finally(onFinally, includeCancelled)
    : CancellablePromiseInternalFinally<T, TStrategy>(instance, onFinally, includeCancelled);
}

/*----------*/


export function CancellablePromiseThen<T, TStrategy extends TCancelStrategy, TFulfilled extends TCancellablePromiseOnFulfilledArgument<T, TStrategy, any>, TRejected extends TCancellablePromiseOnRejectedArgument<T, TStrategy, any>, TCancelled extends TCancellablePromiseOnCancelledArgument<T, TStrategy, any>>(
  instance: ICancellablePromise<T, TStrategy>,
  onFulfilled?: TFulfilled,
  onRejected?: TRejected,
  onCancelled?: TCancelled,
): TCancellablePromiseThenReturn<T, TStrategy, TFulfilled, TRejected, TCancelled> {
  return CancellablePromiseOptimizedThen<T, TStrategy, TFulfilled, TRejected, TCancelled>(instance, onFulfilled as TFulfilled, onRejected as TRejected, onCancelled as TCancelled);
}

export function CancellablePromiseCatch<T, TStrategy extends TCancelStrategy, TRejected extends TCancellablePromiseOnRejectedArgument<T, TStrategy, any>>(
  instance: ICancellablePromise<T, TStrategy>,
  onRejected?: TRejected,
): TCancellablePromiseCatchReturn<T, TStrategy, TRejected> {
  return CancellablePromiseThen<T, TStrategy, undefined, TRejected, undefined>(instance, void 0, onRejected as TRejected, void 0) as TCancellablePromiseCatchReturn<T, TStrategy, TRejected>;
}

export function CancellablePromiseCancelled<T, TStrategy extends TCancelStrategy, TCancelled extends TCancellablePromiseOnCancelledArgument<T, TStrategy, any>>(
  instance: ICancellablePromise<T, TStrategy>,
  onCancelled?: TCancelled
): TCancellablePromiseCancelledReturn<T, TStrategy, TCancelled> {
  return CancellablePromiseThen<T, TStrategy, undefined, undefined, TCancelled>(instance, void 0, void 0, onCancelled as TCancelled) as TCancellablePromiseCancelledReturn<T, TStrategy, TCancelled>;
}

export function CancellablePromiseFinally<T, TStrategy extends TCancelStrategy>(
  instance: ICancellablePromise<T, TStrategy>,
  onFinally?: TCancellablePromiseOnFinallyArgument<T, TStrategy>,
  includeCancelled?: boolean
): ICancellablePromise<T, TStrategy> {
  return CancellablePromiseOptimizedFinally<T, TStrategy>(instance, onFinally, includeCancelled);
}

/*------------------------------------------------*/

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
  callback: TCancellablePromiseTryCallback<T, TStrategy>,
  token?: ICancelToken,
  strategy?: TStrategy
): ICancellablePromise<T, TStrategy> {
  return new constructor(function (resolve: any, reject: any, token: ICancelToken) {
    resolve(callback.call(this, token));
  }, token, strategy);
}

export function CancellablePromiseRaceCallback<TTuple extends TPromiseOrValue<any>[], TStrategy extends TCancelStrategy>(
  constructor: ICancellablePromiseConstructor,
  callback: TCancellablePromiseRaceCallback<TTuple, TStrategy>,
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
  callback: TCancellablePromiseAllCallback<TTuple, TStrategy>,
  token?: ICancelToken,
  strategy?: TStrategy
): ICancellablePromise<TPromiseOrValueTupleToValueTuple<TTuple>, TStrategy> {
  return CancellablePromiseTry<TPromiseOrValueTupleToValueTuple<TTuple>, TStrategy>(constructor, function (token: ICancelToken) {
    return Promise.all(callback.call(this, token) as TTuple) as unknown as TPromiseOrValueTupleToValueTuple<TTuple>;
  }, token, strategy);
}



let globalConcurrentPromises: ICancellablePromise<void, TCancelStrategy>;

function CancellablePromiseConcurrentGlobalRun(
  run: () => ICancellablePromise<void, TCancelStrategy>,
  global: boolean = false,
): ICancellablePromise<void, TCancelStrategy> {
  if (global) {
    if ((globalConcurrentPromises === void 0) || globalConcurrentPromises.token.cancelled) {
      globalConcurrentPromises = run();
    } else {
      globalConcurrentPromises = globalConcurrentPromises
        .then(run, run, run);
    }
    return globalConcurrentPromises;
  } else {
    return run();
  }
}

export function CancellablePromiseConcurrent<T, TStrategy extends TCancelStrategy>(
  constructor: ICancellablePromiseConstructor,
  iterator: TCastableToIteratorStrict<TPromiseOrValue<T>>,
  concurrent?: number,
  global?: boolean,
  token?: ICancelToken,
  strategy?: TStrategy
): ICancellablePromise<void, TStrategy> {
  return CancellablePromiseConcurrentGlobalRun(
    () => CancellablePromiseConcurrentNonGlobal<T, TStrategy>(constructor, iterator, concurrent, token, strategy),
    global
  ) as ICancellablePromise<void, TStrategy>;
}

export function CancellablePromiseConcurrentNonGlobal<T, TStrategy extends TCancelStrategy>(
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

export function CancellablePromiseConcurrentFactories<T, TStrategy extends TCancelStrategy>(
  constructor: ICancellablePromiseConstructor,
  iterator: TCastableToIteratorStrict<TCancellablePromiseFactory<T>>,
  concurrent?: number,
  global: boolean = false,
  token?: ICancelToken,
  strategy?: TStrategy
): ICancellablePromise<void, TStrategy> {
  return CancellablePromiseConcurrentGlobalRun(
    () => CancellablePromiseConcurrentFactoriesNonGlobal<T, TStrategy>(constructor, iterator, concurrent, token, strategy),
    global
  ) as ICancellablePromise<void, TStrategy>;
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


export class CancellablePromise<T, TStrategy extends TCancelStrategy = 'never'> implements ICancellablePromise<T, TStrategy> {

  static resolve(): ICancellablePromise<void, 'never'>;
  static resolve<TStrategy extends TCancelStrategy>(): ICancellablePromise<void, TStrategy>;
  static resolve<T>(
    value: TPromiseOrValue<T>,
    token?: ICancelToken
  ): ICancellablePromise<T, 'never'>;
  static resolve<T, TStrategy extends TCancelStrategy>(
    value: TPromiseOrValue<T>,
    token: ICancelToken | undefined,
    strategy: TStrategy
  ): ICancellablePromise<T, TStrategy>;
  static resolve<T, TStrategy extends TCancelStrategy>(
    value?: TPromiseOrValue<T>,
    token?: ICancelToken,
    strategy?: TStrategy
  ): ICancellablePromise<T, TStrategy> {
    return new CancellablePromise<T, TStrategy>(Promise.resolve<T>(value as T), token, strategy);
  }

  static reject(): ICancellablePromise<never, 'never'>;
  static reject(
    reason: any,
    token?: ICancelToken
  ): ICancellablePromise<never, 'never'>;
  static reject<TStrategy extends TCancelStrategy>(
    reason: any,
    token: ICancelToken | undefined,
    strategy: TStrategy
  ): ICancellablePromise<never, TStrategy>;
  static reject<T, TStrategy extends TCancelStrategy>(
    reason?: any,
    token?: ICancelToken,
    strategy?: TStrategy
  ): ICancellablePromise<T, TStrategy> {
    return new CancellablePromise<T, TStrategy>(Promise.reject<T>(reason), token, strategy);
  }


  static try<T>(
    callback: TCancellablePromiseTryCallback<T, 'never'>,
    token?: ICancelToken
  ): ICancellablePromise<T, 'never'>;
  static try<T, TStrategy extends TCancelStrategy>(
    callback: TCancellablePromiseTryCallback<T, TStrategy>,
    token: ICancelToken | undefined,
    strategy: TStrategy
  ): ICancellablePromise<T, TStrategy>;
  static try<T, TStrategy extends TCancelStrategy>(
    callback: TCancellablePromiseTryCallback<T, TStrategy>,
    token?: ICancelToken,
    strategy?: TStrategy
  ): ICancellablePromise<T, TStrategy> {
    return CancellablePromiseTry<T, TStrategy>(this, callback, token, strategy);
  }


  static race<TTuple extends TPromiseOrValue<any>[]>(
    values: TTuple,
    token?: ICancelToken
  ): ICancellablePromise<TPromiseOrValueTupleToValueUnion<TTuple>, 'never'>;
  static race<TTuple extends TPromiseOrValue<any>[], TStrategy extends TCancelStrategy>(
    values: TTuple,
    token: ICancelToken | undefined,
    strategy: TStrategy
  ): ICancellablePromise<TPromiseOrValueTupleToValueUnion<TTuple>, TStrategy>;
  static race<TTuple extends TPromiseOrValue<any>[], TStrategy extends TCancelStrategy>(
    values: TTuple,
    token?: ICancelToken,
    strategy?: TStrategy
  ): ICancellablePromise<TPromiseOrValueTupleToValueUnion<TTuple>, TStrategy> {
    return new CancellablePromise<TPromiseOrValueTupleToValueUnion<TTuple>, TStrategy>(Promise.race(values), token, strategy);
  }


  static raceCallback<TTuple extends TPromiseOrValue<any>[]>(
    callback: TCancellablePromiseRaceCallback<TTuple, 'never'>,
    token?: ICancelToken,
  ): ICancellablePromise<TPromiseOrValueTupleToValueUnion<TTuple>, 'never'>
  static raceCallback<TTuple extends TPromiseOrValue<any>[], TStrategy extends TCancelStrategy>(
    callback: TCancellablePromiseRaceCallback<TTuple, TStrategy>,
    token: ICancelToken | undefined,
    strategy: TStrategy
  ): ICancellablePromise<TPromiseOrValueTupleToValueUnion<TTuple>, TStrategy>
  static raceCallback<TTuple extends TPromiseOrValue<any>[], TStrategy extends TCancelStrategy>(
    callback: TCancellablePromiseRaceCallback<TTuple, TStrategy>,
    token?: ICancelToken,
    strategy?: TStrategy
  ): ICancellablePromise<TPromiseOrValueTupleToValueUnion<TTuple>, TStrategy> {
    return CancellablePromiseRaceCallback<TTuple, TStrategy>(this, callback, token, strategy);
  }

  static raceCancellable<TTuple extends TCancellablePromiseFactory<any>[]>(
    factories: TTuple,
    token?: ICancelToken,
  ): ICancellablePromise<TPromiseOrValueFactoryTupleToValueUnion<TTuple>, 'never'>;
  static raceCancellable<TTuple extends TCancellablePromiseFactory<any>[], TStrategy extends TCancelStrategy>(
    factories: TTuple,
    token: ICancelToken | undefined,
    strategy: TStrategy
  ): ICancellablePromise<TPromiseOrValueFactoryTupleToValueUnion<TTuple>, TStrategy>;
  static raceCancellable<TTuple extends TCancellablePromiseFactory<any>[], TStrategy extends TCancelStrategy>(
    factories: TTuple,
    token?: ICancelToken,
    strategy?: TStrategy
  ): ICancellablePromise<TPromiseOrValueFactoryTupleToValueUnion<TTuple>, TStrategy> {
    return CancellablePromiseRaceCancellable<TTuple, TStrategy>(this, factories, token, strategy);
  }


  static all<TTuple extends TPromiseOrValue<any>[]>(
    values: TTuple,
    token?: ICancelToken,
  ): ICancellablePromise<TPromiseOrValueTupleToValueTuple<TTuple>, 'never'>;
  static all<TTuple extends TPromiseOrValue<any>[], TStrategy extends TCancelStrategy>(
    values: TTuple,
    token: ICancelToken | undefined,
    strategy: TStrategy
  ): ICancellablePromise<TPromiseOrValueTupleToValueTuple<TTuple>, TStrategy>;
  static all<TTuple extends TPromiseOrValue<any>[], TStrategy extends TCancelStrategy>(
    values: TTuple,
    token?: ICancelToken,
    strategy?: TStrategy
  ): ICancellablePromise<TPromiseOrValueTupleToValueTuple<TTuple>, TStrategy> {
    return new CancellablePromise<TPromiseOrValueTupleToValueTuple<TTuple>, TStrategy>(Promise.all(values) as any, token, strategy);
  }

  static allCallback<TTuple extends TPromiseOrValue<any>[]>(
    callback: TCancellablePromiseAllCallback<TTuple, 'never'>,
    token?: ICancelToken,
  ): ICancellablePromise<TPromiseOrValueTupleToValueTuple<TTuple>, 'never'>;
  static allCallback<TTuple extends TPromiseOrValue<any>[], TStrategy extends TCancelStrategy>(
    callback: TCancellablePromiseAllCallback<TTuple, TStrategy>,
    token: ICancelToken | undefined,
    strategy: TStrategy
  ): ICancellablePromise<TPromiseOrValueTupleToValueTuple<TTuple>, TStrategy>;
  static allCallback<TTuple extends TPromiseOrValue<any>[], TStrategy extends TCancelStrategy>(
    callback: TCancellablePromiseAllCallback<TTuple, TStrategy>,
    token?: ICancelToken,
    strategy?: TStrategy
  ): ICancellablePromise<TPromiseOrValueTupleToValueTuple<TTuple>, TStrategy> {
    return CancellablePromiseAllCallback<TTuple, TStrategy>(this, callback, token, strategy);
  }

  static concurrent<T>(
    iterator: TCastableToIteratorStrict<TPromiseOrValue<T>>,
    concurrent?: number,
    global?: boolean,
    token?: ICancelToken,
  ): ICancellablePromise<void, 'never'>;
  static concurrent<T, TStrategy extends TCancelStrategy>(
    iterator: TCastableToIteratorStrict<TPromiseOrValue<T>>,
    concurrent: number | undefined,
    global: boolean | undefined,
    token: ICancelToken | undefined,
    strategy: TStrategy
  ): ICancellablePromise<void, TStrategy>;
  static concurrent<T, TStrategy extends TCancelStrategy>(
    iterator: TCastableToIteratorStrict<TPromiseOrValue<T>>,
    concurrent?: number,
    global?: boolean,
    token?: ICancelToken,
    strategy?: TStrategy
  ): ICancellablePromise<void, TStrategy> {
    return CancellablePromiseConcurrent<T, TStrategy>(this, iterator, concurrent, global, token, strategy);
  }

  static concurrentFactories<T>(
    iterator: TCastableToIteratorStrict<TCancellablePromiseFactory<T>>,
    concurrent?: number,
    global?: boolean,
    token?: ICancelToken,
  ): ICancellablePromise<void, 'never'>;
  static concurrentFactories<T, TStrategy extends TCancelStrategy>(
    iterator: TCastableToIteratorStrict<TCancellablePromiseFactory<T>>,
    concurrent: number | undefined,
    global: boolean | undefined,
    token: ICancelToken | undefined,
    strategy: TStrategy
  ): ICancellablePromise<void, TStrategy>;
  static concurrentFactories<T, TStrategy extends TCancelStrategy>(
    iterator: TCastableToIteratorStrict<TCancellablePromiseFactory<T>>,
    concurrent?: number,
    global?: boolean,
    token?: ICancelToken,
    strategy?: TStrategy
  ): ICancellablePromise<void, TStrategy> {
    return CancellablePromiseConcurrentFactories<T, TStrategy>(this, iterator, concurrent, global, token, strategy);
  }

  static fetch(
    requestInfo: RequestInfo,
    requestInit?: RequestInit,
    token?: ICancelToken,
  ): ICancellablePromise<Response, 'never'>;
  static fetch<TStrategy extends TCancelStrategy>(
    requestInfo: RequestInfo,
    requestInit: RequestInit | undefined,
    token: ICancelToken | undefined,
    strategy: TStrategy
  ): ICancellablePromise<Response, TStrategy>;
  static fetch<TStrategy extends TCancelStrategy>(
    requestInfo: RequestInfo,
    requestInit?: RequestInit,
    token?: ICancelToken,
    strategy?: TStrategy
  ): ICancellablePromise<Response, TStrategy> {
    return CancellablePromiseFetch<TStrategy>(this, requestInfo, requestInit, token, strategy);
  }


  static of<T>(
    promiseOrCallback: Promise<T> | TCancellablePromiseCreateCallback<T, 'never'>,
    token?: ICancelToken,
  ): ICancellablePromise<T, 'never'>;
  static of<T, TStrategy extends TCancelStrategy>(
    promiseOrCallback: Promise<T> | TCancellablePromiseCreateCallback<T, TStrategy>,
    token: ICancelToken | undefined,
    strategy: TStrategy
  ): ICancellablePromise<T, TStrategy>;
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

  get promise(): Promise<T | TCancelStrategyReturn<TStrategy>> {
    return ((this as unknown) as ICancellablePromiseInternal<T, TStrategy>)[CANCELLABLE_PROMISE_PRIVATE].promise;
  }

  get token(): ICancelToken {
    return ((this as unknown) as ICancellablePromiseInternal<T, TStrategy>)[CANCELLABLE_PROMISE_PRIVATE].token;
  }

  get [Symbol.toStringTag](): string {
    return 'CancellablePromise';
  }


  then(): TCancellablePromiseThenReturn<T, TStrategy, undefined, undefined, undefined>;
  then<TFulfilled extends TCancellablePromiseOnFulfilledArgument<T, TStrategy, any>>(
    onFulfilled: TFulfilled,
  ): TCancellablePromiseThenReturn<T, TStrategy, TFulfilled, undefined, undefined>;
  then<TFulfilled extends TCancellablePromiseOnFulfilledArgument<T, TStrategy, any>, TRejected extends TCancellablePromiseOnRejectedArgument<T, TStrategy, any>>(
    onFulfilled: TFulfilled,
    onRejected: TRejected,
  ): TCancellablePromiseThenReturn<T, TStrategy, TFulfilled, TRejected, undefined>;
  then<TFulfilled extends TCancellablePromiseOnFulfilledArgument<T, TStrategy, any>, TRejected extends TCancellablePromiseOnRejectedArgument<T, TStrategy, any>, TCancelled extends TCancellablePromiseOnCancelledArgument<T, TStrategy, any>>(
    onFulfilled: TFulfilled,
    onRejected: TRejected,
    onCancelled: TCancelled,
  ): TCancellablePromiseThenReturn<T, TStrategy, TFulfilled, TRejected, TCancelled>;
  then<TFulfilled extends TCancellablePromiseOnFulfilledArgument<T, TStrategy, any>, TRejected extends TCancellablePromiseOnRejectedArgument<T, TStrategy, any>, TCancelled extends TCancellablePromiseOnCancelledArgument<T, TStrategy, any>>(
    onFulfilled?: TFulfilled,
    onRejected?: TRejected,
    onCancelled?: TCancelled,
  ): TCancellablePromiseThenReturn<T, TStrategy, TFulfilled, TRejected, TCancelled> {
    return CancellablePromiseThen<T, TStrategy, TFulfilled, TRejected, TCancelled>(this, onFulfilled, onRejected, onCancelled);
  }

  catch(): TCancellablePromiseCatchReturn<T, TStrategy, undefined>;
  catch<TRejected extends TCancellablePromiseOnRejectedArgument<T, TStrategy, any>>(onRejected: TRejected): TCancellablePromiseCatchReturn<T, TStrategy, TRejected>;
  catch<TRejected extends TCancellablePromiseOnRejectedArgument<T, TStrategy, any>>(onRejected?: TRejected): TCancellablePromiseCatchReturn<T, TStrategy, TRejected> {
    return CancellablePromiseCatch<T, TStrategy, TRejected>(this, onRejected);
  }

  cancelled(): TCancellablePromiseCancelledReturn<T, TStrategy, undefined>;
  cancelled<TCancelled extends TCancellablePromiseOnCancelledArgument<T, TStrategy, any>>(onCancelled: TCancelled): TCancellablePromiseCancelledReturn<T, TStrategy, TCancelled>;
  cancelled<TCancelled extends TCancellablePromiseOnCancelledArgument<T, TStrategy, any>>(onCancelled?: TCancelled): TCancellablePromiseCancelledReturn<T, TStrategy, TCancelled> {
    return CancellablePromiseCancelled<T, TStrategy, TCancelled>(this, onCancelled);
  }

  finally(onFinally?: TCancellablePromiseOnFinallyArgument<T, TStrategy>, includeCancelled?: boolean): ICancellablePromise<T, TStrategy> {
    return CancellablePromiseFinally<T, TStrategy>(this, onFinally, includeCancelled);
  }


}



