import { TPromiseObservableNotifications } from '../../notifications/observables/complete-state/promise/promise-observable/interfaces';
import { IObservable } from '../../core/observable/interfaces';
import { PromiseCancelToken } from '../../notifications/observables/complete-state/promise/promise-cancel-token/implementation';
import {
  IPromiseCancelToken, TCancelStrategy
} from '../../notifications/observables/complete-state/promise/promise-cancel-token/interfaces';
import { Observer } from '../../core/observer/implementation';
import { ICancellablePromiseTuple, TPromiseOrValue } from '../../promises/interfaces';
import {
  CompleteStateKeyValueMapConstraint, ICompleteStateObservable, ICompleteStateObservableKeyValueMapGeneric
} from '../../notifications/observables/complete-state/interfaces';
import { KeyValueMapToNotifications } from '../../notifications/core/notifications-observable/interfaces';
import { IObserver } from '../../core/observer/interfaces';
import { IsCompleteStateObservable } from '../../notifications/observables/complete-state/implementation';
import { IsObservable } from '../../core/observable/implementation';


export type TBasePromiseObservableNotification<T> = TPromiseObservableNotifications<T>;
export type TValueOrNotificationType<T> = T | TBasePromiseObservableNotification<T>;

/**
 * Observes an Observable through a Promise.
 * The promise is resolved as soon as the observable emits a value.
 * @param observable
 * @param strategy
 * @param token
 * @return a tuple: The Promise, and a PromiseCancelToken.
 */
export function genericObservableToCancellablePromiseTuple<T>(
  observable: IObservable<T>,
  strategy?: TCancelStrategy,
  token: IPromiseCancelToken = new PromiseCancelToken()
): ICancellablePromiseTuple<T | void> {
  return {
    promise: token.wrapPromise<T>((resolve: (value?: TPromiseOrValue<T>) => void) => {
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
    }, strategy),
    token: token
  };
}


/**
 * Observes an CompleteStateObservable through a Promise.
 *  Accumulates values until 'complete' or 'next' is found
 * @param observable
 * @param strategy
 * @param token
 */
export function completeStateObservableToCancellablePromiseTuple<T, TKVMap extends CompleteStateKeyValueMapConstraint<T, TKVMap> = ICompleteStateObservableKeyValueMapGeneric<T>>(
  observable: ICompleteStateObservable<T, TKVMap>,
  strategy?: TCancelStrategy,
  token: IPromiseCancelToken = new PromiseCancelToken()
): ICancellablePromiseTuple<T[] | void> {
  return {
    promise: token.wrapPromise<T[]>((resolve: (value?: TPromiseOrValue<T[]>) => void, reject: (reason?: any) => void) => {
      const values: T[] = [];

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
          case 'reset':
            values.length = 0;
            break;
          case 'cancel':
            token.cancel(notification.value);
            break;
        }
      }).observe(observable);

      observer.activate();
      tokenObserver.activate();
    }, strategy),
    token: token
  };
}

export function singleCompleteStateObservableToCancellablePromiseTuple<T, TKVMap extends CompleteStateKeyValueMapConstraint<T, TKVMap> = ICompleteStateObservableKeyValueMapGeneric<T>>(
  observable: ICompleteStateObservable<T, TKVMap>,
  strategy?: TCancelStrategy,
  token?: IPromiseCancelToken
): ICancellablePromiseTuple<T | void> {
  const result: ICancellablePromiseTuple<T[] | void> = completeStateObservableToCancellablePromiseTuple<T, TKVMap>(observable, strategy, token);
  return {
    promise: result.promise.then((result: T[] | void) => {
      if (Array.isArray(result) && (result.length > 0)) {
        return result[result.length - 1];
      } else {
        return void 0;
      }
    }),
    token: result.token
  };
}


export function toCancellablePromiseTuple<T>(
  observable: IObservable<T> | ICompleteStateObservable<T>,
  strategy?: TCancelStrategy,
  token?: IPromiseCancelToken
): ICancellablePromiseTuple<T | void> {
  if (IsCompleteStateObservable(observable)) {
    return singleCompleteStateObservableToCancellablePromiseTuple<T>(observable, strategy, token);
  } else if (IsObservable(observable)) {
    return genericObservableToCancellablePromiseTuple<T>(observable as IObservable<T>, strategy, token);
  } else {
    throw new TypeError(`Expected Observable as observable`);
  }
}

/*-------------------------*/

export function genericObservableToPromise<T>(
  observable: IObservable<T>,
  strategy?: TCancelStrategy,
  token?: IPromiseCancelToken
): Promise<T | void> {
  return genericObservableToCancellablePromiseTuple<T>(observable, strategy, token).promise;
}


export function completeStateObservableToPromise<T, TKVMap extends CompleteStateKeyValueMapConstraint<T, TKVMap> = ICompleteStateObservableKeyValueMapGeneric<T>>(
  observable: ICompleteStateObservable<T, TKVMap>,
  strategy?: TCancelStrategy,
  token?: IPromiseCancelToken
): Promise<T[] | void> {
  return completeStateObservableToCancellablePromiseTuple<T, TKVMap>(observable, strategy, token).promise;
}

export function singleCompleteStateObservableToPromise<T, TKVMap extends CompleteStateKeyValueMapConstraint<T, TKVMap> = ICompleteStateObservableKeyValueMapGeneric<T>>(
  observable: ICompleteStateObservable<T, TKVMap>,
  strategy?: TCancelStrategy,
  token?: IPromiseCancelToken
): Promise<T | void> {
  return singleCompleteStateObservableToCancellablePromiseTuple<T, TKVMap>(observable, strategy, token).promise;
}

export function toPromise<T>(
  observable: IObservable<T> | ICompleteStateObservable<T>,
  strategy?: TCancelStrategy,
  token?: IPromiseCancelToken
): Promise<T | void> {
  return toCancellablePromiseTuple<T>(observable, strategy, token).promise;
}
