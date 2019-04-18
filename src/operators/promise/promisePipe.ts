import { IPromiseCancelToken } from '../../notifications/observables/promise-observable/promise-cancel-token/interfaces';
import { IPipe } from '../../core/observable-observer/interfaces';
import { IObserver } from '../../core/observer/interfaces';
import { IPromiseObservable, TPromiseObservableNotification } from '../../notifications/observables/promise-observable/interfaces';
import { Pipe } from '../../core/observable-observer/implementation';
import { PromiseCancelToken } from '../../notifications/observables/promise-observable/promise-cancel-token/implementation';
import { Observer } from '../../core/observer/implementation';
import { PromiseObservable } from '../../notifications/observables/promise-observable/implementation';
import {INotification} from "../../notifications/core/notification/interfaces";

export function promisePipe<TFulfilledIn, TFulfilledOut = TFulfilledIn, TErroredIn = Error, TErroredOut = TErroredIn, TCancelled = any>(
  onFulfilled?: (value: TFulfilledIn, token: IPromiseCancelToken) => (Promise<TFulfilledOut> | TFulfilledOut),
  onErrored?: (error: TErroredIn, token: IPromiseCancelToken) => (Promise<TFulfilledOut> | TFulfilledOut),
): IPipe<IObserver<TPromiseObservableNotification<TFulfilledIn, TErroredIn, TCancelled>>,
  IPromiseObservable<TFulfilledOut, TErroredOut, TCancelled>> {
  return new Pipe<IObserver<TPromiseObservableNotification<TFulfilledIn, TErroredIn, TCancelled>>,
    IPromiseObservable<TFulfilledOut, TErroredOut, TCancelled>>(() => {
    if (onFulfilled === void 0) {
      onFulfilled = (value: TFulfilledIn) => (value as any);
    } else if (typeof onFulfilled !== 'function') {
      throw new TypeError(`Expected function or void as onFulfilled`);
    }

    if (onErrored === void 0) {
      onErrored = (error: TErroredIn) => {
        return Promise.reject(error);
      };
    } else if (typeof onErrored !== 'function') {
      throw new TypeError(`Expected function or void as onErrored`);
    }

    let resolve: (value: TFulfilledOut | PromiseLike<TFulfilledOut>) => void;
    let reject: (reason: TErroredOut) => void;
    let token: PromiseCancelToken;

    return {
      observer: new Observer<TPromiseObservableNotification<TFulfilledIn, TErroredIn, TCancelled>>((notification: TPromiseObservableNotification<TFulfilledIn, TErroredIn, TCancelled>) => {
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
              throw new Error(`Invalid Notification.name '${(notification as INotification<string, any>).name}'. Expected 'complete', 'error', or 'cancelled'`);
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

