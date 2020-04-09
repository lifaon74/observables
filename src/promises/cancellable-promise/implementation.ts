import { ICancellablePromise, ICancellablePromiseConstructor } from './interfaces';
import { Reason } from '../../misc/reason/implementation';
import {
  ICancellablePromiseFinallyOptions, ICancellablePromiseNormalizedFinallyOptions, ICancellablePromiseOptions,
  ICancellablePromiseToPromiseOptions, IPromiseCancelledObject, TCancellablePromiseCancelledReturn,
  TCancellablePromiseCatchReturn, TCancellablePromiseFactory, TCancellablePromiseOnCancelledArgument,
  TCancellablePromiseOnFinallyArgument, TCancellablePromiseOnFulfilled, TCancellablePromiseOnFulfilledArgument,
  TCancellablePromiseOnRejected, TCancellablePromiseOnRejectedArgument, TCancellablePromisePromiseOrCallback,
  TCancellablePromiseThenReturn, TCancellablePromiseTryCallback, TInferCancellablePromiseStaticAllReturn,
  TInferCancellablePromiseStaticRaceReturn, TInferCancellablePromiseToPromiseReturn,
  TNativePromiseLikeOrValueTupleToCancellablePromiseTuple
} from './types';
import {
  CANCELLABLE_PROMISE_DEFAULT_ABORT_SIGNAL_WRAP_OPTIONS, CANCELLABLE_PROMISE_PRIVATE, ICancellablePromiseInternal,
  ICancellablePromisePrivate, TCancellablePromisePrivatePromiseType
} from './privates';
import { ConstructCancellablePromise, IsCancellablePromise, NewCancellablePromiseFromInstance } from './constructor';
import { TAbortStrategy } from '../../misc/advanced-abort-controller/advanced-abort-signal/types';
import { IAdvancedAbortSignal } from '../../misc/advanced-abort-controller/advanced-abort-signal/interfaces';

import { AdvancedAbortController } from '../../misc/advanced-abort-controller/implementation';
import { IAdvancedAbortController } from '../../misc/advanced-abort-controller/interfaces';
import { PromiseFinally, PromiseTry } from '../types/helpers';
import { NormalizeICancellablePromiseFinallyOptions } from './functions';
import { IsObject } from '../../helpers';
import {
  INativePromiseFulfilledObject, INativePromiseRejectedObject, TInferNativePromiseLikeOrValueFactoryTupleToValueTuple,
  TInferNativePromiseLikeType, TInferNativePromiseOrValueFactoryTupleToUnionOfValues, TNativePromiseLikeOrValue
} from '../types/native';


/** INTERNAL FUNCTIONS **/

function CancellablePromiseInternalThen<T, TFulfilled extends TCancellablePromiseOnFulfilledArgument<T, any>, TRejected extends TCancellablePromiseOnRejectedArgument<T, any>, TCancelled extends TCancellablePromiseOnCancelledArgument<T, any>>(
  instance: ICancellablePromise<T>,
  onFulfilled: TFulfilled,
  onRejected: TRejected,
  onCancelled: TCancelled,
): TCancellablePromiseThenReturn<T, TFulfilled, TRejected, TCancelled> {
  const privates: ICancellablePromisePrivate<T> = (instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE];

  type TPrivatePromiseInValue = TCancellablePromisePrivatePromiseType<T>;
  type TPrivatePromiseOutValue = never | TFulfilled | TRejected | TPrivatePromiseInValue;
  type TPromiseValue = TCancelled | TPrivatePromiseOutValue;

  const _onFulfilled = (typeof onFulfilled === 'function')
    ? privates.signal.wrapFunction<(value: TPrivatePromiseInValue) => TNativePromiseLikeOrValue<TFulfilled>>((value: TPrivatePromiseInValue): TNativePromiseLikeOrValue<TFulfilled> => {
      return (onFulfilled as TCancellablePromiseOnFulfilled<T, TFulfilled>).call(instance, value, privates.signal) as any;
    }, CANCELLABLE_PROMISE_DEFAULT_ABORT_SIGNAL_WRAP_OPTIONS)
    : void 0;

  const _onRejected = (typeof onRejected === 'function')
    ? privates.signal.wrapFunction<(value: T) => TNativePromiseLikeOrValue<TRejected>>((reason: any) => {
      return (onRejected as TCancellablePromiseOnRejected<T, TRejected>).call(instance, reason, privates.signal);
    }, CANCELLABLE_PROMISE_DEFAULT_ABORT_SIGNAL_WRAP_OPTIONS)
    : void 0;

  const fulfilledAndRejectedHandledPromise: PromiseLike<TPrivatePromiseOutValue> = (
    ((_onFulfilled === void 0) && (_onFulfilled === void 0))
      ? privates.promise
      : privates.promise.then(_onFulfilled, _onRejected)
  ) as PromiseLike<TPrivatePromiseOutValue>;

  let newSignal: IAdvancedAbortSignal;
  let cancelHandledPromise: Promise<TPromiseValue>;

  if (typeof onCancelled === 'function') {
    const abortController: IAdvancedAbortController = new AdvancedAbortController();
    newSignal = abortController.signal;
    cancelHandledPromise = privates.signal.wrapPromise<TPromiseValue, 'never', TCancelled>(
      fulfilledAndRejectedHandledPromise,
      {
        ...CANCELLABLE_PROMISE_DEFAULT_ABORT_SIGNAL_WRAP_OPTIONS,
        onAborted: (reason: any, newController: IAdvancedAbortController) => {
          return onCancelled.call(instance, reason, newController, privates.signal);
        },
        onAbortedController: abortController
      }
    );
  } else {
    newSignal = privates.signal;
    cancelHandledPromise = fulfilledAndRejectedHandledPromise as Promise<TPromiseValue>;
  }

  return NewCancellablePromiseFromInstance<T, TPromiseValue>(
    instance,
    cancelHandledPromise,
    {
      signal: newSignal
    }) as TCancellablePromiseThenReturn<T, TFulfilled, TRejected, TCancelled>;
}

function CancellablePromiseOptimizedThen<T, TFulfilled extends TCancellablePromiseOnFulfilledArgument<T, any>, TRejected extends TCancellablePromiseOnRejectedArgument<T, any>, TCancelled extends TCancellablePromiseOnCancelledArgument<T, any>>(
  instance: ICancellablePromise<T>,
  onFulfilled: TFulfilled,
  onRejected: TRejected,
  onCancelled: TCancelled,
): TCancellablePromiseThenReturn<T, TFulfilled, TRejected, TCancelled> {
  const privates: ICancellablePromisePrivate<T> = (instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE];
  return privates.isCancellablePromiseWithSameSignal
    ? (privates.promise as ICancellablePromise<T>).then<TFulfilled, TRejected, TCancelled>(onFulfilled, onRejected, onCancelled)
    : CancellablePromiseInternalThen<T, TFulfilled, TRejected, TCancelled>(instance, onFulfilled, onRejected, onCancelled);
}


function CancellablePromiseInternalFinally<T>(
  instance: ICancellablePromise<T>,
  onFinally: TCancellablePromiseOnFinallyArgument<T>,
  options?: ICancellablePromiseFinallyOptions
): ICancellablePromise<T> {
  if (typeof onFinally === 'function') {
    const _options: ICancellablePromiseNormalizedFinallyOptions = NormalizeICancellablePromiseFinallyOptions(options);

    const privates: ICancellablePromisePrivate<T> = (instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE];
    return CancellablePromiseThen<T, (value: T) => Promise<T>, (reason: any) => Promise<never>, ((reason: any, newController: IAdvancedAbortController) => Promise<never>) | undefined>(
      instance,
      (value: T) => {
        return PromiseTry<void>((): Promise<void> => {
          return onFinally.call(instance, {
            status: 'fulfilled',
            value: value
          } as INativePromiseFulfilledObject<T>, privates.signal);
        }).then(() => value);
      }, (reason: any): Promise<never> => {
        return PromiseTry<void>(() => {
          return onFinally.call(instance, {
            status: 'rejected',
            reason: reason
          } as INativePromiseRejectedObject, privates.signal);
        }).then(() => {
          throw reason;
        });
      }, _options.includeCancelled
        ? (reason: any, newController: IAdvancedAbortController): Promise<never> => {
          return PromiseTry<void>(() => {
            return onFinally.call(instance, {
              status: 'cancelled',
              reason: reason
            } as IPromiseCancelledObject, privates.signal);
          }).then(() => {
            newController.abort(reason);
            throw new Error(`Cancelled`);
          });
        }
        : void 0
    ) as ICancellablePromise<T>;
  } else {
    return CancellablePromiseThen<T, undefined, undefined, undefined>(instance, void 0, void 0, void 0) as ICancellablePromise<T>;
  }
}

function CancellablePromiseOptimizedFinally<T>(
  instance: ICancellablePromise<T>,
  onFinally: TCancellablePromiseOnFinallyArgument<T>,
  options?: ICancellablePromiseFinallyOptions,
): ICancellablePromise<T> {
  const privates: ICancellablePromisePrivate<T> = (instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE];
  return privates.isCancellablePromiseWithSameSignal
    ? (privates.promise as ICancellablePromise<T>).finally(onFinally, options)
    : CancellablePromiseInternalFinally<T>(instance, onFinally, options);
}

/**
 * Runs 'factories' in parallel, and wraps each of them with a CancellablePromise
 */
function CancellablePromiseRunFactories<TTuple extends TCancellablePromiseFactory<any>[]>(
  constructor: ICancellablePromiseConstructor,
  factories: TTuple,
  options?: ICancellablePromiseOptions
): TNativePromiseLikeOrValueTupleToCancellablePromiseTuple<TTuple> {
  return factories.map((factory: TCancellablePromiseFactory<any>) => {
    return CancellablePromiseTry<TInferNativePromiseOrValueFactoryTupleToUnionOfValues<TTuple>>(constructor, factory, options);
  }) as TNativePromiseLikeOrValueTupleToCancellablePromiseTuple<TTuple>;
}

/**
 * Aborts 'controller' as soon as 'promise' is resolved (fulfilled or rejected)
 */
function AbortControllerWhenPromiseResolved<TPromise extends Promise<any>>(
  promise: TPromise,
  controller: IAdvancedAbortController,
  getReason: () => any
): TPromise {
  return promise
    .then(
      ...PromiseFinally<TInferNativePromiseLikeType<TPromise>>(() => {
        if (!controller.signal.aborted) {
          controller.abort(getReason());
        }
      })
    ) as TPromise;
}


/*------------------------------------------------------------------------------------------------------------------------*/


/** METHODS **/

/* GETTERS/SETTERS */

export function CancellablePromiseGetSignal<T>(instance: ICancellablePromise<T>): IAdvancedAbortSignal {
  return (instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].signal;
}

/* METHODS */

export function CancellablePromiseThen<T, TFulfilled extends TCancellablePromiseOnFulfilledArgument<T, any>, TRejected extends TCancellablePromiseOnRejectedArgument<T, any>, TCancelled extends TCancellablePromiseOnCancelledArgument<T, any>>(
  instance: ICancellablePromise<T>,
  onFulfilled?: TFulfilled,
  onRejected?: TRejected,
  onCancelled?: TCancelled,
): TCancellablePromiseThenReturn<T, TFulfilled, TRejected, TCancelled> {
  return CancellablePromiseOptimizedThen<T, TFulfilled, TRejected, TCancelled>(instance, onFulfilled as TFulfilled, onRejected as TRejected, onCancelled as TCancelled);
}

export function CancellablePromiseCatch<T, TRejected extends TCancellablePromiseOnRejectedArgument<T, any>>(
  instance: ICancellablePromise<T>,
  onRejected?: TRejected,
): TCancellablePromiseCatchReturn<T, TRejected> {
  return CancellablePromiseThen<T, undefined, TRejected, undefined>(instance, void 0, onRejected as TRejected, void 0) as TCancellablePromiseCatchReturn<T, TRejected>;
}

export function CancellablePromiseCancelled<T, TCancelled extends TCancellablePromiseOnCancelledArgument<T, any>>(
  instance: ICancellablePromise<T>,
  onCancelled?: TCancelled
): TCancellablePromiseCancelledReturn<T, TCancelled> {
  return CancellablePromiseThen<T, undefined, undefined, TCancelled>(instance, void 0, void 0, onCancelled as TCancelled) as TCancellablePromiseCancelledReturn<T, TCancelled>;
}

export function CancellablePromiseFinally<T>(
  instance: ICancellablePromise<T>,
  onFinally?: TCancellablePromiseOnFinallyArgument<T>,
  options?: ICancellablePromiseFinallyOptions,
): ICancellablePromise<T> {
  return CancellablePromiseOptimizedFinally<T>(instance, onFinally, options);
}

export function CancellablePromiseToPromise<T, TStrategy extends TAbortStrategy>(
  instance: ICancellablePromise<T>,
  options?: ICancellablePromiseToPromiseOptions<TStrategy>
): TInferCancellablePromiseToPromiseReturn<T, TStrategy> {
  const privates: ICancellablePromisePrivate<T> = (instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE];
  return ((options === void 0) || (options.strategy === 'never'))
    ? privates.promise as TInferCancellablePromiseToPromiseReturn<T, TStrategy>
    : privates.signal.wrapPromise<T, TStrategy, never>(privates.promise, options);
}

/* STATIC METHODS */

/**
 * Creates and returns a new CancellablePromise if 'promiseOrCallback' is not a CancellablePromise with the same signal,
 * else returns 'promiseOrCallback'
 */
export function CancellablePromiseOf<T>(
  constructor: ICancellablePromiseConstructor,
  promiseOrCallback: TCancellablePromisePromiseOrCallback<T>,
  options?: ICancellablePromiseOptions
): ICancellablePromise<T> {
  return (
    IsCancellablePromise(promiseOrCallback)
    && IsObject(options)
    && (promiseOrCallback.signal === options.signal)
  )
    ? promiseOrCallback
    : new constructor(promiseOrCallback, options);
}


/**
 * Returns a new CancellablePromise resolved with 'value'
 */
export function CancellablePromiseResolve<T>(
  constructor: ICancellablePromiseConstructor,
  value: TNativePromiseLikeOrValue<T>,
  options?: ICancellablePromiseOptions
): ICancellablePromise<T> {
  return new CancellablePromise<T>(Promise.resolve<T>(value), options);
}

/**
 * Returns a new CancellablePromise rejected with 'reason'
 */
export function CancellablePromiseReject<T>(
  constructor: ICancellablePromiseConstructor,
  reason: any,
  options?: ICancellablePromiseOptions
): ICancellablePromise<T> {
  return new CancellablePromise<T>(Promise.reject<T>(reason), options);
}


/**
 * Returns a new CancellablePromise resolved with the value returned by the execution of 'callback' (rejects if throws)
 */
export function CancellablePromiseTry<T>(
  constructor: ICancellablePromiseConstructor,
  callback: TCancellablePromiseTryCallback<T>,
  options?: ICancellablePromiseOptions
): ICancellablePromise<T> {
  return new constructor<T>(function (resolve: any, reject: any, signal: IAdvancedAbortSignal) {
    resolve(callback.call(this, signal));
  }, options);
}

/**
 * Returns a new CancellablePromise resolved when ONE of the parallel executions for each 'factories' resolves (fulfilled or rejected).
 *  - every factory receives a shared <signal>.
 *    - this <signal> is aborted if 'signal' is aborted, OR when the returned CancellablePromise is resolved (fulfilled or rejected)
 */
export function CancellablePromiseRace<TTuple extends TCancellablePromiseFactory<any>[]>(
  constructor: ICancellablePromiseConstructor,
  factories: TTuple,
  options?: ICancellablePromiseOptions
): TInferCancellablePromiseStaticRaceReturn<TTuple> {
  type TReturnedValue = TInferNativePromiseOrValueFactoryTupleToUnionOfValues<TTuple>;

  return CancellablePromiseTry<TReturnedValue>(constructor, (signal: IAdvancedAbortSignal) => {
    const controller: IAdvancedAbortController = AdvancedAbortController.fromAbortSignals(signal);
    return AbortControllerWhenPromiseResolved(
      Promise.race<TReturnedValue>(
        CancellablePromiseRunFactories<TTuple>(constructor, factories, {
          signal: controller.signal
        })
      ),
      controller,
      () => new Reason(`One of the racing promises is resolved`, 'RACE_CALLBACK_RESOLVED'),
    );
  }, options);
}


/**
 * Returns a new CancellablePromise resolved when ALL of the parallel executions for each 'factories' fulfill or ONE is rejected.
 *  - every factory receives a shared <signal>.
 *  - this <signal> is aborted if 'signal' is aborted, OR when the returned CancellablePromise is rejected
 */
export function CancellablePromiseAll<TTuple extends TCancellablePromiseFactory<any>[]>(
  constructor: ICancellablePromiseConstructor,
  factories: TTuple,
  options?: ICancellablePromiseOptions
): TInferCancellablePromiseStaticAllReturn<TTuple> {
  type TReturnedValue = TInferNativePromiseLikeOrValueFactoryTupleToValueTuple<TTuple>;

  return CancellablePromiseTry<TReturnedValue>(constructor, function (signal: IAdvancedAbortSignal) {
    const controller: IAdvancedAbortController = AdvancedAbortController.fromAbortSignals(signal);
    return AbortControllerWhenPromiseResolved(
      Promise.all<TInferNativePromiseOrValueFactoryTupleToUnionOfValues<TTuple>>(
        CancellablePromiseRunFactories<TTuple>(constructor, factories, {
          signal: controller.signal
        })
      ) as Promise<TReturnedValue>,
      controller,
      () => new Reason(`One of the parallel promises is rejected`, 'ALL_CALLBACK_REJECTED'),
    );
  }, options);
}

/**
 * Returns a new CancellablePromise, built from a fetch request.
 *  - if 'signal' is aborted, the fetch is aborted too
 */
export function CancellablePromiseFetch<TStrategy extends TAbortStrategy>(
  constructor: ICancellablePromiseConstructor,
  requestInfo: RequestInfo,
  requestInit: RequestInit | undefined,
  options?: ICancellablePromiseOptions
): ICancellablePromise<Response> {
  return new constructor<Response>((resolve: any, reject: any, signal: IAdvancedAbortSignal) => {
    resolve(fetch(...signal.wrapFetchArguments(requestInfo, requestInit)));
  }, options);
}


/** CLASS **/

export class CancellablePromise<T> implements ICancellablePromise<T> {

  static of<T>(
    promiseOrCallback: TCancellablePromisePromiseOrCallback<T>,
    options?: ICancellablePromiseOptions
  ): ICancellablePromise<T> {
    return CancellablePromiseOf<T>(this, promiseOrCallback, options);
  }

  static resolve<T>(
    value: TNativePromiseLikeOrValue<T>,
    options?: ICancellablePromiseOptions
  ): ICancellablePromise<T> {
    return CancellablePromiseResolve<T>(this, value, options);
  }

  static reject<T = never>(
    reason: any,
    options?: ICancellablePromiseOptions
  ): ICancellablePromise<T> {
    return CancellablePromiseReject<T>(this, reason, options);
  }

  static try<T>(
    callback: TCancellablePromiseTryCallback<T>,
    options?: ICancellablePromiseOptions
  ): ICancellablePromise<T> {
    return CancellablePromiseTry<T>(this, callback, options);
  }

  static race<TTuple extends TCancellablePromiseFactory<any>[]>(
    factories: TTuple,
    options?: ICancellablePromiseOptions
  ): TInferCancellablePromiseStaticRaceReturn<TTuple> {
    return CancellablePromiseRace<TTuple>(this, factories, options);
  }

  static all<TTuple extends TCancellablePromiseFactory<any>[]>(
    values: TTuple,
    options?: ICancellablePromiseOptions
  ): TInferCancellablePromiseStaticAllReturn<TTuple> {
    return CancellablePromiseAll<TTuple>(this, values, options);
  }

  static fetch(
    requestInfo: RequestInfo,
    requestInit: RequestInit | undefined,
    options?: ICancellablePromiseOptions
  ): ICancellablePromise<Response> {
    return CancellablePromiseFetch(this, requestInfo, requestInit, options);
  }


  constructor(promiseOrCallback: TCancellablePromisePromiseOrCallback<T>, options?: ICancellablePromiseOptions) {
    ConstructCancellablePromise<T>(this, promiseOrCallback, options);
  }

  get signal(): IAdvancedAbortSignal {
    return CancellablePromiseGetSignal<T>(this);
  }

  get [Symbol.toStringTag](): string {
    return 'CancellablePromise';
  }


  then(): TCancellablePromiseThenReturn<T, undefined, undefined, undefined>;
  then<TFulfilled extends TCancellablePromiseOnFulfilledArgument<T, any>>(
    onFulfilled: TFulfilled,
  ): TCancellablePromiseThenReturn<T, TFulfilled, undefined, undefined>;
  then<TFulfilled extends TCancellablePromiseOnFulfilledArgument<T, any>, TRejected extends TCancellablePromiseOnRejectedArgument<T, any>>(
    onFulfilled: TFulfilled,
    onRejected: TRejected,
  ): TCancellablePromiseThenReturn<T, TFulfilled, TRejected, undefined>;
  then<TFulfilled extends TCancellablePromiseOnFulfilledArgument<T, any>, TRejected extends TCancellablePromiseOnRejectedArgument<T, any>, TCancelled extends TCancellablePromiseOnCancelledArgument<T, any>>(
    onFulfilled: TFulfilled,
    onRejected: TRejected,
    onCancelled: TCancelled,
  ): TCancellablePromiseThenReturn<T, TFulfilled, TRejected, TCancelled>;
  then<TFulfilled extends TCancellablePromiseOnFulfilledArgument<T, any>, TRejected extends TCancellablePromiseOnRejectedArgument<T, any>, TCancelled extends TCancellablePromiseOnCancelledArgument<T, any>>(
    onFulfilled?: TFulfilled,
    onRejected?: TRejected,
    onCancelled?: TCancelled,
  ): TCancellablePromiseThenReturn<T, TFulfilled, TRejected, TCancelled> {
    return CancellablePromiseThen<T, TFulfilled, TRejected, TCancelled>(this, onFulfilled, onRejected, onCancelled);
  }

  catch(): TCancellablePromiseCatchReturn<T, undefined>;
  catch<TRejected extends TCancellablePromiseOnRejectedArgument<T, any>>(onRejected: TRejected): TCancellablePromiseCatchReturn<T, TRejected>;
  catch<TRejected extends TCancellablePromiseOnRejectedArgument<T, any>>(onRejected?: TRejected): TCancellablePromiseCatchReturn<T, TRejected> {
    return CancellablePromiseCatch<T, TRejected>(this, onRejected);
  }

  cancelled(): TCancellablePromiseCancelledReturn<T, undefined>;
  cancelled<TCancelled extends TCancellablePromiseOnCancelledArgument<T, any>>(onCancelled: TCancelled): TCancellablePromiseCancelledReturn<T, TCancelled>;
  cancelled<TCancelled extends TCancellablePromiseOnCancelledArgument<T, any>>(onCancelled?: TCancelled): TCancellablePromiseCancelledReturn<T, TCancelled> {
    return CancellablePromiseCancelled<T, TCancelled>(this, onCancelled);
  }

  finally(onFinally?: TCancellablePromiseOnFinallyArgument<T>, options?: ICancellablePromiseFinallyOptions): ICancellablePromise<T> {
    return CancellablePromiseFinally<T>(this, onFinally, options);
  }

  toPromise(): TInferCancellablePromiseToPromiseReturn<T, 'never'>;
  toPromise<TStrategy extends TAbortStrategy>(options: ICancellablePromiseToPromiseOptions<TStrategy> | undefined): TInferCancellablePromiseToPromiseReturn<T, TStrategy>;
  toPromise<TStrategy extends TAbortStrategy>(options?: ICancellablePromiseToPromiseOptions<TStrategy>): TInferCancellablePromiseToPromiseReturn<T, TStrategy> {
    return CancellablePromiseToPromise<T, TStrategy>(this, options);
  }
}


// function testTyping<T>(options?: ICancellablePromiseOptions) {
//   const value: T = null as any;
//   const reason: string = null as any;
//   const promise: Promise<T> = null as any;
//   const callback: () => T = null as any;
//   const signal: IAdvancedAbortSignal = null as any;
//
//   type TFactories = [() => number, () => string];
//   const factories: TFactories = null as any;
//
//   const url: string = null as any;
//
//   const b1 = CancellablePromise.of(promise, signal);
//   const b2 = CancellablePromise.of<T>(promise, signal);
//   const b3 = CancellablePromise.of(promise, signal, options);
//   const b4 = CancellablePromise.of<T>(promise, signal, options);
//
//   const c1 = CancellablePromise.resolve(value, signal);
//   const c2 = CancellablePromise.resolve<T>(value, signal);
//   const c3 = CancellablePromise.resolve(value, signal, options);
//   const c4 = CancellablePromise.resolve<T>(value, signal, options);
//
//   const d1 = CancellablePromise.reject(reason, signal);
//   const d2 = CancellablePromise.reject(reason, signal, options);
//   const d3 = CancellablePromise.reject(reason, signal, options);
//
//   const e1 = CancellablePromise.try(callback, signal);
//   const e2 = CancellablePromise.try<T>(callback, signal);
//   const e3 = CancellablePromise.try(callback, signal, options);
//   const e4 = CancellablePromise.try<T>(callback, signal, options);
//
//   const f1 = CancellablePromise.race(factories, signal);
//   const f2 = CancellablePromise.race<TFactories>(factories, signal);
//   const f3 = CancellablePromise.race(factories, signal, options);
//   const f4 = CancellablePromise.race<TFactories>(factories, signal, options);
//
//   const g1 = CancellablePromise.all(factories, signal);
//   const g2 = CancellablePromise.all<TFactories>(factories, signal);
//   const g3 = CancellablePromise.all(factories, signal, options);
//   const g4 = CancellablePromise.all<TFactories>(factories, signal, options);
//
//   const h1 = CancellablePromise.fetch(url, void 0, signal);
//   const h2 = CancellablePromise.fetch(url, void 0, signal, options);
//   const h3 = CancellablePromise.fetch(url, void 0, signal, options);
// }


