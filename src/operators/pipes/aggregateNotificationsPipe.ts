import { IPipe, TPipeContextBase } from '../../core/observable-observer/interfaces';
import { IObserver } from '../../core/observer/interfaces';
import { Pipe } from '../../core/observable-observer/implementation';
import { INotification } from '../../notifications/core/notification/interfaces';
import { IObservable } from '../../core/observable/interfaces';

/**
 * ObservableObserver: aggregates many notifications by filtering their name - simple return the received values
 *  - when a notification is received, the pipe emits the notifications's value if the notification's name is in inNames
 * @param inNames
 */
export function aggregateNotificationsPipe<TKeysIn extends string, TValue>(inNames: Iterable<TKeysIn> | null = null): IPipe<IObserver<INotification<TKeysIn, TValue>>, IObservable<TValue>> {
  type TNotification = INotification<TKeysIn, TValue>;
  return Pipe.create<TNotification, TValue>((context: TPipeContextBase<TNotification, TValue>) => {
    const inNamesSet: Set<TKeysIn> | null = (inNames === null) ? null : new Set<TKeysIn>(inNames);
    return {
      onEmit(notification: TNotification): void {
        if ((inNamesSet === null) || inNamesSet.has(notification.name)) {
          context.emit(notification.value);
        }
      }
    };
  });
}
