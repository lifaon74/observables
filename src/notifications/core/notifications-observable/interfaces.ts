import {
  IObservable, IObservableContextBase, IObservableHook, TObservableObservedByResultNonCyclic,
  TObservablePipeThroughResult, TObservablePipeToCallbackResult, TObservablePipeToObserverResult, TObserverOrCallback
} from '../../../core/observable/interfaces';
import { INotificationsObserver, INotificationsObserverLike } from '../notifications-observer/interfaces';
import { KeyValueMapGenericConstraint, KeyValueMapKeys, KeyValueMapValues, KVRecord } from '../interfaces';
import { INotification } from '../notification/interfaces';
import { IObserver } from '../../../core/observer/interfaces';
import { IsIntersecting, IsSubSet } from '../../../classes/types';
import { IObservableObserver } from '../../../core/observable-observer/interfaces';

/** TYPES **/

// export type KeyValueMapToNotifications<TKVMap extends KeyValueMapGenericConstraint<TKVMap>> = {
//   [key in KeyValueMapKeys<TKVMap>]: INotification<key, TKVMap[key]>;
// } extends { [key: string]: infer V } ? V : never;


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

// // cast a KeyValueMap to an union of NotificationsObserverLike
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
  [(context: INotificationsObservableContext<TKVMap>) => (TNotificationsObservableHook<TKVMap> | void)]
  | [];



/** INTERFACES **/

export interface INotificationsObservableConstructor {
  new<TKVMap extends KeyValueMapGenericConstraint<TKVMap>>(create?: (context: INotificationsObservableContext<TKVMap>) => (TNotificationsObservableHook<TKVMap> | void)): INotificationsObservable<TKVMap>;
}

export interface INotificationsObservableTypedConstructor<TKVMap extends KeyValueMapGenericConstraint<TKVMap>> {
  new(create?: (context: INotificationsObservableContext<TKVMap>) => (TNotificationsObservableHook<TKVMap> | void)): INotificationsObservable<TKVMap>;
}


/**
 * A NotificationsObservable is an Observable emitting some Notifications.
 * It provides some shortcut functions to create Observers.
 */
export interface INotificationsObservable<TKVMap extends KeyValueMapGenericConstraint<TKVMap>> extends IObservable<KeyValueMapToNotifications<TKVMap>> {

  pipeTo<NO extends INotificationsObserver<any, any>>(observer: NO): TNotificationsObservablePipeToObserverResult<NO, TKVMap>;

  pipeTo<O extends IObserver<any>>(observer: O): TObservablePipeToObserverResult<O, KeyValueMapToNotifications<TKVMap>>;

  pipeTo<C extends (value: any) => void>(callback: C): TObservablePipeToCallbackResult<C, KeyValueMapToNotifications<TKVMap>>;

  pipeThrough<OO extends IObservableObserver<INotificationsObserver<any, any>, IObservable<any>>>(observableObserver: OO): TNotificationsObservablePipeThroughResult<OO, TKVMap>;

  pipeThrough<OO extends IObservableObserver<IObserver<any>, IObservable<any>>>(observableObserver: OO): TObservablePipeThroughResult<OO, KeyValueMapToNotifications<TKVMap>>;


  // creates a NotificationsObserver with "name" and "callback" which observes this Observable
  addListener<K extends KeyValueMapKeys<TKVMap>>(name: K, callback: (value: TKVMap[K]) => void): INotificationsObserver<K, TKVMap[K]>;

  // removes the Observable's NotificationsObservers matching "name" and "callback"
  removeListener<K extends KeyValueMapKeys<TKVMap>>(name: K, callback?: (value: TKVMap[K]) => void): void;

  // like "addListener" but returns "this"
  on<K extends KeyValueMapKeys<TKVMap>>(name: K, callback: (value: TKVMap[K]) => void): this;

  // like "removeListener" but returns "this"
  off<K extends KeyValueMapKeys<TKVMap>>(name: K, callback?: (value: TKVMap[K]) => void): this;

  // returns the list of observed NotificationsObserver matching "name" and "callback"
  matches(name: string, callback?: (value: any) => void): IterableIterator<KeyValueMapToNotificationsObservers<TKVMap>>;
}

export interface IBaseNotificationsObservable<TName extends string, TValue> extends INotificationsObservable<KVRecord<TName, TValue>> {
  observedBy<O extends TObserverOrCallback<any>[]>(...observers: O): TObservableObservedByResultNonCyclic<O, KeyValueMapToNotifications<KVRecord<TName, TValue>>, this>; // returns this
}


export interface INotificationsObservableContextConstructor {
  // creates a NotificationsObservableContext
  new<TKVMap extends KeyValueMapGenericConstraint<TKVMap>>(observable: INotificationsObservable<TKVMap>): INotificationsObservableContext<TKVMap>;
}

export interface INotificationsObservableContext<TKVMap extends KeyValueMapGenericConstraint<TKVMap>> extends IObservableContextBase<KeyValueMapToNotifications<TKVMap>> {
  readonly observable: INotificationsObservable<TKVMap>;

  emit(value: KeyValueMapToNotifications<TKVMap>): void;

  dispatch<K extends KeyValueMapKeys<TKVMap>>(name: K, value: TKVMap[K]): void;
}

