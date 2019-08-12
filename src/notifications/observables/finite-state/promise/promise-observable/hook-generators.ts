import {
  IFiniteStateObservable, IFiniteStateObservableContext, IFiniteStateObservableKeyValueMapGeneric,
  TFiniteStateObservableCreateCallback, TFiniteStateObservableMode, TFiniteStateObservableState
} from '../../interfaces';
import { ICancelToken, TCancelStrategyReturn } from '../../../../../misc/cancel-token/interfaces';
import { CancelReason, CancelToken } from '../../../../../misc/cancel-token/implementation';
import { Notification } from '../../../../core/notification/implementation';
import { IPromiseObservableKeyValueMap, TPromiseObservableFactory, TPromiseObservableFinalState } from './interfaces';
import { IObserver } from '../../../../../core/observer/interfaces';
import { KeyValueMapToNotifications } from '../../../../core/notifications-observable/interfaces';


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

    function clear() {
      if (token !== null) {
        token.cancel(new CancelReason(`Observer stopped observing this promise`));
        token = null;
      }
    }

    return {
      onObserved(): void {
        const instance: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap> = this;
        if (
          (token === null)
          && (instance.observers.length === 1) // optional check
          && (instance.state === 'next') // optional check
        ) {
          token = new CancelToken();

          const _promiseFactory = token.wrapFunction(promiseFactory, {
            strategy: 'never',
            onCancelled: (reason: any, rethrowCancelled: () => Promise<TCancelStrategyReturn<'never'>>) => {
              if (
                (instance.observed)
                && (instance.state === 'next')
              ) {
                context.emit(new Notification<'cancel', TValue>('cancel', reason));
                clear();
              }
              return rethrowCancelled();
            }
          });

          (_promiseFactory.call(instance, token) as Promise<TValue | void>)
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
        const instance: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap> = this;
        if (
          (!instance.observed)
          && (instance.state === 'next')
        ) {
          clear();
          context.clearCache();
        }
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
        const instance: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap> = this;

        let state: TFiniteStateObservableState<TPromiseObservableFinalState> = 'next';
        const token: ICancelToken = new CancelToken();

        function clear() {
          if (clearFunctions.has(observer)) {
            clearFunctions.delete(observer);
            token.cancel(new CancelReason(`Observer stopped observing this promise`));
          }
        }

        const _promiseFactory = token.wrapFunction(promiseFactory, {
          strategy: 'never',
          onCancelled: (reason: any, rethrowCancelled: () => Promise<TCancelStrategyReturn<'never'>>) => {
            if (state === 'next') {
              observer.emit(new Notification<'cancel', TValue>('cancel', reason));
              clear();
            }
            return rethrowCancelled();
          }
        });

        (_promiseFactory.call(instance, token) as Promise<TValue | void>)
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
