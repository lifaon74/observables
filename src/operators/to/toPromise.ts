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
import { IsAdvancedAbortController } from '../../misc/advanced-abort-controller/constructor';
import { INativeCancellablePromiseTuple, TNativePromiseLikeOrValue } from '../../promises/types/native';


export type TBasePromiseObservableNotification<T> = TPromiseObservableNotifications<T>;
export type TValueOrNotificationType<T> = T | TBasePromiseObservableNotification<T>;

export interface IObservableToCancellablePromiseTupleOptions<TStrategy extends TAbortStrategy> extends IAdvancedAbortSignalWrapPromiseOptions<TStrategy, never> {
  controller?: IAdvancedAbortController;
}

function ObservableToCancellablePromiseTupleOptionsToController(options: IObservableToCancellablePromiseTupleOptions<any> = {}): IAdvancedAbortController {
  return IsAdvancedAbortController(options.controller)
    ? options.controller
    : new AdvancedAbortController();
}

/**
 * Returns a tuple composed of :
 *  - a 'promise' (Promise) which resolves when the 'observable' emits a value
 *  - a 'controller' (AdvancedAbortController), used to stop observing 'observable' when aborted
 */
export function genericObservableToCancellablePromiseTuple<T, TStrategy extends TAbortStrategy>(
  observable: IObservable<T>,
  options?: IObservableToCancellablePromiseTupleOptions<TStrategy>,
): INativeCancellablePromiseTuple<T | TInferAbortStrategyReturn<TStrategy>> {
  const controller: IAdvancedAbortController = ObservableToCancellablePromiseTupleOptionsToController(options);
  return {
    promise: controller.signal.wrapPromise<T, TStrategy, never>((resolve: (value?: TNativePromiseLikeOrValue<T>) => void) => {
      const clear = () => {
        observer.deactivate();
        signalObserver.deactivate();
      };

      const signalObserver = controller.signal.addListener('abort', () => {
        clear();
      });

      const observer: IObserver<T> = new Observer<T>((value: T) => {
        clear();
        resolve(value);
      }).observe(observable);

      observer.activate();
      signalObserver.activate();
    }, options),
    controller
  };
}


/**
 * Returns a tuple composed of :
 *  - a 'promise' (Promise) which resolves when the 'observable' emits a 'complete' notification
 *    -> resolved value is an array composed of the values emitted through 'next'
 *  - a 'controller' (AdvancedAbortController), used to stop observing 'observable' when aborted
 */
export function finiteStateObservableToCancellablePromiseTuple<TValue,
  TFinalState extends TFinalStateConstraint<TFinalState>,
  TMode extends TFiniteStateObservableModeConstraint<TMode>,
  TKVMap extends TFiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>,
  TStrategy extends TAbortStrategy>(
  observable: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>,
  options?: IObservableToCancellablePromiseTupleOptions<TStrategy>,
): INativeCancellablePromiseTuple<TValue[] | TInferAbortStrategyReturn<TStrategy>> {
  const controller: IAdvancedAbortController = ObservableToCancellablePromiseTupleOptionsToController(options);
  return {
    promise: controller.signal.wrapPromise<TValue[], TStrategy, never>((resolve: (value?: TNativePromiseLikeOrValue<TValue[]>) => void, reject: (reason?: any) => void) => {
      const values: TValue[] = [];

      const _clear = () => {
        observer.deactivate();
        tokenObserver.deactivate();
      };

      const _resolve = () => {
        _clear();
        resolve(values);
      };

      const _reject = (error: any): void => {
        _clear();
        reject(error);
      };

      const tokenObserver = controller.signal.addListener('abort', () => {
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
          case 'cancel':
            controller.abort(notification.value);
            break;
        }
      }).observe(observable);

      observer.activate();
      tokenObserver.activate();
    }, options),
    controller
  };
}


/**
 * Returns a tuple composed of :
 *  - a 'promise' (Promise) which resolves when the 'observable' emits a 'complete' notification
 *    -> resolved value is the last value emitted through 'next'
 *  - a 'controller' (AdvancedAbortController), used to stop observing 'observable' when aborted
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
    controller: result.controller
  };
}

/**
 * "Converts" an Observable to a Promise and its AdvancedAbortController
 */
export function toCancellablePromiseTuple<T, TStrategy extends TAbortStrategy>(
  observable: TFiniteStateObservableGeneric<T> | IObservable<T>,
  options?: IObservableToCancellablePromiseTupleOptions<TStrategy>,
): INativeCancellablePromiseTuple<T | TInferAbortStrategyReturn<TStrategy> | void> {
  if (IsFiniteStateObservable(observable)) {
    return singleFiniteStateObservableToCancellablePromiseTuple<T, TFiniteStateObservableFinalState, TFiniteStateObservableMode, TFiniteStateObservableKeyValueMapGeneric<T, TFiniteStateObservableFinalState>, TStrategy>(observable, options);
  } else if (IsObservable(observable)) {
    return genericObservableToCancellablePromiseTuple<T, TStrategy>(observable as IObservable<T>, options) as INativeCancellablePromiseTuple<T | TInferAbortStrategyReturn<TStrategy> | void>;
  } else {
    throw new TypeError(`Expected Observable as observable`);
  }
}

/*-------------------------*/

export function genericObservableToPromise<T, TStrategy extends TAbortStrategy>(
  observable: IObservable<T>,
  options?: IObservableToCancellablePromiseTupleOptions<TStrategy>,
): Promise<T | TInferAbortStrategyReturn<TStrategy>> {
  return genericObservableToCancellablePromiseTuple<T, TStrategy>(observable, options).promise;
}


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
  return toCancellablePromiseTuple<T, TStrategy>(observable, options).promise;
}
