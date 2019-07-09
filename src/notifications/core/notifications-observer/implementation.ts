import { INotification } from '../notification/interfaces';
import { Observer, } from '../../../core/observer/implementation';
import { ConstructClassWithPrivateMembers } from '../../../misc/helpers/ClassWithPrivateMembers';
import { INotificationsObserver, INotificationsObserverLike, TNotificationsObserverCallback } from './interfaces';
import { IsObject } from '../../../helpers';


export const NOTIFICATIONS_OBSERVER_PRIVATE = Symbol('notifications-observer-private');

export interface INotificationsObserverPrivate<TName extends string, TValue> {
  name: TName;
  callback: TNotificationsObserverCallback<TValue>;
}

export interface INotificationsObserverInternal<TName extends string, TValue> extends INotificationsObserver<TName, TValue> {
  [NOTIFICATIONS_OBSERVER_PRIVATE]: INotificationsObserverPrivate<TName, TValue>;
}

export function ConstructNotificationsObserver<TName extends string, TValue>(instance: INotificationsObserver<TName, TValue>, name: TName, callback: TNotificationsObserverCallback<TValue>): void {
  ConstructClassWithPrivateMembers(instance, NOTIFICATIONS_OBSERVER_PRIVATE);
  const privates: INotificationsObserverPrivate<TName, TValue> = (instance as INotificationsObserverInternal<TName, TValue>)[NOTIFICATIONS_OBSERVER_PRIVATE];
  privates.name = name;
  privates.callback = callback.bind(instance);
}

/**
 * Returns true if 'value' is a NotificationsObserver
 * @param value
 */
export function IsNotificationsObserver(value: any): value is INotificationsObserver<string, any> {
  return IsObject(value)
    && value.hasOwnProperty(NOTIFICATIONS_OBSERVER_PRIVATE as symbol);
}

export function IsNotificationsObserverLike(value: any): value is INotificationsObserverLike<string, any> {
  return IsObject(value)
    && (typeof (value as any).name === 'string')
    && (typeof (value as any).callback === 'function');
}


export function ExtractObserverNameAndCallback<TName extends string, TValue>(value: any): INotificationsObserverLike<TName, TValue> | null {
  if (!IsObject(value)) {
    return null;
  } else if (NOTIFICATIONS_OBSERVER_PRIVATE in value) {
    return (value as INotificationsObserverInternal<TName, TValue>)[NOTIFICATIONS_OBSERVER_PRIVATE];
  } else if (
    (typeof (value as any).name === 'string')
    && (typeof (value as any).callback === 'function')
  ) {
    return value as INotificationsObserverLike<TName, TValue>;
  } else {
    return null;
  }
}


export function NotificationsObserverEmit<TName extends string, TValue>(instance: INotificationsObserver<TName, TValue>, notification: INotification<TName, TValue>): void {
  const privates: INotificationsObserverPrivate<TName, TValue> = (instance as INotificationsObserverInternal<TName, TValue>)[NOTIFICATIONS_OBSERVER_PRIVATE];
  if (notification.name === privates.name) {
    privates.callback(notification.value);
  }
}

export function NotificationsObserverMatches<TName extends string, TValue>(
  instance: INotificationsObserver<TName, TValue>,
  name: string,
  callback?: TNotificationsObserverCallback<any>,
): boolean {
  const privates: INotificationsObserverPrivate<TName, TValue> = (instance as INotificationsObserverInternal<TName, TValue>)[NOTIFICATIONS_OBSERVER_PRIVATE];
  return (privates.name === name)
    && (
      (callback === void 0)
      || (privates.callback === callback)
    );
}


export class NotificationsObserver<TName extends string, TValue> extends Observer<INotification<TName, TValue>> implements INotificationsObserver<TName, TValue> {

  constructor(name: TName, callback: TNotificationsObserverCallback<TValue>) {
    super((notification: INotification<TName, TValue>) => {
      if (notification.name === name) {
        callback.call(this, notification.value);
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
    return NotificationsObserverMatches<TName, TValue>(this, name, callback);
  }
}

