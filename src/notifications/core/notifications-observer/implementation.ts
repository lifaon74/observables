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
    return ((this as unknown) as INotificationsObserverInternal<TName, TValue>)[NOTIFICATIONS_OBSERVER_PRIVATE].name;
  }

  get callback(): TNotificationsObserverCallback<TValue> {
    return ((this as unknown) as INotificationsObserverInternal<TName, TValue>)[NOTIFICATIONS_OBSERVER_PRIVATE].callback;
  }

  matches(name: string, callback?: TNotificationsObserverCallback<any>): boolean {
    return NotificationsObserverMatches<TName, TValue>(this, name, callback);
  }
}

