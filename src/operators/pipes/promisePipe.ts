import { ICancelToken } from '../../misc/cancel-token/interfaces';
import { IObserver } from '../../core/observer/interfaces';
import {
  IPromiseObservable, TPromiseObservableNotifications
} from '../../notifications/observables/finite-state/promise/promise-observable/interfaces';
import { CancelToken } from '../../misc/cancel-token/implementation';
import { Observer } from '../../core/observer/implementation';
import { PromiseObservable } from '../../notifications/observables/finite-state/promise/promise-observable/implementation';
import { INotification } from '../../notifications/core/notification/interfaces';
import { TPromiseOrValue } from '../../promises/interfaces';
import { IPipe } from '../../core/observable-observer/pipe/interfaces';
import { Pipe } from '../../core/observable-observer/pipe/implementation';

/**
 * ObservableObserver: equivalent of the 'then' of a promise, but for PromiseObservable instead
 *  - when a promise notification is received, applies the 'then' functions (onFulfilled or onErrored) and emits the proper resulting notification to the next PromiseObservable
 * @param onFulfilled
 * @param onRejected
 */

export function promisePipe<T, TResult1 = T, TResult2 = never>(
  onFulfilled: (value: T, token: ICancelToken) => TPromiseOrValue<TResult1> = (value: T) => (value as unknown as TResult1),
  onRejected: (reason: any, token: ICancelToken) => TPromiseOrValue<TResult2> = (error: any) => Promise.reject(error),
): IPipe<
  IObserver<TPromiseObservableNotifications<T>>,
  IPromiseObservable<TResult1 | TResult2>
> {
  return new Pipe<
    IObserver<TPromiseObservableNotifications<T>>,
    IPromiseObservable<TResult1 | TResult2>
  >(() => {
    if (typeof onFulfilled !== 'function') {
      throw new TypeError(`Expected function or void as onFulfilled`);
    }

    if (typeof onRejected !== 'function') {
      throw new TypeError(`Expected function or void as onRejected`);
    }

    let resolve: (value: TPromiseOrValue<TResult1 | TResult2>) => void;
    let reject: (reason: any) => void;
    let token: CancelToken;
    let value: T;

    return {
      observer: new Observer<TPromiseObservableNotifications<T>>((notification: TPromiseObservableNotifications<T>) => {
        if (!token.cancelled) {
          switch (notification.name) {
            case 'next':
              value = notification.value;
              break;
            case 'complete':
              try {
                resolve(onFulfilled(value, token));
              } catch (error) {
                reject(error);
              }
              break;
            case 'error':
              try {
                resolve(onRejected(notification.value, token));
              } catch (error) {
                reject(error);
              }
              break;
            case 'cancel':
              token.cancel(notification.value);
              break;
          }
        }
      }),
      observable: new PromiseObservable<TResult1 | TResult2>((_token: ICancelToken) => {
        token = _token;
        return new Promise<TResult1 | TResult2>((_resolve, _reject) => {
          resolve = _resolve;
          reject = _reject;
        });
      })
    };
  });
}

