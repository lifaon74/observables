import {
  CompleteStateKeyValueMapConstraint, ICompleteStateObservable, ICompleteStateObservableContext,
  ICompleteStateObservableKeyValueMapGeneric,
  TCompleteStateObservableCreateCallback, TCompleteStateObservableLikeNotifications
} from './interfaces';
import {
  KeyValueMapToNotifications
} from '../../core/notifications-observable/interfaces';
import { IObserver } from '../../../core/observer/interfaces';


export type TCompleteStateObservableFactory<T, TKVMap extends CompleteStateKeyValueMapConstraint<T, TKVMap>> =
  (this: ICompleteStateObservable<T, TKVMap>, emit: (value: TCompleteStateObservableLikeNotifications<T>) => void) => (() => void);

export function CompleteStateObservableFactory<T, TKVMap extends CompleteStateKeyValueMapConstraint<T, TKVMap> = ICompleteStateObservableKeyValueMapGeneric<T>>(
  factory: TCompleteStateObservableFactory<T, TKVMap>,
  every: boolean = true
): TCompleteStateObservableCreateCallback<T, TKVMap> {
  return function (context: ICompleteStateObservableContext<T, TKVMap>) {
    const observerUndoFactory = new WeakMap<IObserver<KeyValueMapToNotifications<TKVMap>>, () => void>();
    let sharedUndoFactory: (() => void) | null = null;

    return {
      onObserved(observer: IObserver<KeyValueMapToNotifications<TKVMap>>): void {
        const instance: ICompleteStateObservable<T, TKVMap> = this;
        if (every) {
          observerUndoFactory.set(observer, factory.call(instance, observer.emit.bind(observer)));
        } else {
          if (
            (instance.observers.length === 1)
            && (sharedUndoFactory === null) // optional check
            && (instance.state === 'emitting')
          ) {
            sharedUndoFactory = factory.call(instance, context.emit.bind(context));
          }
        }
      },
      onUnobserved(observer: IObserver<KeyValueMapToNotifications<TKVMap>>): void {
        const instance: ICompleteStateObservable<T, TKVMap> = this;

        if (every) {
          if (observerUndoFactory.has(observer)) { // optional check (should always be true)
            (observerUndoFactory.get(observer) as (() => void))();
            observerUndoFactory.delete(observer);
          }
        } else {
          if (
            (sharedUndoFactory !== null)  // optional check
            && !instance.observed
          ) {
            if (instance.state === 'emitting') {
              // clear the cache because the factory has been aborted, so the cache is inconsistent
              context.clearCache();
            }
            sharedUndoFactory();
            sharedUndoFactory = null;
          }
        }
      },
    };
  };
}


