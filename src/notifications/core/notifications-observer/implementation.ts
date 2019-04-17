import { INotification } from '../notification/interfaces';
import { IObserverInternal, IObserverPrivate, Observer, OBSERVER_PRIVATE, } from '../../../core/observer/implementation';
import { ConstructClassWithPrivateMembers } from '../../../misc/helpers/ClassWithPrivateMembers';
import { INotificationsObserver, TNotificationsObserverCallback } from './interfaces';
import { INotificationsObserverLike } from './interfaces';
import { IsObject } from '../../../helpers';


export const NOTIFICATIONS_OBSERVER_PRIVATE = Symbol('notifications-observer-private');

export interface INotificationsObserverPrivate<TName extends string, TValue> {
  name: TName;
  callback: TNotificationsObserverCallback<TValue>;
}

export interface INotificationsObserverInternal<TName extends string, TValue> extends INotificationsObserver<TName, TValue> {
  [OBSERVER_PRIVATE]: IObserverPrivate<INotification<TName, TValue>>;
  [NOTIFICATIONS_OBSERVER_PRIVATE]: INotificationsObserverPrivate<TName, TValue>;
}

export function ConstructNotificationsObserver<TName extends string, TValue>(observer: INotificationsObserver<TName, TValue>, name: TName, callback: TNotificationsObserverCallback<TValue>): void {
  ConstructClassWithPrivateMembers(observer, NOTIFICATIONS_OBSERVER_PRIVATE);
  (observer as INotificationsObserverInternal<TName, TValue>)[NOTIFICATIONS_OBSERVER_PRIVATE].name = name;
  (observer as INotificationsObserverInternal<TName, TValue>)[NOTIFICATIONS_OBSERVER_PRIVATE].callback = callback.bind(observer);
}

export function NotificationsObserverEmit<TName extends string, TValue>(observer: INotificationsObserver<TName, TValue>, notification: INotification<TName, TValue>): void {
  if (notification.name === (observer as INotificationsObserverInternal<TName, TValue>)[NOTIFICATIONS_OBSERVER_PRIVATE].name) {
    (observer as INotificationsObserverInternal<TName, TValue>)[NOTIFICATIONS_OBSERVER_PRIVATE].callback(notification.value);
  }
}

/**
 * Returns true if 'value' is a NotificationsObserver
 * @param value
 */
export function IsNotificationsObserver(value: any): boolean {
  return IsObject(value)
    && (NOTIFICATIONS_OBSERVER_PRIVATE in value);
}

export function IsNotificationsObserverLike(value: any): boolean {
  return IsObject(value)
    && (typeof (value as any).name === 'string')
    && (typeof (value as any).callback === 'function');
}


export function ExtractObserverNameAndCallback<TName extends string, TValue>(observer: any): INotificationsObserverLike<TName, TValue> | null {
  if (NOTIFICATIONS_OBSERVER_PRIVATE in observer) {
    return (observer as INotificationsObserverInternal<TName, TValue>)[NOTIFICATIONS_OBSERVER_PRIVATE];
  } else if (
    (typeof observer.name === 'string')
    && (typeof observer.callback === 'function')
  ) {
    return observer;
  } else {
    return null;
  }
}

export class NotificationsObserver<TName extends string, TValue> extends Observer<INotification<TName, TValue>> implements INotificationsObserver<TName, TValue> {

  constructor(name: TName, callback: TNotificationsObserverCallback<TValue>) {
    super((notification: INotification<TName, TValue>) => {
      if (notification.name === name) {
        callback(notification.value);
      }
    });

    ConstructNotificationsObserver<TName, TValue>(this, name, callback);
  }

  get name(): TName {
    return ((this as unknown) as INotificationsObserverInternal<TName, TValue>)[NOTIFICATIONS_OBSERVER_PRIVATE].name;
  }

  get callback(): TNotificationsObserverCallback<TValue> {
    return ((this as unknown) as INotificationsObserverInternal<TName, TValue>)[NOTIFICATIONS_OBSERVER_PRIVATE].callback;
  }

  matches(name: string, callback?: TNotificationsObserverCallback<any>): boolean {
    return (((this as unknown) as INotificationsObserverInternal<TName, TValue>)[NOTIFICATIONS_OBSERVER_PRIVATE].name === name)
      && (
        (callback === void 0)
        || (((this as unknown) as INotificationsObserverInternal<TName, TValue>)[NOTIFICATIONS_OBSERVER_PRIVATE].callback === callback)
      );
  }
}

