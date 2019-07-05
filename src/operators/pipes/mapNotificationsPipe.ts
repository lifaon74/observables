import {
  KeyValueMapGenericConstraint, KeyValueMapKeys, KeyValueMapValues, KVRecord
} from '../../notifications/core/interfaces';
import { IPipe } from '../../core/observable-observer/interfaces';
import { IObserver } from '../../core/observer/interfaces';
import {
  IBaseNotificationsObservable, INotificationsObservableContext, KeyValueMapToNotifications
} from '../../notifications/core/notifications-observable/interfaces';
import { Observer } from '../../core/observer/public';
import { NotificationsObservable } from '../../notifications/core/notifications-observable/public';
import { Pipe } from '../../core/observable-observer/implementation';

/**
 * ObservableObserver: aggregates many notifications by filtering their name - returns a new NotificationsObservable build from outName
 *  - when a notification is received, the pipe emits a new Notification<TKeyOut, KeyValueMapValues<TKVMapIn>> if the notification's name is in inNames
 * @param inNames
 * @param outName
 */
export function mapNotificationsPipe<TKVMapIn extends KeyValueMapGenericConstraint<TKVMapIn>, TKeyOut extends string>(inNames: Iterable<KeyValueMapKeys<TKVMapIn>> | null = null, outName: TKeyOut): IPipe<IObserver<KeyValueMapToNotifications<TKVMapIn>>, IBaseNotificationsObservable<TKeyOut, KeyValueMapValues<TKVMapIn>>> { // Record<TKeyOut, KeyValueMapValues<TKVMapIn>>
  type TKeysIn = KeyValueMapKeys<TKVMapIn>;
  type TValuesOut = KeyValueMapValues<TKVMapIn>;
  type TKVOut = KVRecord<TKeyOut, TValuesOut>;
  type TKeysOut = KeyValueMapKeys<TKVOut>;
  type TNotificationsIn = KeyValueMapToNotifications<TKVMapIn>;

  return new Pipe<IObserver<TNotificationsIn>, IBaseNotificationsObservable<TKeyOut, TValuesOut>>(() => {
    const inNamesSet: Set<TKeysIn> | null = (inNames === null) ? null : new Set<TKeysIn>(inNames);
    let context: INotificationsObservableContext<TKVOut>;
    return {
      observer: new Observer<TNotificationsIn>((notification: TNotificationsIn) => {
        if ((inNamesSet === null) || inNamesSet.has(notification.name as TKeysIn)) {
          context.dispatch(outName as TKeysOut, notification.value);
        }
      }),
      observable: new NotificationsObservable<TKVOut>((_context: INotificationsObservableContext<TKVOut>) => {
        context = _context;
      }),
    };
  });
}

// mapNotificationsPipe<{ [key: string]: number }, 'out'>([], 'out');
// mapNotificationsPipe<{ a: Event, b: UIEvent }, 'out'>([], 'out');
// mapNotificationsPipe<WindowEventMap, string>([], 'a');
// mapNotificationsPipe<any, string>([], 'a');
