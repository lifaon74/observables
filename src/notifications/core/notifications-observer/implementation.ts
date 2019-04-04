import { INotification } from '../notification/interfaces';
import { IObserverInternal, Observer, } from '../../../core/observer/implementation';
import { ConstructClassWithPrivateMembers } from '../../../misc/helpers/ClassWithPrivateMembers';
import { INotificationsObserver, TNotificationsObserverCallback } from './interfaces';
import { INotificationsObserverLike } from './interfaces';
import { KeyValueMapGeneric, KeyValueMapKeys } from '../interfaces';


export const NOTIFICATIONS_OBSERVER_PRIVATE = Symbol('notifications-observer-private');

export interface INotificationsObserverPrivate<TKVMap extends KeyValueMapGeneric> {
  name: KeyValueMapKeys<TKVMap>;
  callback: TNotificationsObserverCallback<TKVMap>;
}

export interface INotificationsObserverInternal<TKVMap extends KeyValueMapGeneric> extends INotificationsObserver<TKVMap>, IObserverInternal<INotification<TKVMap>> {
  [NOTIFICATIONS_OBSERVER_PRIVATE]: INotificationsObserverPrivate<TKVMap>;
}

export function ConstructNotificationsObserver<TKVMap extends KeyValueMapGeneric>(observer: INotificationsObserver<TKVMap>, name: KeyValueMapKeys<TKVMap>, callback: TNotificationsObserverCallback<TKVMap>): void {
  ConstructClassWithPrivateMembers(observer, NOTIFICATIONS_OBSERVER_PRIVATE);
  (observer as INotificationsObserverInternal<TKVMap>)[NOTIFICATIONS_OBSERVER_PRIVATE].name = name;
  (observer as INotificationsObserverInternal<TKVMap>)[NOTIFICATIONS_OBSERVER_PRIVATE].callback = callback.bind(observer);
}

export function NotificationsObserverEmit<TKVMap extends KeyValueMapGeneric>(observer: INotificationsObserver<TKVMap>, notification: INotification<TKVMap>): void {
  if (notification.name === (observer as any)[NOTIFICATIONS_OBSERVER_PRIVATE].name) {
    (observer as INotificationsObserverInternal<TKVMap>)[NOTIFICATIONS_OBSERVER_PRIVATE].callback(notification.value);
  }
}

/**
 * Returns true if 'value' is a NotificationsObserver
 * @param value
 */
export function IsNotificationsObserver(value: any): boolean {
  return (typeof value === 'object')
    && (value !== null)
    && ('name' in value)
    && ('callback' in value);
}


export function ExtractObserverNameAndCallback<TKVMap extends KeyValueMapGeneric>(observer: any): INotificationsObserverLike<TKVMap> | null {
  if (NOTIFICATIONS_OBSERVER_PRIVATE in observer) {
    return (observer as INotificationsObserverInternal<TKVMap>)[NOTIFICATIONS_OBSERVER_PRIVATE];
  } else if (
    (typeof observer.name === 'string')
    && (typeof observer.callback === 'function')
  ) {
    return observer;
  } else {
    return null;
  }
}

export class NotificationsObserver<TKVMap extends KeyValueMapGeneric = { [key: string]: any }> extends Observer<INotification<TKVMap>> implements INotificationsObserver<TKVMap> {

  constructor(name: KeyValueMapKeys<TKVMap>, callback: TNotificationsObserverCallback<TKVMap>) {
    super((notification: INotification<TKVMap>) => {
      if (notification.name === name) {
        callback(notification.value);
      }
    });

    ConstructNotificationsObserver<TKVMap>(this, name, callback);
  }

  get name(): KeyValueMapKeys<TKVMap> {
    return ((this as unknown) as INotificationsObserverInternal<TKVMap>)[NOTIFICATIONS_OBSERVER_PRIVATE].name;
  }

  get callback(): TNotificationsObserverCallback<TKVMap> {
    return ((this as unknown) as INotificationsObserverInternal<TKVMap>)[NOTIFICATIONS_OBSERVER_PRIVATE].callback;
  }

  matches(name: string, callback?: (value: any) => void): boolean {
    return (((this as unknown) as INotificationsObserverInternal<TKVMap>)[NOTIFICATIONS_OBSERVER_PRIVATE].name === name)
      && (
        (callback === void 0)
        || (((this as unknown) as INotificationsObserverInternal<TKVMap>)[NOTIFICATIONS_OBSERVER_PRIVATE].callback === callback)
      );
  }
}

