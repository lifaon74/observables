import { KeyValueMapGenericConstraint, KeyValueMapKeys, KeyValueMapValues } from '../interfaces';
import { INotificationsObserver } from '../notifications-observer/interfaces';
import { INotification } from '../notification/interfaces';
import { IObservableObserver } from '../../../core/observable-observer/interfaces';
import { IObservable } from '../../../core/observable/interfaces';
import { IsIntersecting, IsSubSet } from '../../../classes/types';
import { INotificationsObservableContext } from './context/interfaces';
import { IObservableHook } from '../../../core/observable/hook/interfaces';
import { INotificationsObserverLike } from '../notifications-observer/types';

/** TYPES **/

/**
 * Cast a KeyValueMap to an union of Notifications
 * @Example:
 *  KeyValueMapToNotifications<{a: 1, b: 2}>
 *    => INotification<'a', 1> | INotification<'b', 2>
 */
type CastKeyValueMapToNotifications<TKVMap extends KeyValueMapGenericConstraint<TKVMap>, K extends KeyValueMapKeys<TKVMap>> = K extends any ? INotification<K, TKVMap[K]> : never;

export type KeyValueMapToNotifications<TKVMap extends KeyValueMapGenericConstraint<TKVMap>> = CastKeyValueMapToNotifications<TKVMap, KeyValueMapKeys<TKVMap>>;
type CastKeyValueMapToNotificationsSoft<TKVMap extends object, K extends KeyValueMapKeys<TKVMap>> = K extends any ? INotification<K, TKVMap[K]> : never;
export type KeyValueMapToNotificationsSoft<TKVMap extends object> = CastKeyValueMapToNotificationsSoft<TKVMap, KeyValueMapKeys<TKVMap>>;

/**
 * Cast a KeyValueMap to a Notification where:
 * - 'name' is the union of the TKVMap's keys
 * - and 'value' is the union of the TKVMap's values
 * @Example:
 *  KeyValueMapToNotificationsGeneric<{a: 1, b: 2}>
 *    => INotification<'a' | 'b', 1 | 2>
 */
export type KeyValueMapToNotificationsGeneric<TKVMap extends KeyValueMapGenericConstraint<TKVMap>> = INotification<KeyValueMapKeys<TKVMap>, KeyValueMapValues<TKVMap>>;

// cast a KeyValueMap to an union of NotificationsObserver
type CastKeyValueMapToNotificationsObservers<TKVMap extends KeyValueMapGenericConstraint<TKVMap>, K extends KeyValueMapKeys<TKVMap>> = K extends any ? INotificationsObserver<K, TKVMap[K]> : never;
export type KeyValueMapToNotificationsObservers<TKVMap extends KeyValueMapGenericConstraint<TKVMap>> = CastKeyValueMapToNotificationsObservers<TKVMap, KeyValueMapKeys<TKVMap>>;
export type KeyValueMapToNotificationsObserversGeneric<TKVMap extends KeyValueMapGenericConstraint<TKVMap>> = INotificationsObserver<KeyValueMapKeys<TKVMap>, KeyValueMapValues<TKVMap>>;

// cast a KeyValueMap to an union of NotificationsObserverLike
type CastKeyValueMapToNotificationsObserversLike<TKVMap extends KeyValueMapGenericConstraint<TKVMap>, K extends KeyValueMapKeys<TKVMap>> = K extends any ? INotificationsObserverLike<K, TKVMap[K]> : never;
export type KeyValueMapToNotificationsObserversLike<TKVMap extends KeyValueMapGenericConstraint<TKVMap>> = CastKeyValueMapToNotificationsObserversLike<TKVMap, KeyValueMapKeys<TKVMap>>;
export type KeyValueMapToNotificationsObserversLikeGeneric<TKVMap extends KeyValueMapGenericConstraint<TKVMap>> = INotificationsObserverLike<KeyValueMapKeys<TKVMap>, KeyValueMapValues<TKVMap>>;

/**
 * Expects
 *  - the NotificationsObserver's name shares at least one value with the TKVMap's keys
 *  - the NotificationsObserver's value is a superset of TKVMap[name] (the union of the possible values from 'name')
 *    -> the NotificationsObserver must support at least all the values that its observable may emit
 */
export type TNotificationsObservablePipeToObserverResult<TInputObserver extends INotificationsObserver<string, any>, TKVMap extends KeyValueMapGenericConstraint<TKVMap>> =
  TInputObserver extends INotificationsObserver<infer TName, infer TValue>
    ? IsIntersecting<TName, KeyValueMapKeys<TKVMap>> extends true
    ? IsSubSet<TKVMap[Extract<KeyValueMapKeys<TKVMap>, TName>], TValue> extends true
      ? INotificationsObserver<TName, TValue>
      : never
    : never
    : never;

export type TNotificationsObservablePipeThroughResult<TInputObservableObserver extends IObservableObserver<INotificationsObserver<any, any>, IObservable<any>>, TKVMap extends KeyValueMapGenericConstraint<TKVMap>> =
  TInputObservableObserver extends IObservableObserver<INotificationsObserver<infer TName, infer TValue>, infer TObservable>
    ? IsIntersecting<TName, KeyValueMapKeys<TKVMap>> extends true
    ? IsSubSet<TKVMap[Extract<KeyValueMapKeys<TKVMap>, TName>], TValue> extends true
      ? TObservable
      : never
    : never
    : never;
export type TNotificationsObservableHook<TKVMap extends KeyValueMapGenericConstraint<TKVMap>> = IObservableHook<KeyValueMapToNotifications<TKVMap>>;

export type TNotificationsObservableConstructorArgs<TKVMap extends KeyValueMapGenericConstraint<TKVMap>> =
  [((context: INotificationsObservableContext<TKVMap>) => (TNotificationsObservableHook<TKVMap> | void))?];


/** OPTIONS **/

export interface INotificationsObservableMatchOptions {
  includeGlobalObservers?: boolean; // (default => false) if set to true, includes Observers which are not of type NotificationsObserver (assumes they receives all Notifications)
}
