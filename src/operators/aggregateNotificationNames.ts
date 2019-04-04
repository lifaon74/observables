import { IPipe, IPipeContext } from '../core/observable-observer/interfaces';
import { Pipe } from '../core/observable-observer/implementation';
import { IObserver } from '../core/observer/interfaces';
import { INotification } from '../notifications/core/notification/interfaces';
import { INotificationsObservable, INotificationsObservableContext} from '../notifications/core/notifications-observable/interfaces';
import { Observer } from '../core/observer/implementation';
import { NotificationsObservable } from '../notifications/core/notifications-observable/implementation';
import { IObservable } from '../core/observable/interfaces';



export function aggregateNotificationNames<Tin extends string, TValue>(inNames: Tin[]): IPipe<IObserver<INotification<Record<Tin, TValue>>>, IObservable<TValue>> {
  type TNotification = INotification<Record<Tin, TValue>>;
  Object.freeze(inNames);
  return Pipe.create<TNotification, TValue>((context: IPipeContext<TNotification, TValue>) => {
    return {
      onEmit(notification: TNotification): void {
        if (inNames.includes(notification.name)) {
          context.emit(notification.value);
        }
      }
    };
  });
}
export type TMapNotificationNames<TKeyOut extends keyof any, TValue> = {
  [P in TKeyOut]: TValue;
};

// export function mapNotificationNames<TKVMapIn extends TKeyValueMap, TKeyOut extends string, TValueOut>(inNames: Tin[], outName: Tout): IPipe<IObserver<INotification<Tin, TValue>>, INotificationsObservable<Tout, TValue>> {
export function mapNotificationNames<TKeyIn extends string, TKeyOut extends string, TValue>(inNames: TKeyIn[], outName: TKeyOut): IPipe<IObserver<INotification<TMapNotificationNames<TKeyIn, TValue>>>, INotificationsObservable<TMapNotificationNames<TKeyOut, TValue>>> {
  type TKVIn = TMapNotificationNames<TKeyIn, TValue>;
  type TKVOut = TMapNotificationNames<TKeyOut, TValue>;
  Object.freeze(inNames);
  return new Pipe<IObserver<INotification<TKVIn>>, INotificationsObservable<TKVOut>>(() => {
    let context: INotificationsObservableContext<TKVOut>;
    return {
      observer: new Observer((notification: INotification<TKVIn>) => {
        if (inNames.includes(notification.name)) {
          context.dispatch(outName, notification.value);
        }
      }),
      observable: new NotificationsObservable<TKVOut>((_context: INotificationsObservableContext<TKVOut>) => {
        context = _context;
      }),
    };
  });
}