import { IObserver } from '../../../core/observer/interfaces';
import { INotification } from '../notification/interfaces';
import { INotificationsObserverLike, TNotificationsObserverCallback } from './types';

/** INTERFACES **/

export interface INotificationsObserverConstructor {
  new<TName extends string, TValue>(name: TName, callback: TNotificationsObserverCallback<TValue>): INotificationsObserver<TName, TValue>;
}

export interface INotificationsObserverTypedConstructor<TName extends string, TValue> {
  new(name: TName, callback: TNotificationsObserverCallback<TValue>): INotificationsObserver<TName, TValue>;
}

/**
 * A NotificationsObserver is an Observer filtering its incoming Notifications.
 * If the Notification has the same name than the Observer, then 'callback' is called with the Notification's value
 */
export interface INotificationsObserver<TName extends string, TValue> extends IObserver<INotification<TName, TValue>>, INotificationsObserverLike<TName, TValue> {
  // the name to filter incoming notifications
  readonly name: TName;
  // the callback to call when notification passes the "name" filter
  readonly callback: TNotificationsObserverCallback<TValue>;

  // returns true if "name" and "callback" are the same than this Observer's name and callback
  matches(name: string, callback?: TNotificationsObserverCallback<any>): boolean;
}

