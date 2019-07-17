import {
  CompleteStateKeyValueMapConstraint, ICompleteStateObservable, ICompleteStateObservableContext,
  ICompleteStateObservableKeyValueMapGeneric, TCompleteStateObservableCreateCallback,
  TCompleteStateObservableFinalState, TCompleteStateObservableState
} from './interfaces';
import { KeyValueMapToNotifications } from '../../core/notifications-observable/interfaces';
import { IObserver } from '../../../core/observer/interfaces';
import {
  IsCompleteStateObservableFinalNotificationName, ThrowCompleteStateObservableCannotEmitAfterFinalState
} from './implementation';
import { Notification } from '../../core/notification/implementation';


/**
 * A TBuildCompleteStateObservableHookBasedOnFactoryFunctionCallback is a function taking one argument:
 * - emit: a callback function to emit some notifications.
 * And returning a 'clear' function called to interrupt the work / emit
 * INFO: a factory MUST NOT emit any values before it has returned its clear function, nor after the final state.
 */
export type TBuildCompleteStateObservableHookBasedOnFactoryFunctionCallback<T, TKVMap extends CompleteStateKeyValueMapConstraint<T, TKVMap>> =
  (
    this: ICompleteStateObservable<T, TKVMap>,
    emit: (value: KeyValueMapToNotifications<TKVMap>) => void,
  ) => ((this: ICompleteStateObservable<T, TKVMap>) => void);



function ThrowFactoryClearFunctionNull(): never {
  throw new Error(`Cannot emit if the factory has not returned yet or if the 'clear' function has been called`);
}

/**
 * Creates CompleteStateObservableHook based on a 'factory' function
 * 'factory' is called once when the observable is freshly observed and if the observable is in a 'next' state.
 * when the observable is no more observed, calls the 'clear' function of the factory. If the observable is still in a 'next' state, clears the cached values.
 * @param factory
 */
export function BuildCompleteStateObservableHookBasedOnSharedFactoryFunction<T, TKVMap extends CompleteStateKeyValueMapConstraint<T, TKVMap> = ICompleteStateObservableKeyValueMapGeneric<T>>(
  factory: TBuildCompleteStateObservableHookBasedOnFactoryFunctionCallback<T, TKVMap>,
): TCompleteStateObservableCreateCallback<T, TKVMap> {
  return function (context: ICompleteStateObservableContext<T, TKVMap>) {
    let sharedClearFactory: (() => void) | null = null;
    return {
      onObserved(): void {
        const instance: ICompleteStateObservable<T, TKVMap> = this;
        if (
          (instance.observers.length === 1)
          && (sharedClearFactory === null) // optional check
          && (instance.state === 'next')
        ) {
          sharedClearFactory = factory.call(instance, (notification: KeyValueMapToNotifications<TKVMap>) => {
            if (sharedClearFactory === null) {
              ThrowFactoryClearFunctionNull();
            } else {
              context.emit(notification as KeyValueMapToNotifications<TKVMap>);
            }
          });
        }
      },
      onUnobserved(): void {
        const instance: ICompleteStateObservable<T, TKVMap> = this;
        if (
          (sharedClearFactory !== null)  // optional check
          && !instance.observed
        ) {
          if (instance.state === 'next') {
            // clear the cache because the factory has been aborted, so the cache is inconsistent
            context.reset();
          }
          const _sharedClearFactory = sharedClearFactory; // copy ref
          sharedClearFactory = null; // set to null before calling it, preventing to emit inside of _sharedClearFactory
          _sharedClearFactory.call(instance);
        }
      },
    };
  };
}

/**
 * Creates CompleteStateObservableHook based on a 'factory' function
 * 'factory' is called for each observer
 * INFO: this mean that the 'mode' property of the CompleteStateObservable is ignored, and may be seen as a 'cache-all'
 * @param factory
 */
export function BuildCompleteStateObservableHookBasedOnPerObserverFactoryFunction<T, TKVMap extends CompleteStateKeyValueMapConstraint<T, TKVMap> = ICompleteStateObservableKeyValueMapGeneric<T>>(
  factory: TBuildCompleteStateObservableHookBasedOnFactoryFunctionCallback<T, TKVMap>,
): TCompleteStateObservableCreateCallback<T, TKVMap> {
  return function () {
    const observerClearFactory = new WeakMap<IObserver<KeyValueMapToNotifications<TKVMap>>, () => void>();
    return {
      onObserved(observer: IObserver<KeyValueMapToNotifications<TKVMap>>): void {
        const instance: ICompleteStateObservable<T, TKVMap> = this;
        let state: TCompleteStateObservableState = 'next';

        const emit = (notification: KeyValueMapToNotifications<TKVMap>) => {
          const isFinalState: boolean = IsCompleteStateObservableFinalNotificationName(notification.name);
          if (
            (state === 'next')
            || (!isFinalState && (notification.name !== 'next'))
          ) {
            if (observerClearFactory.has(observer)) {
              if (isFinalState) {
                state = notification.name as TCompleteStateObservableFinalState;
              } else if (notification.name === 'reset') {
                state = 'next';
              }
              observer.emit(notification as KeyValueMapToNotifications<TKVMap>, instance);
            } else {
              ThrowFactoryClearFunctionNull();
            }
          } else {
            ThrowCompleteStateObservableCannotEmitAfterFinalState(state, notification.name);
          }
        };

        observerClearFactory.set(observer, factory.call(instance, emit));
      },
      onUnobserved(observer: IObserver<KeyValueMapToNotifications<TKVMap>>): void {
        if (observerClearFactory.has(observer)) { // optional check (should always be true)
          const undoFactory = observerClearFactory.get(observer) as (() => void);
          observerClearFactory.delete(observer); // remove before calling it, preventing to emit inside of undoFactory
          undoFactory.call(this);
        }
      },
    };
  };
}



