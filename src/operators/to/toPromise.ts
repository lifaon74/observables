import { TPromiseObservableNotifications } from '../../notifications/observables/finite-state/promise/promise-observable/interfaces';
import { IObservable } from '../../core/observable/interfaces';
import { CancelToken } from '../../misc/cancel-token/implementation';
import {
  ICancelToken, TCancelStrategy, TCancelStrategyReturn
} from '../../misc/cancel-token/interfaces';
import { Observer } from '../../core/observer/implementation';
import { ICancellablePromiseTuple, TPromiseOrValue } from '../../promises/interfaces';
import {
  FinalStateConstraint,
  FiniteStateKeyValueMapConstraint, FiniteStateObservableModeConstraint, IFiniteStateObservable,
  IFiniteStateObservableKeyValueMapGeneric, TFiniteStateObservableFinalState, TFiniteStateObservableGeneric,
  TFiniteStateObservableMode
} from '../../notifications/observables/finite-state/interfaces';
import { KeyValueMapToNotifications } from '../../notifications/core/notifications-observable/interfaces';
import { IObserver } from '../../core/observer/interfaces';
import { IsFiniteStateObservable } from '../../notifications/observables/finite-state/implementation';
import { IsObservable } from '../../core/observable/implementation';


export type TBasePromiseObservableNotification<T> = TPromiseObservableNotifications<T>;
export type TValueOrNotificationType<T> = T | TBasePromiseObservableNotification<T>;

/**
 * Observes an Observable through a Promise.
 * The promise is resolved as soon as the observable emits a value.
 * @param observable
 * @param strategy
 * @param token
 * @return a tuple: The Promise, and a CancelToken.
 */
export function genericObservableToCancellablePromiseTuple<T, TStrategy extends TCancelStrategy>(
  observable: IObservable<T>,
  strategy?: TStrategy,
  token: ICancelToken = new CancelToken()
): ICancellablePromiseTuple<T | TCancelStrategyReturn<TStrategy>> {
  return {
    promise: token.wrapPromise<T, TStrategy, never>((resolve: (value?: TPromiseOrValue<T>) => void) => {
      const _clear = () => {
        observer.deactivate();
        tokenObserver.deactivate();
      };

      const tokenObserver = token.addListener('cancel', () => {
        _clear();
      });

      const observer: IObserver<T> = new Observer<T>((value: T) => {
        _clear();
        resolve(value);
      }).observe(observable);

      observer.activate();
      tokenObserver.activate();
    }, { strategy }),
    token: token
  };
}


/**
 * Observes an FiniteStateObservable through a Promise.
 *  Accumulates values until 'complete' or 'next' is found
 * @param observable
 * @param strategy
 * @param token
 */
export function finiteStateObservableToCancellablePromiseTuple<
  TValue,
  TFinalState extends FinalStateConstraint<TFinalState>,
  TMode extends FiniteStateObservableModeConstraint<TMode>,
  TKVMap extends FiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>,
  TStrategy extends TCancelStrategy
>(
  observable: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>,
  strategy?: TStrategy,
  token: ICancelToken = new CancelToken()
): ICancellablePromiseTuple<TValue[] | TCancelStrategyReturn<TStrategy>> {
  return {
    promise: token.wrapPromise<TValue[], TStrategy, never>((resolve: (value?: TPromiseOrValue<TValue[]>) => void, reject: (reason?: any) => void) => {
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

      const tokenObserver = token.addListener('cancel', () => {
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
            token.cancel(notification.value);
            break;
        }
      }).observe(observable);

      observer.activate();
      tokenObserver.activate();
    },{ strategy }),
    token: token
  };
}

export function singleFiniteStateObservableToCancellablePromiseTuple<
  TValue,
  TFinalState extends FinalStateConstraint<TFinalState>,
  TMode extends FiniteStateObservableModeConstraint<TMode>,
  TKVMap extends FiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>,
  TStrategy extends TCancelStrategy
>(
  observable: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>,
  strategy?: TStrategy,
  token?: ICancelToken
): ICancellablePromiseTuple<TValue | TCancelStrategyReturn<TStrategy> | void> {
  const result: ICancellablePromiseTuple<TValue[] | TCancelStrategyReturn<TStrategy>> = finiteStateObservableToCancellablePromiseTuple<TValue, TFinalState, TMode, TKVMap, TStrategy>(observable, strategy, token);
  return {
    promise: result.promise.then((result: TValue[] | TCancelStrategyReturn<TStrategy>) => {
      if (Array.isArray(result) && (result.length > 0)) {
        return result[result.length - 1];
      } else {
        return void 0;
      }
    }),
    token: result.token
  };
}


export function toCancellablePromiseTuple<T, TStrategy extends TCancelStrategy>(
  observable: TFiniteStateObservableGeneric<T> | IObservable<T>,
  strategy?: TStrategy,
  token?: ICancelToken
): ICancellablePromiseTuple<T | TCancelStrategyReturn<TStrategy> | void> {
  if (IsFiniteStateObservable(observable)) {
    return singleFiniteStateObservableToCancellablePromiseTuple<T, TFiniteStateObservableFinalState, TFiniteStateObservableMode, IFiniteStateObservableKeyValueMapGeneric<T, TFiniteStateObservableFinalState>, TStrategy>(observable, strategy, token);
  } else if (IsObservable(observable)) {
    return genericObservableToCancellablePromiseTuple<T, TStrategy>(observable as IObservable<T>, strategy, token);
  } else {
    throw new TypeError(`Expected Observable as observable`);
  }
}

/*-------------------------*/

export function genericObservableToPromise<T, TStrategy extends TCancelStrategy>(
  observable: IObservable<T>,
  strategy?: TStrategy,
  token?: ICancelToken
): Promise<T | TCancelStrategyReturn<TStrategy>> {
  return genericObservableToCancellablePromiseTuple<T, TStrategy>(observable, strategy, token).promise;
}


export function finiteStateObservableToPromise<
  TValue, TFinalState extends FinalStateConstraint<TFinalState>,
  TMode extends FiniteStateObservableModeConstraint<TMode>,
  TKVMap extends FiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>,
  TStrategy extends TCancelStrategy
>(
  observable: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>,
  strategy?: TStrategy,
  token?: ICancelToken
): Promise<TValue[] | TCancelStrategyReturn<TStrategy>> {
  return finiteStateObservableToCancellablePromiseTuple<TValue, TFinalState, TMode, TKVMap, TStrategy>(observable, strategy, token).promise;
}

export function singleFiniteStateObservableToPromise<
  TValue, TFinalState extends FinalStateConstraint<TFinalState>,
  TMode extends FiniteStateObservableModeConstraint<TMode>,
  TKVMap extends FiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>,
  TStrategy extends TCancelStrategy
>(
  observable: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>,
  strategy?: TStrategy,
  token?: ICancelToken
): Promise<TValue | TCancelStrategyReturn<TStrategy> | void> {
  return singleFiniteStateObservableToCancellablePromiseTuple<TValue, TFinalState, TMode, TKVMap, TStrategy>(observable, strategy, token).promise;
}

export function toPromise<T, TStrategy extends TCancelStrategy>(
  observable: TFiniteStateObservableGeneric<T> | IObservable<T>,
  strategy?: TStrategy,
  token?: ICancelToken
): Promise<T | TCancelStrategyReturn<TStrategy> | void> {
  return toCancellablePromiseTuple<T, TStrategy>(observable, strategy, token).promise;
}
