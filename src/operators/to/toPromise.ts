import { IObservable } from '../../core/observable/interfaces';
import { Observer } from '../../core/observer/implementation';
import { IFiniteStateObservable } from '../../notifications/observables/finite-state/interfaces';
import { IObserver } from '../../core/observer/interfaces';
import { IsObservable } from '../../core/observable/constructor';
import { KeyValueMapToNotifications } from '../../notifications/core/notifications-observable/types';
import {
  TFinalStateConstraint, TFiniteStateKeyValueMapConstraint, TFiniteStateObservableFinalState,
  TFiniteStateObservableGeneric, TFiniteStateObservableKeyValueMapGeneric, TFiniteStateObservableMode,
  TFiniteStateObservableModeConstraint
} from '../../notifications/observables/finite-state/types';
import { IsFiniteStateObservable } from '../../notifications/observables/finite-state/constructor';
import { TPromiseObservableNotifications } from '../../notifications/observables/finite-state/built-in/promise/promise-observable/types';
import { IAdvancedAbortController } from '../../misc/advanced-abort-controller/interfaces';
import {
  TAbortStrategy, TInferAbortStrategyReturn
} from '../../misc/advanced-abort-controller/advanced-abort-signal/types';
import { AdvancedAbortController } from '../../misc/advanced-abort-controller/implementation';
import { INativeCancellablePromiseTuple, TNativePromiseLikeOrValue } from '../../promises/types/native';
import { IAdvancedAbortSignal } from '../../misc/advanced-abort-controller/advanced-abort-signal/interfaces';
import {
  NormalizeAdvancedAbortSignal, NormalizeAdvancedAbortSignalWrapPromiseOptionsStrategy
} from '../../misc/advanced-abort-controller/advanced-abort-signal/helpers';
import { IsObject } from '../../helpers';


/** DEFINITIONS **/

export type TBasePromiseObservableNotification<T> = TPromiseObservableNotifications<T>;
export type TValueOrNotificationType<T> = T | TBasePromiseObservableNotification<T>;

export interface IObservableToPromiseOptions<TStrategy extends TAbortStrategy> {
  signal?: IAdvancedAbortSignal;
  strategy?: TStrategy; // (default: 'never') how to resolve the promise if signal is aborted
}

export interface IObservableToPromiseNormalizedOptions<TStrategy extends TAbortStrategy> extends Required<IObservableToPromiseOptions<TStrategy>> {
}


/** NORMALIZE **/

export function NormalizeObservableToPromiseOptionsSignal(signal?: IAdvancedAbortSignal): IAdvancedAbortSignal {
  return NormalizeAdvancedAbortSignal(signal);
}


export function NormalizeObservableToPromiseOptionsStrategy<TStrategy extends TAbortStrategy>(
  strategy?: TStrategy,
  defaultValue?: TAbortStrategy
): TStrategy {
  return NormalizeAdvancedAbortSignalWrapPromiseOptionsStrategy<TStrategy>(strategy, defaultValue);
}

export function NormalizeObservableToPromiseOptions<TStrategy extends TAbortStrategy>(
  options: IObservableToPromiseOptions<TStrategy> = {},
): IObservableToPromiseNormalizedOptions<TStrategy> {
  if (IsObject(options)) {
    return {
      ...options,
      signal: NormalizeObservableToPromiseOptionsSignal(options.signal),
      strategy: NormalizeObservableToPromiseOptionsStrategy(options.strategy),
    };
  } else {
    throw new TypeError(`Expected object or void as options`);
  }
}


/** CONVERT **/

/* INTERNAL HELPERS */

type TObservableToPromiseResolveFunction<TIn, TOut> = (value: TOut, observer: IObserver<TIn>) => void;
type TObservableToPromiseRejectFunction<TIn> = (reason: any, observer: IObserver<TIn>) => void;

type TObservableToPromiseEmitFunction<TIn, TOut> = (
  value: TIn,
  observer: IObserver<TIn>,
  resolve: TObservableToPromiseResolveFunction<TIn, TOut>,
  reject: TObservableToPromiseRejectFunction<TIn>,
) => void;

// Static default clear function
function DeactivateObserver<T>(observer: IObserver<T>) {
  observer.deactivate();
}


/**
 * Creates a context for an observer observing 'observable'; and for clear, resolve and reject functions
 */
function CreateObservableToPromiseObserverWithClearFunction<TIn, TOut>(
  observable: IObservable<TIn>,
  emit: TObservableToPromiseEmitFunction<TIn, TOut>,
  resolve: (value?: TNativePromiseLikeOrValue<TOut>) => void,
  reject: (reason?: any) => void,
  clear: (observer: IObserver<TIn>) => void,
): IObserver<TIn> {
  const _resolve = (value: TOut, observer: IObserver<TIn>) => {
    clear(observer);
    resolve(value);
  };

  const _reject = (reason: any, observer: IObserver<TIn>) => {
    clear(observer);
    reject(reason);
  };

  const observer: IObserver<TIn> = new Observer<TIn>((value: TIn) => {
    emit(value, observer, _resolve, _reject);
  }).observe(observable);

  return observer.activate();
}

/**
 * Creates a Promise from an Observable, assuming the user provided an abort signal
 */
function ObservableToCancellablePromise<TIn, TOut, TStrategy extends TAbortStrategy>(
  observable: IObservable<TIn>,
  options: IObservableToPromiseNormalizedOptions<TStrategy>,
  emit: TObservableToPromiseEmitFunction<TIn, TOut>,
): Promise<TOut | TInferAbortStrategyReturn<TStrategy>>  {
  const signal: IAdvancedAbortSignal = options.signal;
  return signal.wrapPromise<TOut, TStrategy, never>((resolve: (value?: TNativePromiseLikeOrValue<TOut>) => void, reject: (reason?: any) => void) => {
    let resolved: boolean = false;

    const clear = (observer: IObserver<TIn>) => {
      resolved = true;
      observer.deactivate();
      signalObserver.deactivate();
    };

    const signalObserver = signal.addListener('abort', () => {  // may only append if resolved === false
      clear(observer);
    });

    const observer: IObserver<TIn> = CreateObservableToPromiseObserverWithClearFunction<TIn, TOut>(observable, emit, resolve, reject, clear);

    if (!resolved) {
      signalObserver.activate();
    }
  }, options);
}

/**
 * Creates a Promise from an Observable, assuming the user did NOT provid an abort signal
 */
function ObservableToNonCancellablePromise<TIn, TOut>(
  observable: IObservable<TIn>,
  emit: TObservableToPromiseEmitFunction<TIn, TOut>,
): Promise<TOut> {
  return new Promise((resolve: (value?: TNativePromiseLikeOrValue<TOut>) => void, reject: (reason?: any) => void) => {
    CreateObservableToPromiseObserverWithClearFunction<TIn, TOut>(observable, emit, resolve, reject, DeactivateObserver);
  });
}

/**
 * Creates a Promise from an Observable, using an emit function
 */
function ObservableToPromise<TIn, TOut, TStrategy extends TAbortStrategy>(
  observable: IObservable<TIn>,
  options: IObservableToPromiseOptions<TStrategy> | undefined,
  emit: TObservableToPromiseEmitFunction<TIn, TOut>,
): Promise<TOut | TInferAbortStrategyReturn<TStrategy>> {
  return ((options === void 0) || (options.signal === void 0))
    ? ObservableToNonCancellablePromise<TIn, TOut>(observable, emit)
    : ObservableToCancellablePromise<TIn, TOut, TStrategy>(observable, NormalizeObservableToPromiseOptions<TStrategy>(options), emit);
}

/* GENERIC */

/**
 * Creates a Promise from an Observable.
 *  - when the observable receives a value, the promise is resolved with this value.
 *  - you may provide an options.signal (IAdvancedAbortSignal) to abort the promise. When the signal is aborted:
 *    -> we stop observing 'observable' (to free some resources)
 *    -> we resolve / reject the promise according to the provided 'strategy'
 */
export function genericObservableToPromise<T, TStrategy extends TAbortStrategy>(
  observable: IObservable<T>,
  options?: IObservableToPromiseOptions<TStrategy>,
): Promise<T | TInferAbortStrategyReturn<TStrategy>> {
  return ObservableToPromise<T, T, TStrategy>(observable, options, (value: T, observer: IObserver<T>, resolve: TObservableToPromiseResolveFunction<T, T>) => {
    resolve(value, observer);
  });
}


/* FINITE STATE */

/**
 * Creates a Promise from a FiniteStateObservable
 *  - resolves when the observable emits a 'complete' notification, with all the values received though 'next'
 *  - rejects when the observable emits an 'error' notification
 *  - like genericObservableToPromise, you may provide an options.signal to abort the promise
 */
export function finiteStateObservableToPromise<TValue,
  TFinalState extends TFinalStateConstraint<TFinalState>,
  TMode extends TFiniteStateObservableModeConstraint<TMode>,
  TKVMap extends TFiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>,
  TStrategy extends TAbortStrategy>(
  observable: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>,
  options?: IObservableToPromiseOptions<TStrategy>,
): Promise<TValue[] | TInferAbortStrategyReturn<TStrategy>> {
  type TNotification = KeyValueMapToNotifications<TKVMap>;
  const values: TValue[] = [];
  return ObservableToPromise<TNotification, TValue[], TStrategy>(observable, options, (
    notification: TNotification,
    observer: IObserver<TNotification>,
    resolve: TObservableToPromiseResolveFunction<TNotification, TValue[]>,
    reject: TObservableToPromiseRejectFunction<TNotification>,
  ) => {
    switch (notification.name) {
      case 'next':
        values.push(notification.value);
        break;
      case 'complete':
        resolve(values, observer);
        break;
      case 'error':
        reject(notification.value, observer);
        break;
    }
  });
}


/**
 * Like finiteStateObservableToPromise but returns the last emitted value of 'observable' instead of an array.
 */
export function lastFiniteStateObservableValueToPromise<TValue,
  TFinalState extends TFinalStateConstraint<TFinalState>,
  TMode extends TFiniteStateObservableModeConstraint<TMode>,
  TKVMap extends TFiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>,
  TStrategy extends TAbortStrategy>(
  observable: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>,
  options?: IObservableToPromiseOptions<TStrategy>,
): Promise<TValue | TInferAbortStrategyReturn<TStrategy> | void> {
  return finiteStateObservableToPromise<TValue, TFinalState, TMode, TKVMap, TStrategy>(observable, options)
    .then((result: TValue[] | TInferAbortStrategyReturn<TStrategy>): (TValue | void) => {
      if (Array.isArray(result) && (result.length > 0)) {
        return result[result.length - 1];
      } else {
        return void 0;
      }
    });
}

/**
 * Converts an Observable to a Promise
 *  -> calls proper conversion function depending on the Observable's type
 */
export function toPromise<TValue, TStrategy extends TAbortStrategy>(
  observable: TFiniteStateObservableGeneric<TValue> | IObservable<TValue>,
  options?: IObservableToPromiseOptions<TStrategy>,
): Promise<TValue | TInferAbortStrategyReturn<TStrategy> | void> {
  if (IsFiniteStateObservable(observable)) {
    return lastFiniteStateObservableValueToPromise<TValue, TFiniteStateObservableFinalState, TFiniteStateObservableMode, TFiniteStateObservableKeyValueMapGeneric<TValue, TFiniteStateObservableFinalState>, TStrategy>(observable, options);
  } else if (IsObservable(observable)) {
    return genericObservableToPromise<TValue, TStrategy>(observable as IObservable<TValue>, options);
  } else {
    throw new TypeError(`Expected Observable as observable`);
  }
}
