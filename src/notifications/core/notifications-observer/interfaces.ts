import { INotification } from '../notification/interfaces';
import { IObserver } from '../../../core/observer/interfaces';
import { KeyValueMapGeneric, KeyValueMapKeys, KeyValueMapValues } from '../interfaces';

export interface INotificationsObserverConstructor {
  new<TKVMap extends KeyValueMapGeneric>(name: KeyValueMapKeys<TKVMap>, callback: TNotificationsObserverCallback<TKVMap>): INotificationsObserver<TKVMap>;
}

// export interface INotificationsObserverTypedConstructor<N extends string, T> {
//   new(name: N, callback: (value: T) => void): INotificationsObserver<N, T>;
// }

/**
 * A NotificationsObserver is an Observer filtering its incoming Notifications.
 * If the Notification has the same name than the Observer, then 'callback' is called with the Notification's value
 */
export interface INotificationsObserver<TKVMap extends KeyValueMapGeneric> extends IObserver<INotification<TKVMap>> {
  // the name to filter incoming notifications
  readonly name: KeyValueMapKeys<TKVMap>;
  // the callback to call when notification passes the "name" filter
  readonly callback: TNotificationsObserverCallback<TKVMap>;

  // returns true if "name" and "callback" are the same than this Observer's name and callback
  matches(name: string, callback?: (value: any) => void): boolean;
}

export type TNotificationsObserverCallback<TKVMap extends KeyValueMapGeneric> = (value: KeyValueMapValues<TKVMap>) => void;

export interface INotificationsObserverLike<TKVMap extends KeyValueMapGeneric> {
  name: KeyValueMapKeys<TKVMap>;
  callback: TNotificationsObserverCallback<TKVMap>;
}

export type TPickNotificationsObserver<TKVMap, K extends keyof TKVMap> = INotificationsObserver<Pick<TKVMap, K>>;
export type TRecordNotificationsObserver<K extends string, T> = INotificationsObserver<{ [_K in K]: T }>;
