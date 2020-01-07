import { INotification } from '../notification/interfaces';
import { Observer, } from '../../../core/observer/implementation';
import { INotificationsObserver } from './interfaces';
import { TNotificationsObserverCallback } from './types';
import {
  INotificationsObserverInternal, INotificationsObserverPrivate, NOTIFICATIONS_OBSERVER_PRIVATE
} from './privates';
import { ConstructNotificationsObserver } from './constructor';


/** CONSTRUCTOR FUNCTIONS **/

export function NotificationsObserverEmit<TName extends string, TValue>(instance: INotificationsObserver<TName, TValue>, notification: INotification<TName, TValue>): void {
  const privates: INotificationsObserverPrivate<TName, TValue> = (instance as INotificationsObserverInternal<TName, TValue>)[NOTIFICATIONS_OBSERVER_PRIVATE];
  if (notification.name === privates.name) {
    privates.callback.call(instance, notification.value);
  }
}

/** METHODS **/

/* GETTERS/SETTERS */

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

export function NotificationsObserverGetName<TName extends string, TValue>(
  instance: INotificationsObserver<TName, TValue>,
): TName {
  return (instance as INotificationsObserverInternal<TName, TValue>)[NOTIFICATIONS_OBSERVER_PRIVATE].name;
}

export function NotificationsObserverGetCallback<TName extends string, TValue>(
  instance: INotificationsObserver<TName, TValue>,
): TNotificationsObserverCallback<TValue> {
  return (instance as INotificationsObserverInternal<TName, TValue>)[NOTIFICATIONS_OBSERVER_PRIVATE].callback;
}

/* METHODS */


/** CLASS **/

export class NotificationsObserver<TName extends string, TValue> extends Observer<INotification<TName, TValue>> implements INotificationsObserver<TName, TValue> {

  constructor(name: TName, callback: TNotificationsObserverCallback<TValue>) {
    super((notification: INotification<TName, TValue>) => {
      NotificationsObserverEmit<TName, TValue>(this, notification);
    });

    ConstructNotificationsObserver<TName, TValue>(this, name, callback);
  }

  get name(): TName {
    return NotificationsObserverGetName<TName, TValue>(this);
  }

  get callback(): TNotificationsObserverCallback<TValue> {
    return NotificationsObserverGetCallback<TName, TValue>(this);
  }

  matches(name: string, callback?: TNotificationsObserverCallback<any>): boolean {
    return NotificationsObserverMatches<TName, TValue>(this, name, callback);
  }
}

