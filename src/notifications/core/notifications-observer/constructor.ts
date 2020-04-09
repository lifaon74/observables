import { INotificationsObserver } from './interfaces';
import { IsObject } from '../../../helpers';
import {
  INotificationsObserverInternal, INotificationsObserverPrivate, NOTIFICATIONS_OBSERVER_PRIVATE
} from './privates';
import { TNotificationsObserverCallback } from './types';
import { ConstructClassWithPrivateMembers } from '@lifaon/class-factory';

/** CONSTRUCTOR **/

export function ConstructNotificationsObserver<TName extends string, TValue>(instance: INotificationsObserver<TName, TValue>, name: TName, callback: TNotificationsObserverCallback<TValue>): void {
  ConstructClassWithPrivateMembers(instance, NOTIFICATIONS_OBSERVER_PRIVATE);
  const privates: INotificationsObserverPrivate<TName, TValue> = (instance as INotificationsObserverInternal<TName, TValue>)[NOTIFICATIONS_OBSERVER_PRIVATE];
  privates.name = name;
  privates.callback = callback.bind(instance);
}

/**
 * Returns true if 'value' is a NotificationsObserver
 */
export function IsNotificationsObserver<TName extends string = string, TValue = any>(value: any): value is INotificationsObserver<TName, TValue> {
  return IsObject(value)
    && value.hasOwnProperty(NOTIFICATIONS_OBSERVER_PRIVATE as symbol);
}

