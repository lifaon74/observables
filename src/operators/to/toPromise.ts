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

/**
 * Creates a cancellable Promise from an Observable
 *  - you may provide an options.signal (IAdvancedAbortSignal) to abort the promise. When the signal is aborted:
 *    -> stop observing 'observable' (free some resources)
 *    -> resolve / reject the promise according to the provided 'strategy'
 */
export function genericObservableToCancellablePromise<T, TStrategy extends TAbortStrategy>(
  observable: IObservable<T>,
  options: IObservableToPromiseNormalizedOptions<TStrategy>,
): Promise<T | TInferAbortStrategyReturn<TStrategy>> {
  return options.signal.wrapPromise<T, TStrategy, never>((resolve: (value?: TNativePromiseLikeOrValue<T>) => void) => {
    const clear = () => {
      observer.deactivate();
      signalObserver.deactivate();
    };

    const signalObserver = options.signal.addListener('abort', () => {
      clear();
    });

    const observer: IObserver<T> = new Observer<T>((value: T) => {
      clear();
      resolve(value);
    }).observe(observable);

    observer.activate();
    signalObserver.activate();
  }, options);
}

export function genericObservableToNonCancellablePromise<T>(observable: IObservable<T>): Promise<T> {
  return new Promise<T>((resolve: (value?: TNativePromiseLikeOrValue<T>) => void) => {
    const observer: IObserver<T> = new Observer<T>((value: T) => {
      observer.deactivate();
      resolve(value);
    }).observe(observable);

    observer.activate();
  });
}

export function genericObservableToPromise<T, TStrategy extends TAbortStrategy>(
  observable: IObservable<T>,
  options?: IObservableToPromiseOptions<TStrategy>,
): Promise<T | TInferAbortStrategyReturn<TStrategy>> {
  return ((options === void 0) || (options.signal === void 0))
    ? genericObservableToNonCancellablePromise<T>(observable)
    : genericObservableToCancellablePromise<T, TStrategy>(observable, NormalizeObservableToPromiseOptions<TStrategy>(options));
}


/**
 * Returns a tuple composed of :
 *  - a 'promise' (Promise) which resolves when the 'observable' emits a 'complete' notification
 *    -> resolved value is an array composed of the values received through 'next'
 *    -> rejected value is the error received through 'error'
 *  - a 'signal' (IAdvancedAbortSignal), which aborts when an 'abort' notification is received or when options.signal is aborted
 *
 *  -> if returned signal is aborted, the promise is aborted depending on the provided strategy (may: reject, resolve with undefined, or never resolve)
 */
export function finiteStateObservableToCancellablePromiseTuple<TValue,
  TFinalState extends TFinalStateConstraint<TFinalState>,
  TMode extends TFiniteStateObservableModeConstraint<TMode>,
  TKVMap extends TFiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>,
  TStrategy extends TAbortStrategy>(
  observable: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>,
  options?: IObservableToPromiseOptions<TStrategy>,
): INativeCancellablePromiseTuple<TValue[] | TInferAbortStrategyReturn<TStrategy>> {
  const signal: IAdvancedAbortSignal | undefined = (options === void 0) ? void 0 : options.signal;
  const controller: IAdvancedAbortController = (signal === void 0)
    ? new AdvancedAbortController()
    : AdvancedAbortController.fromAbortSignals(signal);

  return {
    promise: controller.signal.wrapPromise<TValue[], TStrategy, never>((resolve: (value?: TNativePromiseLikeOrValue<TValue[]>) => void, reject: (reason?: any) => void) => {
      const values: TValue[] = [];

      const _clear = () => {
        observer.deactivate();
        if (signalObserver !== void 0) {
          signalObserver.deactivate();
        }
      };

      const _resolve = () => {
        _clear();
        resolve(values);
      };

      const _reject = (error: any): void => {
        _clear();
        reject(error);
      };

      const signalObserver = (signal === void 0)
        ? void 0
        : signal.addListener('abort', () => {
          _clear();
        });

      const observer: IObserver<KeyValueMapToNotifications<TKVMap>> = new Observer<KeyValueMapToNotifications<TKVMap>>((notification: KeyValueMapToNotifications<TKVMap>) => {
        switch (notification.name) {
          case 'next':
            values.push(notification.value);
            break;
          case 'complete':
            _resolve();
            break;
          case 'error':
            _reject(notification.value);
            break;
          case 'abort':
            controller.abort(notification.value);
            break;
        }
      }).observe(observable);

      observer.activate();
      if (signalObserver !== void 0) {
        signalObserver.activate();
      }
    }, options),
    signal: controller.signal
  };
}


/**
 * Like finiteStateObservableToCancellablePromiseTuple but returns the last emitted value of 'observable' instead of an array.
 */
export function lastFiniteStateObservableValueToCancellablePromiseTuple<TValue,
  TFinalState extends TFinalStateConstraint<TFinalState>,
  TMode extends TFiniteStateObservableModeConstraint<TMode>,
  TKVMap extends TFiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>,
  TStrategy extends TAbortStrategy>(
  observable: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>,
  options?: IObservableToPromiseOptions<TStrategy>,
): INativeCancellablePromiseTuple<TValue | TInferAbortStrategyReturn<TStrategy> | void> {
  const result: INativeCancellablePromiseTuple<TValue[] | TInferAbortStrategyReturn<TStrategy>> = finiteStateObservableToCancellablePromiseTuple<TValue, TFinalState, TMode, TKVMap, TStrategy>(observable, options);
  return {
    promise: result.promise.then((result: TValue[] | TInferAbortStrategyReturn<TStrategy>): (TValue | void) => {
      if (Array.isArray(result) && (result.length > 0)) {
        return result[result.length - 1];
      } else {
        return void 0;
      }
    }),
    signal: result.signal
  };
}

/*-------------------------*/

// export function genericObservableToPromise<T, TStrategy extends TAbortStrategy>(
//   observable: IObservable<T>,
//   options?: IObservableToCancellablePromiseTupleOptions<TStrategy>,
// ): Promise<T | TInferAbortStrategyReturn<TStrategy>> {
//   return genericObservableToCancellablePromiseTuple<T, TStrategy>(observable, options).promise;
// }


export function finiteStateObservableToPromise<TValue,
  TFinalState extends TFinalStateConstraint<TFinalState>,
  TMode extends TFiniteStateObservableModeConstraint<TMode>,
  TKVMap extends TFiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>,
  TStrategy extends TAbortStrategy>(
  observable: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>,
  options?: IObservableToPromiseOptions<TStrategy>,
): Promise<TValue[] | TInferAbortStrategyReturn<TStrategy>> {
  return finiteStateObservableToCancellablePromiseTuple<TValue, TFinalState, TMode, TKVMap, TStrategy>(observable, options).promise;
}

export function lastFiniteStateObservableValueToPromise<TValue,
  TFinalState extends TFinalStateConstraint<TFinalState>,
  TMode extends TFiniteStateObservableModeConstraint<TMode>,
  TKVMap extends TFiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>,
  TStrategy extends TAbortStrategy>(
  observable: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>,
  options?: IObservableToPromiseOptions<TStrategy>,
): Promise<TValue | TInferAbortStrategyReturn<TStrategy> | void> {
  return lastFiniteStateObservableValueToCancellablePromiseTuple<TValue, TFinalState, TMode, TKVMap, TStrategy>(observable, options).promise;
}

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
