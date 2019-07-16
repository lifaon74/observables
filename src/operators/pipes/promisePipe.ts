import { IPromiseCancelToken } from '../../notifications/observables/complete-state/promise-observable/promise-cancel-token/interfaces';
import { IPipe } from '../../core/observable-observer/interfaces';
import { IObserver } from '../../core/observer/interfaces';
import {
  IPromiseObservable, TPromiseObservableNotifications
} from '../../notifications/observables/complete-state/promise-observable/interfaces';
import { Pipe } from '../../core/observable-observer/implementation';
import { PromiseCancelToken } from '../../notifications/observables/complete-state/promise-observable/promise-cancel-token/implementation';
import { Observer } from '../../core/observer/implementation';
import { PromiseObservable } from '../../notifications/observables/complete-state/promise-observable/implementation';
import { INotification } from '../../notifications/core/notification/interfaces';
import { TPromiseOrValue } from '../../promises/interfaces';

/**
 * ObservableObserver: equivalent of the 'then' of a promise, but for PromiseObservable instead
 *  - when a promise notification is received, applies the 'then' functions (onFulfilled or onErrored) and emits the proper resulting notification to the next PromiseObservable
 * @param onFulfilled
 * @param onErrored
 */
export function promisePipe<TFulfilledIn, TFulfilledOut = TFulfilledIn, TErroredIn = Error, TErroredOut = TErroredIn, TCancelled = any>(
  onFulfilled: (value: TFulfilledIn, token: IPromiseCancelToken) => TPromiseOrValue<TFulfilledOut> = (value: TFulfilledIn) => (value as any),
  onErrored: (error: TErroredIn, token: IPromiseCancelToken) => TPromiseOrValue<TFulfilledOut> = (error: TErroredIn) => Promise.reject(error),
): IPipe<IObserver<TPromiseObservableNotifications<TFulfilledIn, TErroredIn, TCancelled>>,
  IPromiseObservable<TFulfilledOut, TErroredOut, TCancelled>> {
  return new Pipe<IObserver<TPromiseObservableNotifications<TFulfilledIn, TErroredIn, TCancelled>>,
    IPromiseObservable<TFulfilledOut, TErroredOut, TCancelled>>(() => {
    if (typeof onFulfilled !== 'function') {
      throw new TypeError(`Expected function or void as onFulfilled`);
    }

    if (typeof onErrored !== 'function') {
      throw new TypeError(`Expected function or void as onErrored`);
    }

    let resolve: (value: TFulfilledOut | PromiseLike<TFulfilledOut>) => void;
    let reject: (reason: TErroredOut) => void;
    let token: PromiseCancelToken;

    return {
      observer: new Observer<TPromiseObservableNotifications<TFulfilledIn, TErroredIn, TCancelled>>((notification: TPromiseObservableNotifications<TFulfilledIn, TErroredIn, TCancelled>) => {
        if (!token.cancelled) {
          switch (notification.name) {
            case 'complete':
              try {
                resolve(onFulfilled(notification.value as any, token));
              } catch (error) {
                reject(error);
              }
              break;
            case 'error':
              try {
                resolve(onErrored(notification.value as any, token));
              } catch (error) {
                reject(error);
              }
              break;
            case 'cancel':
              token.cancel(notification.value as any);
              break;
            default:
              throw new Error(`Invalid Notification.name '${ (notification as INotification<string, any>).name }'. Expected 'complete', 'error', or 'cancelled'`);
          }
        }
      }),
      observable: new PromiseObservable<TFulfilledOut, TErroredOut, TCancelled>((_token: IPromiseCancelToken) => {
        token = _token;
        return new Promise<TFulfilledOut>((_resolve, _reject) => {
          resolve = _resolve;
          reject = _reject;
        });
      })
    };
  });
}

