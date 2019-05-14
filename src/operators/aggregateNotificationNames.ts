import { IPipe, TPipeContextBase } from '../core/observable-observer/interfaces';
import { Pipe } from '../core/observable-observer/implementation';
import { IObserver } from '../core/observer/interfaces';
import { INotification } from '../notifications/core/notification/interfaces';
import {
  IBaseNotificationsObservable, INotificationsObservableContext, KeyValueMapToNotifications
} from '../notifications/core/notifications-observable/interfaces';
import { Observer } from '../core/observer/implementation';
import { NotificationsObservable } from '../notifications/core/notifications-observable/implementation';
import { IObservable } from '../core/observable/interfaces';
import {
  KeyValueMapGenericConstraint, KeyValueMapKeys, KeyValueMapValues, KVRecord
} from '../notifications/core/interfaces';


export function aggregateNotificationNames<Tin extends string, TValue>(inNames: Tin[]): IPipe<IObserver<INotification<Tin, TValue>>, IObservable<TValue>> {
  type TNotification = INotification<Tin, TValue>;
  Object.freeze(inNames);
  return Pipe.create<TNotification, TValue>((context: TPipeContextBase<TNotification, TValue>) => {
    return {
      onEmit(notification: TNotification): void {
        if (inNames.includes(notification.name)) {
          context.emit(notification.value);
        }
      }
    };
  });
}

export function mapNotificationNames<TKVMapIn extends KeyValueMapGenericConstraint<TKVMapIn>, TKeyOut extends string>(inNames: KeyValueMapKeys<TKVMapIn>[], outName: TKeyOut): IPipe<IObserver<KeyValueMapToNotifications<TKVMapIn>>, IBaseNotificationsObservable<TKeyOut, KeyValueMapValues<TKVMapIn>>> { // Record<TKeyOut, KeyValueMapValues<TKVMapIn>>
  type TKVOut = KVRecord<TKeyOut, KeyValueMapValues<TKVMapIn>>;

  Object.freeze(inNames);
  return new Pipe<IObserver<KeyValueMapToNotifications<TKVMapIn>>, IBaseNotificationsObservable<TKeyOut, KeyValueMapValues<TKVMapIn>>>(() => {
    let context: INotificationsObservableContext<TKVOut>;
    return {
      observer: new Observer<KeyValueMapToNotifications<TKVMapIn>>((notification: KeyValueMapToNotifications<TKVMapIn>) => {
        if (inNames.includes(notification.name as KeyValueMapKeys<TKVMapIn>)) {
          context.dispatch(outName as KeyValueMapKeys<TKVOut>, notification.value);
        }
      }),
      observable: new NotificationsObservable<TKVOut>((_context: INotificationsObservableContext<TKVOut>) => {
        context = _context;
      }),
    };
  });
}

// mapNotificationNames<{ [key: string]: number }, 'out'>([], 'out');
// mapNotificationNames<{ a: Event, b: UIEvent }, 'out'>([], 'out');
// mapNotificationNames<WindowEventMap, string>([], 'a');
// mapNotificationNames<any, string>([], 'a');
