import { ICancellablePromise, ICancellablePromiseConstructor } from './interfaces';
import {
  PromiseFulfilledObject, PromiseRejectedObject, TPromise, TPromiseOrValue, TPromiseOrValueFactoryTupleToValueTuple,
  TPromiseOrValueFactoryTupleToValueUnion, TPromiseOrValueTupleToCancellablePromiseTuple, InferPromiseType
} from '../type-helpers';
import { Reason } from '../../misc/reason/implementation';
import {
  ICancellablePromiseFinallyOptions, ICancellablePromiseNormalizedFinallyOptions, ICancellablePromiseOptions,
  PromiseCancelledObject, TCancellablePromiseCancelledReturn, TCancellablePromiseCatchReturn,
  TCancellablePromiseFactory, TCancellablePromiseOnCancelledArgument, TCancellablePromiseOnFinallyArgument,
  TCancellablePromiseOnFulfilled, TCancellablePromiseOnFulfilledArgument, TCancellablePromiseOnRejected,
  TCancellablePromiseOnRejectedArgument, TCancellablePromisePromiseOrCallback, TCancellablePromiseThenReturn,
  TCancellablePromiseTryCallback
} from './types';
import { CANCELLABLE_PROMISE_PRIVATE, ICancellablePromiseInternal, ICancellablePromisePrivate } from './privates';
import { ConstructCancellablePromise, IsCancellablePromise, NewCancellablePromiseFromInstance } from './constructor';
import { TAbortStrategy, TAbortStrategyReturn } from '../../misc/advanced-abort-controller/advanced-abort-signal/types';
import { IAdvancedAbortSignal } from '../../misc/advanced-abort-controller/advanced-abort-signal/interfaces';

import { AdvancedAbortController } from '../../misc/advanced-abort-controller/implementation';
import { IAdvancedAbortController } from '../../misc/advanced-abort-controller/interfaces';
import { Finally, PromiseTry } from '../helpers';
import { NormalizeICancellablePromiseFinallyOptions } from './functions';
import { IsObject } from '../../helpers';


/** INTERNAL FUNCTIONS **/

function CancellablePromiseInternalThen<T, TStrategy extends TAbortStrategy, TFulfilled extends TCancellablePromiseOnFulfilledArgument<T, TStrategy, any>, TRejected extends TCancellablePromiseOnRejectedArgument<T, TStrategy, any>, TCancelled extends TCancellablePromiseOnCancelledArgument<T, TStrategy, any>>(
  instance: ICancellablePromise<T, TStrategy>,
  onFulfilled: TFulfilled,
  onRejected: TRejected,
  onCancelled: TCancelled,
): TCancellablePromiseThenReturn<T, TStrategy, TFulfilled, TRejected, TCancelled> {
  const privates: ICancellablePromisePrivate<T, TStrategy> = (instance as ICancellablePromiseInternal<T, TStrategy>)[CANCELLABLE_PROMISE_PRIVATE];

  type TPrivatePromiseInValue = T | TAbortStrategyReturn<TStrategy>;
  type TPrivatePromiseOutValue = never | TFulfilled | TRejected | TPrivatePromiseInValue;
  type TPromiseValue = TCancelled | TPrivatePromiseOutValue;

  const _onFulfilled = (typeof onFulfilled === 'function')
    ? privates.signal.wrapFunction<(value: TPrivatePromiseInValue) => TPromiseOrValue<TFulfilled>, TStrategy, never>((value: TPrivatePromiseInValue): TPromiseOrValue<TFulfilled> => {
      return (onFulfilled as TCancellablePromiseOnFulfilled<T, TStrategy, TFulfilled>).call(instance, value, instance) as any;
    }, { strategy: privates.strategy })
    : void 0;

  const _onRejected = (typeof onRejected === 'function')
    ? privates.signal.wrapFunction<(value: T) => TPromiseOrValue<TRejected>, TStrategy, never>((reason: any) => {
      return (onRejected as TCancellablePromiseOnRejected<T, TStrategy, TRejected>).call(instance, reason, instance);
    }, { strategy: privates.strategy })
    : void 0;

  const fulfilledAndRejectedHandledPromise: Promise<TPrivatePromiseOutValue> =
    ((_onFulfilled === void 0) && (_onFulfilled === void 0))
      ? privates.promise
      : privates.promise.then(_onFulfilled, _onRejected);

  let newSignal: IAdvancedAbortSignal;
  let cancelHandledPromise: Promise<TPromiseValue>;

  if (typeof onCancelled === 'function') {
    const abortController: IAdvancedAbortController = new AdvancedAbortController();
    newSignal = abortController.signal;
    cancelHandledPromise = privates.signal.wrapPromise<TPromiseValue, TStrategy, TCancelled>(
      fulfilledAndRejectedHandledPromise,
      {
        strategy: privates.strategy,
        onAborted: (reason: any, newController: IAdvancedAbortController) => {
          return onCancelled.call(instance, reason, newController, instance);
        },
        onAbortedController: abortController
      }
    );
  } else {
    newSignal = privates.signal;
    cancelHandledPromise = fulfilledAndRejectedHandledPromise;
  }

  return NewCancellablePromiseFromInstance<T, TStrategy, TPromiseValue>(
    instance,
    cancelHandledPromise,
    {
      signal: newSignal
    }) as TCancellablePromiseThenReturn<T, TStrategy, TFulfilled, TRejected, TCancelled>;
}

function CancellablePromiseOptimizedThen<T, TStrategy extends TAbortStrategy, TFulfilled extends TCancellablePromiseOnFulfilledArgument<T, TStrategy, any>, TRejected extends TCancellablePromiseOnRejectedArgument<T, TStrategy, any>, TCancelled extends TCancellablePromiseOnCancelledArgument<T, TStrategy, any>>(
  instance: ICancellablePromise<T, TStrategy>,
  onFulfilled: TFulfilled,
  onRejected: TRejected,
  onCancelled: TCancelled,
): TCancellablePromiseThenReturn<T, TStrategy, TFulfilled, TRejected, TCancelled> {
  const privates: ICancellablePromisePrivate<T, TStrategy> = (instance as ICancellablePromiseInternal<T, TStrategy>)[CANCELLABLE_PROMISE_PRIVATE];
  return privates.isCancellablePromiseWithSameSignal
    ? (privates.promise as ICancellablePromise<T, TStrategy>).then<TFulfilled, TRejected, TCancelled>(onFulfilled, onRejected, onCancelled)
    : CancellablePromiseInternalThen<T, TStrategy, TFulfilled, TRejected, TCancelled>(instance, onFulfilled, onRejected, onCancelled);
}


function CancellablePromiseInternalFinally<T, TStrategy extends TAbortStrategy>(
  instance: ICancellablePromise<T, TStrategy>,
  onFinally: TCancellablePromiseOnFinallyArgument<T, TStrategy>,
  options?: ICancellablePromiseFinallyOptions
): ICancellablePromise<T, TStrategy> {
  if (typeof onFinally === 'function') {
    const _options: ICancellablePromiseNormalizedFinallyOptions = NormalizeICancellablePromiseFinallyOptions(options);

    const privates: ICancellablePromisePrivate<T, TStrategy> = (instance as ICancellablePromiseInternal<T, TStrategy>)[CANCELLABLE_PROMISE_PRIVATE];
    return CancellablePromiseThen<T, TStrategy, (value: T) => TPromise<T>, (reason: any) => TPromise<never>, ((reason: any, newController: IAdvancedAbortController) => TPromise<never>) | undefined>(
      instance,
      (value: T) => {
        return PromiseTry<void>((): TPromise<void> => {
          return onFinally.call(instance, {
            status: 'fulfilled',
            value: value
          } as PromiseFulfilledObject<T>, instance);
        }).then(() => value);
      }, (reason: any): TPromise<never> => {
        return PromiseTry<void>(() => {
          return onFinally.call(instance, {
            status: 'rejected',
            reason: reason
          } as PromiseRejectedObject, instance);
        }).then(() => {
          throw reason;
        });
      }, _options.includeCancelled
        ? (reason: any, newController: IAdvancedAbortController): TPromise<never> => {
          return PromiseTry<void>(() => {
            return onFinally.call(instance, {
              status: 'cancelled',
              reason: reason
            } as PromiseCancelledObject, instance);
          }).then(() => {
            newController.abort(reason);
            throw new Error(`Cancelled`);
          });
        }
        : void 0
    ) as ICancellablePromise<T, TStrategy>;
  } else {
    return CancellablePromiseThen<T, TStrategy, undefined, undefined, undefined>(instance, void 0, void 0, void 0) as ICancellablePromise<T, TStrategy>;
  }
}

function CancellablePromiseOptimizedFinally<T, TStrategy extends TAbortStrategy>(
  instance: ICancellablePromise<T, TStrategy>,
  onFinally: TCancellablePromiseOnFinallyArgument<T, TStrategy>,
  options?: ICancellablePromiseFinallyOptions,
): ICancellablePromise<T, TStrategy> {
  const privates: ICancellablePromisePrivate<T, TStrategy> = (instance as ICancellablePromiseInternal<T, TStrategy>)[CANCELLABLE_PROMISE_PRIVATE];
  return privates.isCancellablePromiseWithSameSignal
    ? (privates.promise as ICancellablePromise<T, TStrategy>).finally(onFinally, options)
    : CancellablePromiseInternalFinally<T, TStrategy>(instance, onFinally, options);
}

/**
 * Runs 'factories' in parallel, and wraps each of them with a CancellablePromise
 */
function CancellablePromiseRunFactories<TTuple extends TCancellablePromiseFactory<any, TStrategy>[], TStrategy extends TAbortStrategy>(
  constructor: ICancellablePromiseConstructor,
  factories: TTuple,
  options?: ICancellablePromiseOptions<TStrategy>
): TPromiseOrValueTupleToCancellablePromiseTuple<TTuple> {
  return factories.map((factory: TCancellablePromiseFactory<any, TStrategy>) => {
    return CancellablePromiseTry<TPromiseOrValueFactoryTupleToValueUnion<TTuple>, TStrategy>(constructor, factory, options);
  }) as unknown as TPromiseOrValueTupleToCancellablePromiseTuple<TTuple>;
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
      ...Finally<InferPromiseType<TPromise>>(() => {
        if (!controller.signal.aborted) {
          controller.abort(getReason());
        }
      })
    ) as TPromise;
}


/*------------------------------------------------------------------------------------------------------------------------*/


/** METHODS **/

/* GETTERS/SETTERS */

export function CancellablePromiseGetPromise<T, TStrategy extends TAbortStrategy>(instance: ICancellablePromise<T, TStrategy>): Promise<T | TAbortStrategyReturn<TStrategy>> {
  return (instance as ICancellablePromiseInternal<T, TStrategy>)[CANCELLABLE_PROMISE_PRIVATE].promise;
}

export function CancellablePromiseGetSignal<T, TStrategy extends TAbortStrategy>(instance: ICancellablePromise<T, TStrategy>): IAdvancedAbortSignal {
  return (instance as ICancellablePromiseInternal<T, TStrategy>)[CANCELLABLE_PROMISE_PRIVATE].signal;
}

export function CancellablePromiseGetStrategy<T, TStrategy extends TAbortStrategy>(instance: ICancellablePromise<T, TStrategy>): TStrategy {
  return (instance as ICancellablePromiseInternal<T, TStrategy>)[CANCELLABLE_PROMISE_PRIVATE].strategy;
}

/* METHODS */

export function CancellablePromiseThen<T, TStrategy extends TAbortStrategy, TFulfilled extends TCancellablePromiseOnFulfilledArgument<T, TStrategy, any>, TRejected extends TCancellablePromiseOnRejectedArgument<T, TStrategy, any>, TCancelled extends TCancellablePromiseOnCancelledArgument<T, TStrategy, any>>(
  instance: ICancellablePromise<T, TStrategy>,
  onFulfilled?: TFulfilled,
  onRejected?: TRejected,
  onCancelled?: TCancelled,
): TCancellablePromiseThenReturn<T, TStrategy, TFulfilled, TRejected, TCancelled> {
  return CancellablePromiseOptimizedThen<T, TStrategy, TFulfilled, TRejected, TCancelled>(instance, onFulfilled as TFulfilled, onRejected as TRejected, onCancelled as TCancelled);
}

export function CancellablePromiseCatch<T, TStrategy extends TAbortStrategy, TRejected extends TCancellablePromiseOnRejectedArgument<T, TStrategy, any>>(
  instance: ICancellablePromise<T, TStrategy>,
  onRejected?: TRejected,
): TCancellablePromiseCatchReturn<T, TStrategy, TRejected> {
  return CancellablePromiseThen<T, TStrategy, undefined, TRejected, undefined>(instance, void 0, onRejected as TRejected, void 0) as TCancellablePromiseCatchReturn<T, TStrategy, TRejected>;
}

export function CancellablePromiseCancelled<T, TStrategy extends TAbortStrategy, TCancelled extends TCancellablePromiseOnCancelledArgument<T, TStrategy, any>>(
  instance: ICancellablePromise<T, TStrategy>,
  onCancelled?: TCancelled
): TCancellablePromiseCancelledReturn<T, TStrategy, TCancelled> {
  return CancellablePromiseThen<T, TStrategy, undefined, undefined, TCancelled>(instance, void 0, void 0, onCancelled as TCancelled) as TCancellablePromiseCancelledReturn<T, TStrategy, TCancelled>;
}

export function CancellablePromiseFinally<T, TStrategy extends TAbortStrategy>(
  instance: ICancellablePromise<T, TStrategy>,
  onFinally?: TCancellablePromiseOnFinallyArgument<T, TStrategy>,
  options?: ICancellablePromiseFinallyOptions,
): ICancellablePromise<T, TStrategy> {
  return CancellablePromiseOptimizedFinally<T, TStrategy>(instance, onFinally, options);
}


/* STATIC METHODS */

/**
 * Creates and returns a new CancellablePromise if 'promiseOrCallback' is not a CancellablePromise with the same signal,
 * else returns 'promiseOrCallback'
 */
export function CancellablePromiseOf<T, TStrategy extends TAbortStrategy>(
  constructor: ICancellablePromiseConstructor,
  promiseOrCallback: TCancellablePromisePromiseOrCallback<T, TStrategy>,
  options?: ICancellablePromiseOptions<TStrategy>
): ICancellablePromise<T, TStrategy> {
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
export function CancellablePromiseResolve<T, TStrategy extends TAbortStrategy>(
  constructor: ICancellablePromiseConstructor,
  value: TPromiseOrValue<T>,
  options?: ICancellablePromiseOptions<TStrategy>
): ICancellablePromise<T, TStrategy> {
  return new CancellablePromise<T, TStrategy>(Promise.resolve<T>(value), options);
}

/**
 * Returns a new CancellablePromise rejected with 'reason'
 */
export function CancellablePromiseReject<T, TStrategy extends TAbortStrategy>(
  constructor: ICancellablePromiseConstructor,
  reason: any,
  options?: ICancellablePromiseOptions<TStrategy>
): ICancellablePromise<T, TStrategy> {
  return new CancellablePromise<T, TStrategy>(Promise.reject<T>(reason), options);
}


/**
 * Returns a new CancellablePromise resolved with the value returned by the execution of 'callback' (rejects if throws)
 */
export function CancellablePromiseTry<T, TStrategy extends TAbortStrategy>(
  constructor: ICancellablePromiseConstructor,
  callback: TCancellablePromiseTryCallback<T, TStrategy>,
  options?: ICancellablePromiseOptions<TStrategy>
): ICancellablePromise<T, TStrategy> {
  return new constructor<T, TStrategy>(function (resolve: any, reject: any, cancellablePromise: ICancellablePromise<T, TStrategy>) {
    resolve(callback.call(this, cancellablePromise));
  }, options);
}

/**
 * Returns a new CancellablePromise resolved when ONE of the parallel executions for each 'factories' resolves (fulfilled or rejected).
 *  - every factory receives a shared <signal>.
 *    - this <signal> is aborted if 'signal' is aborted, OR when the returned CancellablePromise is resolved (fulfilled or rejected)
 */
export function CancellablePromiseRace<TTuple extends TCancellablePromiseFactory<any, TStrategy>[], TStrategy extends TAbortStrategy>(
  constructor: ICancellablePromiseConstructor,
  factories: TTuple,
  options?: ICancellablePromiseOptions<TStrategy>
): ICancellablePromise<TPromiseOrValueFactoryTupleToValueUnion<TTuple>, TStrategy> {
  return CancellablePromiseTry<TPromiseOrValueFactoryTupleToValueUnion<TTuple>, TStrategy>(constructor, function (cancellablePromise: ICancellablePromise<TPromiseOrValueFactoryTupleToValueUnion<TTuple>, TStrategy>) {
    const controller: IAdvancedAbortController = AdvancedAbortController.fromAbortSignals(cancellablePromise.signal);
    return AbortControllerWhenPromiseResolved(
      Promise.race<TPromiseOrValueFactoryTupleToValueUnion<TTuple>>(
        CancellablePromiseRunFactories<TTuple, TStrategy>(constructor, factories, {
          strategy: cancellablePromise.strategy,
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
 *    - this <signal> is aborted if 'signal' is aborted, OR when the returned CancellablePromise is rejected
 */
export function CancellablePromiseAll<TTuple extends TCancellablePromiseFactory<any, TStrategy>[], TStrategy extends TAbortStrategy>(
  constructor: ICancellablePromiseConstructor,
  factories: TTuple,
  options?: ICancellablePromiseOptions<TStrategy>
): ICancellablePromise<TPromiseOrValueFactoryTupleToValueTuple<TTuple>, TStrategy> {
  return CancellablePromiseTry<TPromiseOrValueFactoryTupleToValueTuple<TTuple>, TStrategy>(constructor, function (cancellablePromise: ICancellablePromise<TPromiseOrValueFactoryTupleToValueTuple<TTuple>, TStrategy>) {
    const controller: IAdvancedAbortController = AdvancedAbortController.fromAbortSignals(cancellablePromise.signal);
    return AbortControllerWhenPromiseResolved(
      Promise.all<TPromiseOrValueFactoryTupleToValueUnion<TTuple>>(
        CancellablePromiseRunFactories<TTuple, TStrategy>(constructor, factories, {
          strategy: cancellablePromise.strategy,
          signal: controller.signal
        }) // TODO
      ) as Promise<TPromiseOrValueFactoryTupleToValueTuple<TTuple>>,
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
  options?: ICancellablePromiseOptions<TStrategy>
): ICancellablePromise<Response, TStrategy> {
  return new constructor<Response, TStrategy>((resolve: any, reject: any, cancellablePromise: ICancellablePromise<Response, TStrategy>) => {
    resolve(fetch(...cancellablePromise.signal.wrapFetchArguments(requestInfo, requestInit)));
  }, options);
}


/** CLASS **/

export class CancellablePromise<T, TStrategy extends TAbortStrategy = 'never'> implements ICancellablePromise<T, TStrategy> {

  static of<T>(
    promiseOrCallback: TCancellablePromisePromiseOrCallback<T, 'never'>,
    options?: ICancellablePromiseOptions<'never'>,
  ): ICancellablePromise<T, 'never'>;
  static of<T, TStrategy extends TAbortStrategy>(
    promiseOrCallback: TCancellablePromisePromiseOrCallback<T, TStrategy>,
    options: ICancellablePromiseOptions<TStrategy> | undefined
  ): ICancellablePromise<T, TStrategy>
  static of<T, TStrategy extends TAbortStrategy>(
    promiseOrCallback: TCancellablePromisePromiseOrCallback<T, TStrategy>,
    options?: ICancellablePromiseOptions<TStrategy>
  ): ICancellablePromise<T, TStrategy> {
    return CancellablePromiseOf<T, TStrategy>(this, promiseOrCallback, options);
  }

  static resolve<T>(
    value: TPromiseOrValue<T>,
    options?: ICancellablePromiseOptions<'never'>,
  ): ICancellablePromise<T, 'never'>;
  static resolve<T, TStrategy extends TAbortStrategy>(
    value: TPromiseOrValue<T>,
    options: ICancellablePromiseOptions<TStrategy> | undefined
  ): ICancellablePromise<T, TStrategy>;
  static resolve<T, TStrategy extends TAbortStrategy>(
    value: TPromiseOrValue<T>,
    options?: ICancellablePromiseOptions<TStrategy>
  ): ICancellablePromise<T, TStrategy> {
    return CancellablePromiseResolve<T, TStrategy>(this, value, options);
  }

  static reject<T = never>(
    reason: any,
    options?: ICancellablePromiseOptions<'never'>,
  ): ICancellablePromise<T, 'never'>;
  static reject<T, TStrategy extends TAbortStrategy>(
    reason: any,
    options: ICancellablePromiseOptions<TStrategy> | undefined
  ): ICancellablePromise<T, TStrategy>;
  static reject<T, TStrategy extends TAbortStrategy>(
    reason: any,
    options?: ICancellablePromiseOptions<TStrategy>
  ): ICancellablePromise<T, TStrategy> {
    return CancellablePromiseReject<T, TStrategy>(this, reason, options);
  }

  static try<T>(
    callback: TCancellablePromiseTryCallback<T, 'never'>,
    options?: ICancellablePromiseOptions<'never'>,
  ): ICancellablePromise<T, 'never'>;
  static try<T, TStrategy extends TAbortStrategy>(
    callback: TCancellablePromiseTryCallback<T, TStrategy>,
    options: ICancellablePromiseOptions<TStrategy> | undefined
  ): ICancellablePromise<T, TStrategy>;
  static try<T, TStrategy extends TAbortStrategy>(
    callback: TCancellablePromiseTryCallback<T, TStrategy>,
    options?: ICancellablePromiseOptions<TStrategy>
  ): ICancellablePromise<T, TStrategy> {
    return CancellablePromiseTry<T, TStrategy>(this, callback, options);
  }

  static race<TTuple extends TCancellablePromiseFactory<any, 'never'>[]>(
    factories: TTuple,
    options?: ICancellablePromiseOptions<'never'>,
  ): ICancellablePromise<TPromiseOrValueFactoryTupleToValueUnion<TTuple>, 'never'>;
  static race<TTuple extends TCancellablePromiseFactory<any, TStrategy>[], TStrategy extends TAbortStrategy>(
    factories: TTuple,
    options: ICancellablePromiseOptions<TStrategy> | undefined
  ): ICancellablePromise<TPromiseOrValueFactoryTupleToValueUnion<TTuple>, TStrategy>;
  static race<TTuple extends TCancellablePromiseFactory<any, TStrategy>[], TStrategy extends TAbortStrategy>(
    factories: TTuple,
    options?: ICancellablePromiseOptions<TStrategy>
  ): ICancellablePromise<TPromiseOrValueFactoryTupleToValueUnion<TTuple>, TStrategy> {
    return CancellablePromiseRace<TTuple, TStrategy>(this, factories, options);
  }

  static all<TTuple extends TPromiseOrValue<any>[]>(
    values: TTuple,
    options?: ICancellablePromiseOptions<'never'>,
  ): ICancellablePromise<TPromiseOrValueFactoryTupleToValueTuple<TTuple>, 'never'>;
  static all<TTuple extends TPromiseOrValue<any>[], TStrategy extends TAbortStrategy>(
    values: TTuple,
    options: ICancellablePromiseOptions<TStrategy> | undefined
  ): ICancellablePromise<TPromiseOrValueFactoryTupleToValueTuple<TTuple>, TStrategy>;
  static all<TTuple extends TPromiseOrValue<any>[], TStrategy extends TAbortStrategy>(
    values: TTuple,
    options?: ICancellablePromiseOptions<TStrategy>
  ): ICancellablePromise<TPromiseOrValueFactoryTupleToValueTuple<TTuple>, TStrategy> {
    return CancellablePromiseAll<TTuple, TStrategy>(this, values, options);
  }

  static fetch(
    requestInfo: RequestInfo,
    requestInit: RequestInit | undefined,
    options?: ICancellablePromiseOptions<'never'>,
  ): ICancellablePromise<Response, 'never'>;
  static fetch<TStrategy extends TAbortStrategy>(
    requestInfo: RequestInfo,
    requestInit: RequestInit | undefined,
    options: ICancellablePromiseOptions<TStrategy> | undefined
  ): ICancellablePromise<Response, TStrategy>;
  static fetch<TStrategy extends TAbortStrategy>(
    requestInfo: RequestInfo,
    requestInit: RequestInit | undefined,
    options?: ICancellablePromiseOptions<TStrategy>
  ): ICancellablePromise<Response, TStrategy> {
    return CancellablePromiseFetch<TStrategy>(this, requestInfo, requestInit, options);
  }


  constructor(promiseOrCallback: TCancellablePromisePromiseOrCallback<T, TStrategy>, options?: ICancellablePromiseOptions<TStrategy>) {
    ConstructCancellablePromise<T, TStrategy>(this, promiseOrCallback, options);
  }

  get promise(): Promise<T | TAbortStrategyReturn<TStrategy>> {
    return CancellablePromiseGetPromise<T, TStrategy>(this);
  }

  get signal(): IAdvancedAbortSignal {
    return CancellablePromiseGetSignal<T, TStrategy>(this);
  }

  get strategy(): TStrategy {
    return CancellablePromiseGetStrategy<T, TStrategy>(this);
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

  finally(onFinally?: TCancellablePromiseOnFinallyArgument<T, TStrategy>, options?: ICancellablePromiseFinallyOptions): ICancellablePromise<T, TStrategy> {
    return CancellablePromiseFinally<T, TStrategy>(this, onFinally, options);
  }
}


// function testTyping<T, TStrategy extends TAbortStrategy>(options?: ICancellablePromiseOptions<TStrategy>) {
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
//   const b4 = CancellablePromise.of<T, TStrategy>(promise, signal, options);
//
//   const c1 = CancellablePromise.resolve(value, signal);
//   const c2 = CancellablePromise.resolve<T>(value, signal);
//   const c3 = CancellablePromise.resolve(value, signal, options);
//   const c4 = CancellablePromise.resolve<T, TStrategy>(value, signal, options);
//
//   const d1 = CancellablePromise.reject(reason, signal);
//   const d2 = CancellablePromise.reject(reason, signal, options);
//   const d3 = CancellablePromise.reject<TStrategy>(reason, signal, options);
//
//   const e1 = CancellablePromise.try(callback, signal);
//   const e2 = CancellablePromise.try<T>(callback, signal);
//   const e3 = CancellablePromise.try(callback, signal, options);
//   const e4 = CancellablePromise.try<T, TStrategy>(callback, signal, options);
//
//   const f1 = CancellablePromise.race(factories, signal);
//   const f2 = CancellablePromise.race<TFactories>(factories, signal);
//   const f3 = CancellablePromise.race(factories, signal, options);
//   const f4 = CancellablePromise.race<TFactories, TStrategy>(factories, signal, options);
//
//   const g1 = CancellablePromise.all(factories, signal);
//   const g2 = CancellablePromise.all<TFactories>(factories, signal);
//   const g3 = CancellablePromise.all(factories, signal, options);
//   const g4 = CancellablePromise.all<TFactories, TStrategy>(factories, signal, options);
//
//   const h1 = CancellablePromise.fetch(url, void 0, signal);
//   const h2 = CancellablePromise.fetch(url, void 0, signal, options);
//   const h3 = CancellablePromise.fetch<TStrategy>(url, void 0, signal, options);
// }


