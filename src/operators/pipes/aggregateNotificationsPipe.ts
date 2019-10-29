import { IObserver } from '../../core/observer/interfaces';
import { INotification } from '../../notifications/core/notification/interfaces';
import { IObservable } from '../../core/observable/interfaces';
import { IPipe } from '../../core/observable-observer/pipe/interfaces';
import { TPipeContextBase } from '../../core/observable-observer/pipe/types';
import { Pipe } from '../../core/observable-observer/pipe/implementation';

/**
 * ObservableObserver: aggregates many notifications by filtering their name - emits the received values
 *  - when a notification is received, the pipe emits the notifications's value if the notification's name is in 'names'
 * @param names
 */
export function aggregateNotificationsPipe<TValue>(names: Iterable<string> | null = null): IPipe<IObserver<INotification<string, any>>, IObservable<TValue>> {
  type TNotification = INotification<string, any>;
  return Pipe.create<TNotification, TValue>((context: TPipeContextBase<TNotification, TValue>) => {
    const inNamesSet: Set<string> | null = (names === null) ? null : new Set<string>(names);
    return {
      onEmit(notification: TNotification): void {
        if ((inNamesSet === null) || inNamesSet.has(notification.name)) {
          context.emit(notification.value);
        }
      }
    };
  });
}



// export function aggregateNotificationsPipe<TKeysIn extends string, TValue>(names: Iterable<TKeysIn> | null = null): IPipe<IObserver<INotification<TKeysIn, TValue>>, IObservable<TValue>> {
//   type TNotification = INotification<TKeysIn, TValue>;
//   return Pipe.create<TNotification, TValue>((context: TPipeContextBase<TNotification, TValue>) => {
//     const inNamesSet: Set<TKeysIn> | null = (names === null) ? null : new Set<TKeysIn>(names);
//     return {
//       onEmit(notification: TNotification): void {
//         if ((inNamesSet === null) || inNamesSet.has(notification.name)) {
//           context.emit(notification.value);
//         }
//       }
//     };
//   });
// }
