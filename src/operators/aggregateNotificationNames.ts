import { IObservableObserver, IPipe, IPipeContext, TPipeContextBase } from '../core/observable-observer/interfaces';
import { Pipe } from '../core/observable-observer/implementation';
import { IObserver } from '../core/observer/interfaces';
import { INotification } from '../notifications/core/notification/interfaces';
import { IBaseNotificationsObservable, INotificationsObservable, INotificationsObservableContext, KeyValueMapToNotifications } from '../notifications/core/notifications-observable/interfaces';
import { Observer } from '../core/observer/implementation';
import { NotificationsObservable } from '../notifications/core/notifications-observable/implementation';
import { IObservable, TObservableObservedByResultNonCyclic } from '../core/observable/interfaces';
import { KeyValueMap, KeyValueMapGeneric, KeyValueMapKeys, KeyValueMapValues } from '../notifications/core/interfaces';



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


// export type TMapNotificationNames<TKeyOut extends keyof any, TValue> = {
//   [P in TKeyOut]: TValue;
// };
//
// export type A<TKeyIn extends string[], TValue> = {
//   [K in keyof TKeyIn]: INotification<TKeyIn[K]>;
// };
//
// // export function mapNotificationNames<TKVMapIn extends TKeyValueMap, TKeyOut extends string, TValueOut>(inNames: Tin[], outName: Tout): IPipe<IObserver<INotification<Tin, TValue>>, INotificationsObservable<Tout, TValue>> {
// export function mapNotificationNames<TKeyIn extends string[], TKeyOut extends string, TValue>(inNames: TKeyIn, outName: TKeyOut): IPipe<IObserver<INotification<TKeyIn, TValue>>, INotificationsObservable<Record<string, TValue>>> { // Record<TKeyOut, TValue>
//   type TKVOut = TMapNotificationNames<TKeyOut, TValue>;
//   Object.freeze(inNames);
//   return new Pipe<IObserver<INotification<TKVIn>>, INotificationsObservable<TKVOut>>(() => {
//     let context: INotificationsObservableContext<TKVOut>;
//     return {
//       observer: new Observer((notification: INotification<TKVIn>) => {
//         if (inNames.includes(notification.name)) {
//           context.dispatch(outName, notification.value);
//         }
//       }),
//       observable: new NotificationsObservable<TKVOut>((_context: INotificationsObservableContext<TKVOut>) => {
//         context = _context;
//       }),
//     };
//   });
// }

// type B<U extends string> = IPipe<any, IBaseNotificationsObservable<U, any>>;
// type B<U extends string> = IPipe<any, INotificationsObservable<U, any>>;

// export type A<TKVMap, T> = Extract<keyof TKVMap, string> extends never ? never : {
//   [K in Extract<keyof TKVMap, string>]: T;
// };

// const a: WindowEventMap extends { [key: string]: any } ? true: false;
// const a: { [key: number]: any } extends { [key: string]: any } ? true: false;
// const a: { [key: number]: any } extends object ? true: false;
// const a: { [key: number]: any } extends Omit<{}, any> ? true: false;
// const a: keyof {};
//
// export function mapNotificationNames<TKVMapIn extends KVMapConstraint<TKVMapIn, Event>, TKeyOut extends string>(inNames: KeyValueMapKeys<TKVMapIn>[], outName: TKeyOut): IPipe<IObserver<KeyValueMapToNotifications<TKVMapIn>>, IBaseNotificationsObservable<TKeyOut, KeyValueMapValues<TKVMapIn>>> { // Record<TKeyOut, KeyValueMapValues<TKVMapIn>>
//   type TKVOut = Record<TKeyOut, KeyValueMapValues<TKVMapIn>>;
//
//   Object.freeze(inNames);
//   return new Pipe<IObserver<KeyValueMapToNotifications<TKVMapIn>>, IBaseNotificationsObservable<TKeyOut, KeyValueMapValues<TKVMapIn>>>(() => {
//     let context: INotificationsObservableContext<TKVOut>;
//     return {
//       observer: new Observer<KeyValueMapToNotifications<TKVMapIn>>((notification: KeyValueMapToNotifications<TKVMapIn>) => {
//         if (inNames.includes(notification.name as string)) {
//           context.dispatch(outName, notification.value);
//         }
//       }),
//       observable: new NotificationsObservable<TKVOut>((_context: INotificationsObservableContext<TKVOut>) => {
//         context = _context;
//       }),
//     };
//   });
// }
//
// mapNotificationNames<{ [key: string]: number }, string>([], 'a');
// mapNotificationNames<{ a: Event, b: UIEvent }, string>([], 'a');
// mapNotificationNames<WindowEventMap, string>([], 'a');
// mapNotificationNames<any, string>([], 'a');