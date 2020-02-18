import { IObserver } from '../../core/observer/interfaces';
import { IPromiseObservable } from '../../notifications/observables/finite-state/built-in/promise/promise-observable/interfaces';
import { Observer } from '../../core/observer/implementation';
import { PromiseObservable } from '../../notifications/observables/finite-state/built-in/promise/promise-observable/implementation';
import { TPromiseOrValue } from '../../promises/type-helpers';
import { IPipe } from '../../core/observable-observer/pipe/interfaces';
import { Pipe } from '../../core/observable-observer/pipe/implementation';
import { TPromiseObservableNotifications } from '../../notifications/observables/finite-state/built-in/promise/promise-observable/types';
import { IAdvancedAbortController } from '../../misc/advanced-abort-controller/interfaces';
import { IAdvancedAbortSignal } from '../../misc/advanced-abort-controller/advanced-abort-signal/interfaces';
import { AdvancedAbortController } from '../../misc/advanced-abort-controller/implementation';

/**
 * ObservableObserver: equivalent of the 'then' of a promise, but for PromiseObservable instead
 *  - when a promise notification is received, applies the 'then' functions (onFulfilled or onErrored) and emits the proper resulting notification to the next PromiseObservable
 */
export function promisePipe<T, TResult1 = T, TResult2 = never>(
  onFulfilled: (value: T, signal: IAdvancedAbortSignal) => TPromiseOrValue<TResult1> = (value: T) => (value as unknown as TResult1),
  onRejected: (reason: any, signal: IAdvancedAbortSignal) => TPromiseOrValue<TResult2> = (error: any) => Promise.reject(error),
): IPipe<IObserver<TPromiseObservableNotifications<T>>,
  IPromiseObservable<TResult1 | TResult2>> {
  return new Pipe<IObserver<TPromiseObservableNotifications<T>>,
    IPromiseObservable<TResult1 | TResult2>>(() => {
    if (typeof onFulfilled !== 'function') {
      throw new TypeError(`Expected function or void as onFulfilled`);
    }

    if (typeof onRejected !== 'function') {
      throw new TypeError(`Expected function or void as onRejected`);
    }

    let resolve: (value: TPromiseOrValue<TResult1 | TResult2>) => void;
    let reject: (reason: any) => void;
    let controller: IAdvancedAbortController;
    let value: T;

    return {
      observer: new Observer<TPromiseObservableNotifications<T>>((notification: TPromiseObservableNotifications<T>) => {
        if (!controller.signal.aborted) {
          switch (notification.name) {
            case 'next':
              value = notification.value;
              break;
            case 'complete':
              try {
                resolve(onFulfilled(value, controller.signal));
              } catch (error) {
                reject(error);
              }
              break;
            case 'error':
              try {
                resolve(onRejected(notification.value, controller.signal));
              } catch (error) {
                reject(error);
              }
              break;
            case 'abort':
              controller.abort(notification.value);
              break;
          }
        }
      }),
      observable: new PromiseObservable<TResult1 | TResult2>((signal: IAdvancedAbortSignal) => {
        controller = AdvancedAbortController.fromAbortSignals(signal);
        return new Promise<TResult1 | TResult2>((_resolve, _reject) => {
          resolve = _resolve;
          reject = _reject;
        });
      })
    };
  });
}

