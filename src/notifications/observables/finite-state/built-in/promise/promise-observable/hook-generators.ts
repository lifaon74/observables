import { IFiniteStateObservable } from '../../../interfaces';
import { Notification } from '../../../../../core/notification/implementation';
import { IObserver } from '../../../../../../core/observer/interfaces';
import { INotificationsObserver } from '../../../../../core/notifications-observer/interfaces';
import { FiniteStateObservableHookDefaultOnUnobserved } from '../../../helpers';
import { KeyValueMapToNotifications } from '../../../../../core/notifications-observable/types';
import {
  TFiniteStateObservableCreateCallback, TFiniteStateObservableKeyValueMapGeneric, TFiniteStateObservableMode,
  TFiniteStateObservableState
} from '../../../types';
import { IFiniteStateObservableContext } from '../../../context/interfaces';
import { IPromiseObservableKeyValueMap, TPromiseObservableFactory, TPromiseObservableFinalState } from './types';
import { IAdvancedAbortController } from '../../../../../../misc/advanced-abort-controller/interfaces';
import { AbortReason } from '../../../../../../misc/reason/defaults/abort-reason';
import { AdvancedAbortController } from '../../../../../../misc/advanced-abort-controller/implementation';
import { IAdvancedAbortSignal } from '../../../../../../misc/advanced-abort-controller/advanced-abort-signal/interfaces';


/**
 * Generates an Hook for a FiniteStateObservable, based on a Promise:
 *  - when the Observable is freshly observed, calls the factory
 *  - emits 'next' when the promise is fulfilled, with the incoming value, then emits 'complete'
 *  - emits 'error' if promise is errored
 *  - emits 'abort' if promise is aborted from the factory
 *  - if the FiniteStateObservable is no more observed and the promise is still pending, aborts the signal, and resets the state
 */
export function GenerateFiniteStateObservableHookFromPromise<TValue>(
  promiseFactory: TPromiseObservableFactory<TValue>,
): TFiniteStateObservableCreateCallback<TValue, TPromiseObservableFinalState, TFiniteStateObservableMode, IPromiseObservableKeyValueMap<TValue>> {
  if (typeof promiseFactory !== 'function') {
    throw new TypeError(`Expected function as promiseFactory.`);
  }

  type TFinalState = TPromiseObservableFinalState;
  type TMode = TFiniteStateObservableMode;
  type TKVMap = TFiniteStateObservableKeyValueMapGeneric<TValue, TFinalState>;
  return function (context: IFiniteStateObservableContext<TValue, TFinalState, TMode, TKVMap>) {
    let abortController: IAdvancedAbortController | null = null;
    let signalObserver: INotificationsObserver<'abort', any>;

    const clear = () => {
      if (abortController !== null) {
        signalObserver.deactivate();
        if (!abortController.signal.aborted) {
          abortController.abort(new AbortReason(`Observer stopped observing this promise`));
        }
        abortController = null;
      }
    };

    return {
      onObserved(): void {
        const instance: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap> = this as IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>;
        if (
          (abortController === null)
          && (instance.observers.length === 1) // optional check
          && (instance.state === 'next') // optional check
        ) {
          abortController = new AdvancedAbortController();
          const signal: IAdvancedAbortSignal = abortController.signal; // fix the signal

          signalObserver = signal.addListener('abort', (reason: any) => {
            context.emit(new Notification<'abort', any>('abort', reason));
            clear();
          }).activate();

          (signal.wrapFunction(promiseFactory).call(instance, signal) as Promise<TValue>)
            .then((value: TValue) => {
                if (!signal.aborted) {
                  context.next(value);
                }

                if (!signal.aborted) {
                  context.complete();
                  clear();
                }
              },
              (error: any) => {
                if (!signal.aborted) {
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
  type TKVMap = TFiniteStateObservableKeyValueMapGeneric<TValue, TFinalState>;
  return function () {
    const clearFunctions: WeakMap<IObserver<KeyValueMapToNotifications<TKVMap>>, () => void> = new WeakMap<IObserver<KeyValueMapToNotifications<TKVMap>>, () => void>();

    return {
      onObserved(observer: IObserver<KeyValueMapToNotifications<TKVMap>>): void {
        const instance: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap> = this as IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>;

        let state: TFiniteStateObservableState<TPromiseObservableFinalState> = 'next';
        const abortController: IAdvancedAbortController = new AdvancedAbortController();
        const signal: IAdvancedAbortSignal = abortController.signal;

        function clear() {
          if (clearFunctions.has(observer)) {
            clearFunctions.delete(observer);
            signalObserver.deactivate();
            if (!signal.aborted) {
              abortController.abort(new AbortReason(`Observer stopped observing this promise`));
            }
          }
        }

        const signalObserver = signal.addListener('abort', (reason: any) => {
          observer.emit(new Notification<'abort', any>('abort', reason));
          clear();
        }).activate();

        (signal.wrapFunction(promiseFactory).call(instance, signal) as Promise<TValue>)
          .then((value: TValue) => {
              if (!signal.aborted) {
                observer.emit(new Notification<'next', TValue>('next', value));
              }
              if (!signal.aborted) {
                state = 'complete';
                observer.emit(new Notification<'complete', void>('complete', void 0));
                clear();
              }
            },
            (error: any) => {
              if (!signal.aborted) {
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
