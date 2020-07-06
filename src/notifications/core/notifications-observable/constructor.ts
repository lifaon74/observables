import { INotificationsObservable } from './interfaces';
import { KeyValueMapGeneric, KeyValueMapKeys } from '../types';
import { IsObject } from '../../../helpers';
import {
  INotificationsObservableInternal, INotificationsObservablePrivate, NOTIFICATIONS_OBSERVABLE_PRIVATE
} from './privates';
import { IObservableContext } from '../../../core/observable/context/interfaces';
import { InitObservableHook } from '../../../core/observable/hook/init';
import { INotificationsObservableContext } from './context/interfaces';
import { KeyValueMapToNotifications, KeyValueMapToNotificationsObservers, TNotificationsObservableHook } from './types';
import { NewNotificationsObservableContext } from './context/implementation';
import { ConstructClassWithPrivateMembers, HasFactoryWaterMark } from '@lifaon/class-factory';

/** CONSTRUCTOR **/

/**
 * Constructs a NotificationsObservable
 */
export function ConstructNotificationsObservable<TKVMap extends object>(
  instance: INotificationsObservable<TKVMap>,
  context: IObservableContext<KeyValueMapToNotifications<TKVMap>>,
  create?: (context: INotificationsObservableContext<TKVMap>) => TNotificationsObservableHook<TKVMap> | void
): void {
  ConstructClassWithPrivateMembers(instance, NOTIFICATIONS_OBSERVABLE_PRIVATE);
  const privates: INotificationsObservablePrivate<TKVMap> = (instance as INotificationsObservableInternal<TKVMap>)[NOTIFICATIONS_OBSERVABLE_PRIVATE];

  privates.context = context;
  privates.observersMap = new Map<KeyValueMapKeys<TKVMap>, KeyValueMapToNotificationsObservers<TKVMap>[]>();
  privates.othersObservers = [];
  privates.pendingEmit = [];
  privates.emitting = false;

  InitObservableHook(
    instance,
    privates,
    NewNotificationsObservableContext,
    create,
  );
}

export function IsNotificationsObservable(value: any): value is INotificationsObservable<KeyValueMapGeneric> {
  return IsObject(value)
    && value.hasOwnProperty(NOTIFICATIONS_OBSERVABLE_PRIVATE as symbol);
}

export const IS_NOTIFICATIONS_OBSERVABLE_CONSTRUCTOR = Symbol('is-notifications-observable-constructor');

export function IsNotificationsObservableConstructor(value: any, direct?: boolean): boolean {
  return (typeof value === 'function')
    && HasFactoryWaterMark(value, IS_NOTIFICATIONS_OBSERVABLE_CONSTRUCTOR, direct);
}

