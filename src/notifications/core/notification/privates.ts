import { INotification } from './interfaces';

/** PRIVATES **/

export const NOTIFICATION_PRIVATE = Symbol('notification-private');

export interface INotificationPrivate<TName extends string, TValue> {
  name: TName;
  value: TValue;
}

export interface INotificationPrivatesInternal<TName extends string, TValue> {
  [NOTIFICATION_PRIVATE]: INotificationPrivate<TName, TValue>;
}

export interface INotificationInternal<TName extends string, TValue> extends INotificationPrivatesInternal<TName, TValue>, INotification<TName, TValue> {
}
