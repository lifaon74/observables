import { INotificationsObserverLike } from './types';
import { IsObject } from '../../../helpers';
import { INotificationsObserverInternal, NOTIFICATIONS_OBSERVER_PRIVATE } from './privates';


/** FUNCTIONS **/

export function IsNotificationsObserverLike(value: any): value is INotificationsObserverLike<string, any> {
  return IsObject(value)
    && (typeof (value as any).name === 'string')
    && (typeof (value as any).callback === 'function');
}

export function ExtractObserverNameAndCallback<TName extends string, TValue>(value: any): INotificationsObserverLike<TName, TValue> | null {
  if (!IsObject(value)) {
    return null;
  } else if (value.hasOwnProperty(NOTIFICATIONS_OBSERVER_PRIVATE as symbol)) {
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
