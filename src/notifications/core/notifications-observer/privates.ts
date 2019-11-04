import { TNotificationsObserverCallback } from './types';
import { INotificationsObserver } from './interfaces';
import { IObserverPrivatesInternal } from '../../../core/observer/privates';
import { INotification } from '../notification/interfaces';

/** PRIVATES **/

export const NOTIFICATIONS_OBSERVER_PRIVATE = Symbol('notifications-observer-private');

export interface INotificationsObserverPrivate<TName extends string, TValue> {
  name: TName;
  callback: TNotificationsObserverCallback<TValue>;
}

export interface INotificationsObserverPrivatesInternal<TName extends string, TValue> extends IObserverPrivatesInternal<INotification<TName, TValue>> {
  [NOTIFICATIONS_OBSERVER_PRIVATE]: INotificationsObserverPrivate<TName, TValue>;
}

export interface INotificationsObserverInternal<TName extends string, TValue> extends INotificationsObserverPrivatesInternal<TName, TValue>, INotificationsObserver<TName, TValue> {
}
