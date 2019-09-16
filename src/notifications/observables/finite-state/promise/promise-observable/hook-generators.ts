import {
  IFiniteStateObservable, IFiniteStateObservableContext, IFiniteStateObservableKeyValueMapGeneric,
  TFiniteStateObservableCreateCallback, TFiniteStateObservableMode, TFiniteStateObservableState
} from '../../interfaces';
import { ICancelToken } from '../../../../../misc/cancel-token/interfaces';
import { CancelReason, CancelToken } from '../../../../../misc/cancel-token/implementation';
import { Notification } from '../../../../core/notification/implementation';
import { IPromiseObservableKeyValueMap, TPromiseObservableFactory, TPromiseObservableFinalState } from './interfaces';
import { IObserver } from '../../../../../core/observer/interfaces';
import { KeyValueMapToNotifications } from '../../../../core/notifications-observable/interfaces';
import { INotificationsObserver } from '../../../../core/notifications-observer/interfaces';
import { FiniteStateObservableHookDefaultOnUnobserved } from '../../helpers';


/**
 * Generates an Hook for a FiniteStateObservable, based on a Promise:
 *  - when the Observable is freshly observed, calls the factory
 *  - emits 'next' when the promise if fulfilled with the incoming value, then emits 'complete'
 *  - emits 'error' if promise is errored
 *  - emits 'cancel' if promise is cancelled from the factory
 *  - if the FiniteStateObservable is no more observed and the promise is still pending, cancels the token, and resets the state
 * @param promiseFactory
 */
export function GenerateFiniteStateObservableHookFromPromise<TValue>(
  promiseFactory: TPromiseObservableFactory<TValue>,
): TFiniteStateObservableCreateCallback<TValue, TPromiseObservableFinalState, TFiniteStateObservableMode, IPromiseObservableKeyValueMap<TValue>> {
  if (typeof promiseFactory !== 'function') {
    throw new TypeError(`Expected function as promiseFactory.`);
  }

  type TFinalState = TPromiseObservableFinalState;
  type TMode = TFiniteStateObservableMode;
  type TKVMap = IFiniteStateObservableKeyValueMapGeneric<TValue, TFinalState>;
  return function (context: IFiniteStateObservableContext<TValue, TFinalState, TMode, TKVMap>) {
    let token: ICancelToken | null = null;
    let tokenCancelObserver: INotificationsObserver<'cancel', any>;

    function clear() {
      if (token !== null) {
        tokenCancelObserver.deactivate();
        if (!token.cancelled) {
          token.cancel(new CancelReason(`Observer stopped observing this promise`));
        }
        token = null;
      }
    }

    return {
      onObserved(): void {
        const instance: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap> = this as IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>;
        if (
          (token === null)
          && (instance.observers.length === 1) // optional check
          && (instance.state === 'next') // optional check
        ) {
          token = new CancelToken();

          tokenCancelObserver = token.addListener('cancel', (reason: any) => {
            context.emit(new Notification<'cancel', any>('cancel', reason));
            clear();
          }).activate();

          (token.wrapFunction(promiseFactory).call(instance, token) as Promise<TValue>)
            .then((value: TValue) => {
                if ((token !== null) && !token.cancelled) {
                  context.next(value);
                }

                if ((token !== null) && !token.cancelled) {
                  context.complete();
                  clear();
                }
              },
              (error: any) => {
                if ((token !== null) && !token.cancelled) {
                  context.error(error);
                  clear();
                }
              }
            );
        }
      },
      onUnobserved(): void {
        FiniteStateObservableHookDefaultOnUnobserved<TValue, TFinalState, TMode, TKVMap>(this as IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>, context, clear);
      },
    };
  };
}


export function GenerateFiniteStateObservableHookFromPromiseForEachObservers<TValue>(
  promiseFactory: TPromiseObservableFactory<TValue>,
): TFiniteStateObservableCreateCallback<TValue, TPromiseObservableFinalState, TFiniteStateObservableMode, IPromiseObservableKeyValueMap<TValue>> {
  if (typeof promiseFactory !== 'function') {
    throw new TypeError(`Expected function as promiseFactory.`);
  }

  type TFinalState = TPromiseObservableFinalState;
  type TMode = TFiniteStateObservableMode;
  type TKVMap = IFiniteStateObservableKeyValueMapGeneric<TValue, TFinalState>;
  return function () {
    const clearFunctions: WeakMap<IObserver<KeyValueMapToNotifications<TKVMap>>, () => void> = new WeakMap<IObserver<KeyValueMapToNotifications<TKVMap>>, () => void>();

    return {
      onObserved(observer: IObserver<KeyValueMapToNotifications<TKVMap>>): void {
        const instance: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap> = this as IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>;

        let state: TFiniteStateObservableState<TPromiseObservableFinalState> = 'next';
        const token: ICancelToken = new CancelToken();

        function clear() {
          if (clearFunctions.has(observer)) {
            clearFunctions.delete(observer);
            tokenCancelObserver.deactivate();
            if (!token.cancelled) {
              token.cancel(new CancelReason(`Observer stopped observing this promise`));
            }
          }
        }

        const tokenCancelObserver = token.addListener('cancel', (reason: any) => {
          observer.emit(new Notification<'cancel', any>('cancel', reason));
          clear();
        }).activate();

        (token.wrapFunction(promiseFactory).call(instance, token) as Promise<TValue>)
          .then((value: TValue) => {
              if (!token.cancelled) {
                observer.emit(new Notification<'next', TValue>('next', value));
              }
              if (!token.cancelled) {
                state = 'complete';
                observer.emit(new Notification<'complete', void>('complete', void 0));
                clear();
              }
            },
            (error: any) => {
              if (!token.cancelled) {
                state = 'error';
                observer.emit(new Notification<'error', any>('error', error));
                clear();
              }
            }
          );

        clearFunctions.set(observer, clear);
      },
      onUnobserved(observer: IObserver<KeyValueMapToNotifications<TKVMap>>): void {
        if (clearFunctions.has(observer)) {
          (clearFunctions.get(observer) as () => {})();
        }
      },
    };
  };
}
