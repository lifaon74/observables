import { TCancellablePromiseTuple, TPromiseObservableNotification } from '../../notifications/observables/promise-observable/interfaces';
import { Notification } from '../../notifications/core/notification/implementation';
import { IObservable } from '../../core/observable/interfaces';
import { PromiseCancelError, PromiseCancelToken } from '../../notifications/observables/promise-observable/promise-cancel-token/implementation';
import { IPromiseCancelToken } from '../../notifications/observables/promise-observable/promise-cancel-token/interfaces';
import { Observer } from '../../core/observer/implementation';
import { INotificationsObserver } from '../../notifications/core/notifications-observer/interfaces';

export type TBasePromiseObservableNotification<T> = TPromiseObservableNotification<T, any, any>;
export type TValueOrNotificationType<T> = T | TBasePromiseObservableNotification<T>;

/**
 * Observes an Observable through a Promise.
 *  If the Observable sends a Notification, 'complete' or 'error' is expected as "name", and the promise is resolved of rejected.
 *  If the Observable sends a value, the promise is resolved with this value.
 * @param observable
 * @return a tuple: The Promise, and a PromiseCancelToken.
 */
export function toCancellablePromise<T>(observable: IObservable<TBasePromiseObservableNotification<T>> | IObservable<T>): TCancellablePromiseTuple<T> {
  const token: IPromiseCancelToken = new PromiseCancelToken();
  return [
    new Promise<T>((resolve: any, reject: any) => {
      if (token.cancelled) {
        reject(new PromiseCancelError());
      } else {
        const _clear = () => {
          observer.deactivate();
          tokenObserver.deactivate();
        };

        const _resolve = (value: T) => {
          _clear();
          resolve(value);
        };

        const _reject = (error: any): void => {
          _clear();
          reject(error);
        };

        const observer = new Observer<TValueOrNotificationType<T>>((value: TValueOrNotificationType<T>) => {
          if (value instanceof Notification) {
            switch (value.name) {
              case 'complete':
                _resolve(value.value);
                break;
              case 'error':
                _reject(value.value);
                break;
              case 'cancel':
                token.cancel(value.value);
                break;
              default:
                throw new Error(`Invalid Notification.name '${value.name}'. Expected 'complete', 'error', or 'cancelled'`);
            }
          } else {
            _resolve(value as T);
          }
        })
            .observe(observable)
            .activate();

        const tokenObserver: INotificationsObserver<'cancel', void> = token.addListener('cancel', () => {
          _reject(new PromiseCancelError());
        }).activate();
      }
    }),
    token
  ];
}

export function toPromise<T>(observable: IObservable<TBasePromiseObservableNotification<T>> | IObservable<T>): Promise<T> {
  return toCancellablePromise<T>(observable)[0];
}
