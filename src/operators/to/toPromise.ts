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
  IAdvancedAbortSignalWrapPromiseOptions, TAbortStrategy, TInferAbortStrategyReturn
} from '../../misc/advanced-abort-controller/advanced-abort-signal/types';
import { AdvancedAbortController } from '../../misc/advanced-abort-controller/implementation';
import { INativeCancellablePromiseTuple, TNativePromiseLikeOrValue } from '../../promises/types/native';
import { IAdvancedAbortSignal } from '../../misc/advanced-abort-controller/advanced-abort-signal/interfaces';


export type TBasePromiseObservableNotification<T> = TPromiseObservableNotifications<T>;
export type TValueOrNotificationType<T> = T | TBasePromiseObservableNotification<T>;

export interface IObservableToCancellablePromiseTupleOptions<TStrategy extends TAbortStrategy> extends IAdvancedAbortSignalWrapPromiseOptions<TStrategy, never> {
  signal?: IAdvancedAbortSignal;
}


/**
 * Creates a cancellable promise from an Observable
 *  - you may provide an options.signal (IAdvancedAbortSignal) to stop observing 'observable', when the signal is aborted
 * Returns a promise which resolves with the first values emitted by 'observable'
 */
export function genericObservableToPromise<T, TStrategy extends TAbortStrategy>(
  observable: IObservable<T>,
  options?: IObservableToCancellablePromiseTupleOptions<TStrategy>,
): Promise<T | TInferAbortStrategyReturn<TStrategy>> {
  const signal: IAdvancedAbortSignal | undefined = (options === void 0) ? void 0 : options.signal;

  if (signal === void 0) {
    return new Promise<T>((resolve: (value?: TNativePromiseLikeOrValue<T>) => void) => {
      const observer: IObserver<T> = new Observer<T>((value: T) => {
        observer.deactivate();
        resolve(value);
      }).observe(observable);
      observer.activate();
    });
  } else {
    return signal.wrapPromise<T, TStrategy, never>((resolve: (value?: TNativePromiseLikeOrValue<T>) => void) => {
      const clear = () => {
        observer.deactivate();
        signalObserver.deactivate();
      };

      const signalObserver = signal.addListener('abort', () => {
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
}


/**
 * Returns a tuple composed of :
 *  - a 'promise' (Promise) which resolves when the 'observable' emits a 'complete' notification
 *    -> resolved value is an array composed of the values received through 'next'
 *    -> rejected value is the error received through 'error'
 *  - a 'signal' (IAdvancedAbortSignal), which aborts when an 'abort' notification is received
 */
export function finiteStateObservableToCancellablePromiseTuple<TValue,
  TFinalState extends TFinalStateConstraint<TFinalState>,
  TMode extends TFiniteStateObservableModeConstraint<TMode>,
  TKVMap extends TFiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>,
  TStrategy extends TAbortStrategy>(
  observable: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>,
  options?: IObservableToCancellablePromiseTupleOptions<TStrategy>,
): INativeCancellablePromiseTuple<TValue[] | TInferAbortStrategyReturn<TStrategy>> {
  const controller: IAdvancedAbortController = new AdvancedAbortController();
  const signal: IAdvancedAbortSignal = ((options === void 0) || (options.signal === void 0))
    ? new AdvancedAbortController().signal
    : options.signal;

  return {
    promise: controller.signal.wrapPromise<TValue[], TStrategy, never>((resolve: (value?: TNativePromiseLikeOrValue<TValue[]>) => void, reject: (reason?: any) => void) => {
      const values: TValue[] = [];

      const _clear = () => {
        observer.deactivate();
        signalObserver.deactivate();
      };

      const _resolve = () => {
        _clear();
        resolve(values);
      };

      const _reject = (error: any): void => {
        _clear();
        reject(error);
      };

      const signalObserver = signal.addListener('abort', () => {
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
      signalObserver.activate();
    }, options),
    signal: controller.signal
  };
}


/**
 * Like finiteStateObservableToCancellablePromiseTuple but returns the last emitted value of 'observable' instead of an array.
 */
export function singleFiniteStateObservableToCancellablePromiseTuple<TValue,
  TFinalState extends TFinalStateConstraint<TFinalState>,
  TMode extends TFiniteStateObservableModeConstraint<TMode>,
  TKVMap extends TFiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>,
  TStrategy extends TAbortStrategy>(
  observable: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>,
  options?: IObservableToCancellablePromiseTupleOptions<TStrategy>,
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
  options?: IObservableToCancellablePromiseTupleOptions<TStrategy>,
): Promise<TValue[] | TInferAbortStrategyReturn<TStrategy>> {
  return finiteStateObservableToCancellablePromiseTuple<TValue, TFinalState, TMode, TKVMap, TStrategy>(observable, options).promise;
}

export function singleFiniteStateObservableToPromise<TValue,
  TFinalState extends TFinalStateConstraint<TFinalState>,
  TMode extends TFiniteStateObservableModeConstraint<TMode>,
  TKVMap extends TFiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>,
  TStrategy extends TAbortStrategy>(
  observable: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>,
  options?: IObservableToCancellablePromiseTupleOptions<TStrategy>,
): Promise<TValue | TInferAbortStrategyReturn<TStrategy> | void> {
  return singleFiniteStateObservableToCancellablePromiseTuple<TValue, TFinalState, TMode, TKVMap, TStrategy>(observable, options).promise;
}

export function toPromise<T, TStrategy extends TAbortStrategy>(
  observable: TFiniteStateObservableGeneric<T> | IObservable<T>,
  options?: IObservableToCancellablePromiseTupleOptions<TStrategy>,
): Promise<T | TInferAbortStrategyReturn<TStrategy> | void> {
  if (IsFiniteStateObservable(observable)) {
    return singleFiniteStateObservableToPromise<T, TFiniteStateObservableFinalState, TFiniteStateObservableMode, TFiniteStateObservableKeyValueMapGeneric<T, TFiniteStateObservableFinalState>, TStrategy>(observable, options);
  } else if (IsObservable(observable)) {
    return genericObservableToPromise<T, TStrategy>(observable as IObservable<T>, options);
  } else {
    throw new TypeError(`Expected Observable as observable`);
  }
}
