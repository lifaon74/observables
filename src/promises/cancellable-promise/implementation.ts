import { ICancellablePromise, ICancellablePromiseConstructor } from './interfaces';
import {
  PromiseFulfilledObject, PromiseRejectedObject, TPromise, TPromiseOrValue, TPromiseOrValueFactoryTupleToValueTuple,
  TPromiseOrValueFactoryTupleToValueUnion, TPromiseOrValueTupleToCancellablePromiseTuple,
  TPromiseOrValueTupleToValueUnion, TPromiseType
} from '../interfaces';
import { Reason } from '../../misc/reason/implementation';
import {
  ICancellablePromiseOptions, PromiseCancelledObject, TCancellablePromiseCancelledReturn,
  TCancellablePromiseCatchReturn, TCancellablePromiseCreateCallback, TCancellablePromiseFactory,
  TCancellablePromiseOnCancelledArgument, TCancellablePromiseOnFinallyArgument, TCancellablePromiseOnFulfilled,
  TCancellablePromiseOnFulfilledArgument, TCancellablePromiseOnRejected, TCancellablePromiseOnRejectedArgument,
  TCancellablePromiseThenReturn, TCancellablePromiseTryCallback
} from './types';
import { CANCELLABLE_PROMISE_PRIVATE, ICancellablePromiseInternal, ICancellablePromisePrivate } from './privates';
import { ConstructCancellablePromise, IsCancellablePromise, NewCancellablePromiseFromInstance } from './constructor';
import {
  TAbortStrategy, TAbortStrategyReturn, TAbortStrategyReturnedPromise
} from '../../misc/advanced-abort-controller/advanced-abort-signal/types';
import { IAdvancedAbortSignal } from '../../misc/advanced-abort-controller/advanced-abort-signal/interfaces';

import { AdvancedAbortController } from '../../misc/advanced-abort-controller/implementation';
import { IAdvancedAbortController } from '../../misc/advanced-abort-controller/interfaces';
import { Finally, PromiseTry } from '../helpers';


/** INTERNAL FUNCTIONS **/

function CancellablePromiseInternalThen<T, TStrategy extends TAbortStrategy, TFulfilled extends TCancellablePromiseOnFulfilledArgument<T, TStrategy, any>, TRejected extends TCancellablePromiseOnRejectedArgument<T, TStrategy, any>, TCancelled extends TCancellablePromiseOnCancelledArgument<T, TStrategy, any>>(
  instance: ICancellablePromise<T, TStrategy>,
  onFulfilled: TFulfilled,
  onRejected: TRejected,
  onCancelled: TCancelled,
): TCancellablePromiseThenReturn<T, TStrategy, TFulfilled, TRejected, TCancelled> {
  const privates: ICancellablePromisePrivate<T, TStrategy> = (instance as ICancellablePromiseInternal<T, TStrategy>)[CANCELLABLE_PROMISE_PRIVATE];

  type TPotentiallyCancelledPromiseValue = T | TCancelled | TAbortStrategyReturn<TStrategy>;
  type TPromiseValue = never | TFulfilled | TRejected | TPotentiallyCancelledPromiseValue;

  let newPromise: Promise<TPromiseValue>;
  let newSignal: IAdvancedAbortSignal;
  let onCancelPromise: TAbortStrategyReturnedPromise<T, TStrategy, TCancelled>;

  if (typeof onCancelled === 'function') {
    const abortController: IAdvancedAbortController = new AdvancedAbortController();
    newSignal = abortController.signal;
    onCancelPromise = privates.signal.wrapPromise<T, TStrategy, TCancelled>(
      privates.promise,
      {
        strategy: privates.strategy,
        onAborted: (reason: any, newController: IAdvancedAbortController) => {
          return onCancelled.call(instance, reason, newController, privates.signal);
        },
        onAbortedController: abortController
      }
    );
  } else {
    newSignal = privates.signal;
    onCancelPromise = privates.promise as TAbortStrategyReturnedPromise<T, TStrategy, TCancelled>;
  }

  const onFulfilledDefined: boolean = (typeof onFulfilled === 'function');
  const onRejectedDefined: boolean = (typeof onRejected === 'function');

  if (onFulfilledDefined || onRejectedDefined) {
    newPromise = onCancelPromise.then(
      onFulfilledDefined
        ? privates.signal.wrapFunction<(value: TPotentiallyCancelledPromiseValue) => TPromiseOrValue<TFulfilled>, TStrategy, never>((value: TPotentiallyCancelledPromiseValue): TPromiseOrValue<TFulfilled> => {
          return (onFulfilled as TCancellablePromiseOnFulfilled<T, TStrategy, TFulfilled>).call(instance, value, privates.signal) as any;
        }, privates)
        : void 0,
      onRejectedDefined
        ? privates.signal.wrapFunction<(value: T) => TPromiseOrValue<TRejected>, TStrategy, never>((reason: any) => {
          return (onRejected as TCancellablePromiseOnRejected<T, TStrategy, TRejected>).call(instance, reason, privates.signal);
        }, privates)
        : void 0
    );
  } else {
    newPromise = onCancelPromise;
  }

  return NewCancellablePromiseFromInstance<T, TStrategy, TPromiseValue>(instance, newPromise, newSignal) as TCancellablePromiseThenReturn<T, TStrategy, TFulfilled, TRejected, TCancelled>;
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
  includeCancelled: boolean = false
): ICancellablePromise<T, TStrategy> {
  if (typeof onFinally === 'function') {
    const privates: ICancellablePromisePrivate<T, TStrategy> = (instance as ICancellablePromiseInternal<T, TStrategy>)[CANCELLABLE_PROMISE_PRIVATE];
    return CancellablePromiseThen<T, TStrategy, (value: T) => TPromise<T>, (reason: any) => TPromise<never>, ((reason: any, newController: IAdvancedAbortController) => TPromise<never>) | undefined>(
      instance,
      (value: T) => {
        return PromiseTry<void>((): TPromise<void> => {
          return onFinally.call(instance, {
            status: 'fulfilled',
            value: value
          } as PromiseFulfilledObject<T>, privates.signal);
        }).then(() => value);
      }, (reason: any): TPromise<never> => {
        return PromiseTry<void>(() => {
          return onFinally.call(instance, {
            status: 'rejected',
            reason: reason
          } as PromiseRejectedObject, privates.signal);
        }).then(() => {
          throw reason;
        });
      }, includeCancelled
        ? (reason: any, newController: IAdvancedAbortController): TPromise<never> => {
          return PromiseTry<void>(() => {
            return onFinally.call(instance, {
              status: 'cancelled',
              reason: reason
            } as PromiseCancelledObject, privates.signal);
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
  includeCancelled?: boolean
): ICancellablePromise<T, TStrategy> {
  const privates: ICancellablePromisePrivate<T, TStrategy> = (instance as ICancellablePromiseInternal<T, TStrategy>)[CANCELLABLE_PROMISE_PRIVATE];
  return privates.isCancellablePromiseWithSameSignal
    ? (privates.promise as ICancellablePromise<T, TStrategy>).finally(onFinally, includeCancelled)
    : CancellablePromiseInternalFinally<T, TStrategy>(instance, onFinally, includeCancelled);
}

/**
 * Runs 'factories' in parallel, and wraps each of them with a CancellablePromise
 */
function CancellablePromiseRunFactories<TTuple extends TCancellablePromiseFactory<any>[], TStrategy extends TAbortStrategy>(
  constructor: ICancellablePromiseConstructor,
  factories: TTuple,
  signal: IAdvancedAbortSignal,
  options?: ICancellablePromiseOptions<TPromiseOrValueTupleToValueUnion<TTuple>, TStrategy>
): TPromiseOrValueTupleToCancellablePromiseTuple<TTuple> {
  return factories.map((factory: TCancellablePromiseFactory<any>) => {
    return CancellablePromiseTry<TPromiseOrValueFactoryTupleToValueUnion<TTuple>, TStrategy>(constructor, factory, signal, options);
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
      ...Finally<TPromiseType<TPromise>>(() => {
        if (!controller.signal.aborted) {
          controller.abort(getReason());
        }
      })
    ) as TPromise;
}


/*------------------------------------------------------------------------------------------------------------------------*/


/** METHODS **/

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
  includeCancelled?: boolean
): ICancellablePromise<T, TStrategy> {
  return CancellablePromiseOptimizedFinally<T, TStrategy>(instance, onFinally, includeCancelled);
}


/* STATIC METHODS */

/**
 * Creates and returns a new CancellablePromise if 'promiseOrCallback' is not a CancellablePromise with the same signal,
 * else returns 'promiseOrCallback'
 */
export function CancellablePromiseOf<T, TStrategy extends TAbortStrategy>(
  constructor: ICancellablePromiseConstructor,
  promiseOrCallback: Promise<T> | TCancellablePromiseCreateCallback<T, TStrategy>,
  signal: IAdvancedAbortSignal,
  options?: ICancellablePromiseOptions<T, TStrategy>
): ICancellablePromise<T, TStrategy> {
  return (
    IsCancellablePromise(promiseOrCallback)
    && (promiseOrCallback.signal === signal)
  )
    ? promiseOrCallback
    : new constructor(promiseOrCallback, signal, options);
}


/**
 * Returns a new CancellablePromise resolved with 'value'
 */
export function CancellablePromiseResolve<T, TStrategy extends TAbortStrategy>(
  constructor: ICancellablePromiseConstructor,
  value: TPromiseOrValue<T>,
  signal: IAdvancedAbortSignal,
  options?: ICancellablePromiseOptions<T, TStrategy>
): ICancellablePromise<T, TStrategy> {
  return new CancellablePromise<T, TStrategy>(Promise.resolve<T>(value), signal, options);
}

/**
 * Returns a new CancellablePromise rejected with 'reason'
 */
export function CancellablePromiseReject<TStrategy extends TAbortStrategy>(
  constructor: ICancellablePromiseConstructor,
  reason: any,
  signal: IAdvancedAbortSignal,
  options?: ICancellablePromiseOptions<never, TStrategy>
): ICancellablePromise<never, TStrategy> {
  return new CancellablePromise<never, TStrategy>(Promise.reject<never>(reason), signal, options);
}


/**
 * Returns a new CancellablePromise resolved with the value returned by the execution of 'callback' (rejects if throws)
 */
export function CancellablePromiseTry<T, TStrategy extends TAbortStrategy>(
  constructor: ICancellablePromiseConstructor,
  callback: TCancellablePromiseTryCallback<T, TStrategy>,
  signal: IAdvancedAbortSignal,
  options?: ICancellablePromiseOptions<T, TStrategy>
): ICancellablePromise<T, TStrategy> {
  return new constructor(function (resolve: any, reject: any, signal: IAdvancedAbortSignal) {
    resolve(callback.call(this, signal));
  }, signal, options);
}

/**
 * Returns a new CancellablePromise resolved when ONE of the parallel executions for each 'factories' resolves (fulfilled or rejected).
 *  - every factory receives a shared <signal>.
 *    - this <signal> is aborted if 'signal' is aborted, OR when the returned CancellablePromise is resolved (fulfilled or rejected)
 */
export function CancellablePromiseRace<TTuple extends TCancellablePromiseFactory<any>[], TStrategy extends TAbortStrategy>(
  constructor: ICancellablePromiseConstructor,
  factories: TTuple,
  signal: IAdvancedAbortSignal,
  options?: ICancellablePromiseOptions<TPromiseOrValueTupleToValueUnion<TTuple>, TStrategy>
): ICancellablePromise<TPromiseOrValueFactoryTupleToValueUnion<TTuple>, TStrategy> {
  return CancellablePromiseTry<TPromiseOrValueFactoryTupleToValueUnion<TTuple>, TStrategy>(constructor, function (signal: IAdvancedAbortSignal) {
    const controller: IAdvancedAbortController = AdvancedAbortController.fromAbortSignals(signal);
    return AbortControllerWhenPromiseResolved(
      Promise.race<TPromiseOrValueFactoryTupleToValueUnion<TTuple>>(
        CancellablePromiseRunFactories<TTuple, TStrategy>(constructor, factories, controller.signal, options)
      ),
      controller,
      () => new Reason(`One of the racing promises is resolved`, 'RACE_CALLBACK_RESOLVED'),
    );
  }, signal, options);
}


/**
 * Returns a new CancellablePromise resolved when ALL of the parallel executions for each 'factories' fulfill or ONE is rejected.
 *  - every factory receives a shared <signal>.
 *    - this <signal> is aborted if 'signal' is aborted, OR when the returned CancellablePromise is rejected
 */
export function CancellablePromiseAll<TTuple extends TCancellablePromiseFactory<any>[], TStrategy extends TAbortStrategy>(
  constructor: ICancellablePromiseConstructor,
  factories: TTuple,
  signal: IAdvancedAbortSignal,
  options?: ICancellablePromiseOptions<TPromiseOrValueTupleToValueUnion<TTuple>, TStrategy>
): ICancellablePromise<TPromiseOrValueFactoryTupleToValueTuple<TTuple>, TStrategy> {
  return CancellablePromiseTry<TPromiseOrValueFactoryTupleToValueTuple<TTuple>, TStrategy>(constructor, function (signal: IAdvancedAbortSignal) {
    const controller: IAdvancedAbortController = AdvancedAbortController.fromAbortSignals(signal);
    return AbortControllerWhenPromiseResolved(
      Promise.all<TPromiseOrValueFactoryTupleToValueUnion<TTuple>>(
        CancellablePromiseRunFactories<TTuple, TStrategy>(constructor, factories, controller.signal, options) // TODO
      ) as Promise<TPromiseOrValueFactoryTupleToValueTuple<TTuple>>,
      controller,
      () => new Reason(`One of the parallel promises is rejected`, 'ALL_CALLBACK_REJECTED'),
    );
  }, signal, options);
}

/**
 * Returns a new CancellablePromise, built from a fetch request.
 *  - if 'signal' is aborted, the fetch is aborted too
 */
export function CancellablePromiseFetch<TStrategy extends TAbortStrategy>(
  constructor: ICancellablePromiseConstructor,
  requestInfo: RequestInfo,
  requestInit: RequestInit | undefined,
  signal: IAdvancedAbortSignal,
  options?: ICancellablePromiseOptions<Response, TStrategy>
): ICancellablePromise<Response, TStrategy> {
  return new constructor<Response, TStrategy>((resolve: any, reject: any, signal: IAdvancedAbortSignal) => {
    resolve(fetch(...signal.wrapFetchArguments(requestInfo, requestInit)));
  }, signal, options);
}


/** CLASS **/

export class CancellablePromise<T, TStrategy extends TAbortStrategy = 'never'> implements ICancellablePromise<T, TStrategy> {

  static of<T>(
    promiseOrCallback: Promise<T> | TCancellablePromiseCreateCallback<T, 'never'>,
    signal: IAdvancedAbortSignal,
  ): ICancellablePromise<T, 'never'>;
  static of<T, TStrategy extends TAbortStrategy>(
    promiseOrCallback: Promise<T> | TCancellablePromiseCreateCallback<T, TStrategy>,
    signal: IAdvancedAbortSignal,
    options: ICancellablePromiseOptions<T, TStrategy> | undefined
  ): ICancellablePromise<T, TStrategy>
  static of<T, TStrategy extends TAbortStrategy>(
    promiseOrCallback: Promise<T> | TCancellablePromiseCreateCallback<T, TStrategy>,
    signal: IAdvancedAbortSignal,
    options?: ICancellablePromiseOptions<T, TStrategy>
  ): ICancellablePromise<T, TStrategy> {
    return CancellablePromiseOf<T, TStrategy>(this, promiseOrCallback, signal, options);
  }

  static resolve<T>(
    value: TPromiseOrValue<T>,
    signal: IAdvancedAbortSignal
  ): ICancellablePromise<T, 'never'>;
  static resolve<T, TStrategy extends TAbortStrategy>(
    value: TPromiseOrValue<T>,
    signal: IAdvancedAbortSignal,
    options: ICancellablePromiseOptions<T, TStrategy> | undefined
  ): ICancellablePromise<T, TStrategy>;
  static resolve<T, TStrategy extends TAbortStrategy>(
    value: TPromiseOrValue<T>,
    signal: IAdvancedAbortSignal,
    options?: ICancellablePromiseOptions<T, TStrategy>
  ): ICancellablePromise<T, TStrategy> {
    return CancellablePromiseResolve<T, TStrategy>(this, value, signal, options);
  }

  static reject(
    reason: any,
    signal: IAdvancedAbortSignal
  ): ICancellablePromise<never, 'never'>;
  static reject<TStrategy extends TAbortStrategy>(
    reason: any,
    signal: IAdvancedAbortSignal,
    options: ICancellablePromiseOptions<never, TStrategy> | undefined
  ): ICancellablePromise<never, TStrategy>;
  static reject<TStrategy extends TAbortStrategy>(
    reason: any,
    signal: IAdvancedAbortSignal,
    options?: ICancellablePromiseOptions<never, TStrategy>
  ): ICancellablePromise<never, TStrategy> {
    return CancellablePromiseReject<TStrategy>(this, reason, signal, options);
  }

  static try<T>(
    callback: TCancellablePromiseTryCallback<T, 'never'>,
    signal: IAdvancedAbortSignal,
  ): ICancellablePromise<T, 'never'>;
  static try<T, TStrategy extends TAbortStrategy>(
    callback: TCancellablePromiseTryCallback<T, TStrategy>,
    signal: IAdvancedAbortSignal,
    options: ICancellablePromiseOptions<T, TStrategy> | undefined
  ): ICancellablePromise<T, TStrategy>;
  static try<T, TStrategy extends TAbortStrategy>(
    callback: TCancellablePromiseTryCallback<T, TStrategy>,
    signal: IAdvancedAbortSignal,
    options?: ICancellablePromiseOptions<T, TStrategy>
  ): ICancellablePromise<T, TStrategy> {
    return CancellablePromiseTry<T, TStrategy>(this, callback, signal, options);
  }

  static race<TTuple extends TCancellablePromiseFactory<any>[]>(
    factories: TTuple,
    signal: IAdvancedAbortSignal,
  ): ICancellablePromise<TPromiseOrValueFactoryTupleToValueUnion<TTuple>, 'never'>;
  static race<TTuple extends TCancellablePromiseFactory<any>[], TStrategy extends TAbortStrategy>(
    factories: TTuple,
    signal: IAdvancedAbortSignal,
    options: ICancellablePromiseOptions<TPromiseOrValueTupleToValueUnion<TTuple>, TStrategy> | undefined
  ): ICancellablePromise<TPromiseOrValueFactoryTupleToValueUnion<TTuple>, TStrategy>;
  static race<TTuple extends TCancellablePromiseFactory<any>[], TStrategy extends TAbortStrategy>(
    factories: TTuple,
    signal: IAdvancedAbortSignal,
    options?: ICancellablePromiseOptions<TPromiseOrValueTupleToValueUnion<TTuple>, TStrategy>
  ): ICancellablePromise<TPromiseOrValueFactoryTupleToValueUnion<TTuple>, TStrategy> {
    return CancellablePromiseRace<TTuple, TStrategy>(this, factories, signal, options);
  }

  static all<TTuple extends TPromiseOrValue<any>[]>(
    values: TTuple,
    signal: IAdvancedAbortSignal,
  ): ICancellablePromise<TPromiseOrValueFactoryTupleToValueTuple<TTuple>, 'never'>;
  static all<TTuple extends TPromiseOrValue<any>[], TStrategy extends TAbortStrategy>(
    values: TTuple,
    signal: IAdvancedAbortSignal,
    options: ICancellablePromiseOptions<TPromiseOrValueTupleToValueUnion<TTuple>, TStrategy> | undefined
  ): ICancellablePromise<TPromiseOrValueFactoryTupleToValueTuple<TTuple>, TStrategy>;
  static all<TTuple extends TPromiseOrValue<any>[], TStrategy extends TAbortStrategy>(
    values: TTuple,
    signal: IAdvancedAbortSignal,
    options?: ICancellablePromiseOptions<TPromiseOrValueTupleToValueUnion<TTuple>, TStrategy>
  ): ICancellablePromise<TPromiseOrValueFactoryTupleToValueTuple<TTuple>, TStrategy> {
    return CancellablePromiseAll<TTuple, TStrategy>(this, values, signal, options);
  }

  static fetch(
    requestInfo: RequestInfo,
    requestInit: RequestInit | undefined,
    signal: IAdvancedAbortSignal,
  ): ICancellablePromise<Response, 'never'>;
  static fetch<TStrategy extends TAbortStrategy>(
    requestInfo: RequestInfo,
    requestInit: RequestInit | undefined,
    signal: IAdvancedAbortSignal,
    options: ICancellablePromiseOptions<Response, TStrategy> | undefined
  ): ICancellablePromise<Response, TStrategy>;
  static fetch<TStrategy extends TAbortStrategy>(
    requestInfo: RequestInfo,
    requestInit: RequestInit | undefined,
    signal: IAdvancedAbortSignal,
    options?: ICancellablePromiseOptions<Response, TStrategy>
  ): ICancellablePromise<Response, TStrategy> {
    return CancellablePromiseFetch<TStrategy>(this, requestInfo, requestInit, signal, options);
  }


  constructor(promiseOrCallback: Promise<T> | TCancellablePromiseCreateCallback<T, TStrategy>, signal: IAdvancedAbortSignal, options?: ICancellablePromiseOptions<T, TStrategy>) {
    ConstructCancellablePromise<T, TStrategy>(this, promiseOrCallback, signal, options);
  }

  get promise(): Promise<T | TAbortStrategyReturn<TStrategy>> {
    return ((this as unknown) as ICancellablePromiseInternal<T, TStrategy>)[CANCELLABLE_PROMISE_PRIVATE].promise;
  }

  get signal(): IAdvancedAbortSignal {
    return ((this as unknown) as ICancellablePromiseInternal<T, TStrategy>)[CANCELLABLE_PROMISE_PRIVATE].signal;
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


// function testTyping<T, TStrategy extends TAbortStrategy>(options?: ICancellablePromiseOptions<T, TStrategy>) {
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


