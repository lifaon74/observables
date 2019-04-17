import { IObservable, IObservableHook, IObservableContextBase, TObservablePipeToObserverResult, TObservablePipeToCallbackResult } from '../../../core/observable/interfaces';
import { INotificationsObserver } from '../notifications-observer/interfaces';
import { KeyValueMapGeneric, KeyValueMapKeys, KeyValueMapValues } from '../interfaces';
import { INotification } from '../notification/interfaces';
import { IObserver } from '../../../core/observer/interfaces';
import { Clone, IsIntersecting, IsSubSet, IsSuperSet } from '../../../classes/types';

/** TYPES **/

// export type KeyValueMapToNotifications<TKVMap extends KeyValueMapGeneric> = {
//   [key in KeyValueMapKeys<TKVMap>]: INotification<key, TKVMap[key]>;
// } extends { [key: string]: infer V } ? V : never;


/**
 * Cast a KeyValueMap to an union of Notifications
 * @Example:
 *  KeyValueMapToNotifications<{a: 1, b: 2}>
 *    => INotification<'a', 1> | INotification<'b', 2>
 */
type CastKeyValueMapToNotifications<TKVMap extends KeyValueMapGeneric, K extends KeyValueMapKeys<TKVMap>> = K extends any ? INotification<K, TKVMap[K]> : never;
export type KeyValueMapToNotifications<TKVMap extends KeyValueMapGeneric> = CastKeyValueMapToNotifications<TKVMap, KeyValueMapKeys<TKVMap>>;

/**
 * Cast a KeyValueMap to a Notification where:
 * - 'name' is the union of the TKVMap's keys
 * - and 'value' is the union of the TKVMap's values
 * @Example:
 *  KeyValueMapToNotificationsGeneric<{a: 1, b: 2}>
 *    => INotification<'a' | 'b', 1 | 2>
 */
export type KeyValueMapToNotificationsGeneric<TKVMap extends KeyValueMapGeneric> = INotification<KeyValueMapKeys<TKVMap>, KeyValueMapValues<TKVMap>>;

// cast a KeyValueMap to an union of NotificationsObserver
type CastKeyValueMapToNotificationsObservers<TKVMap extends KeyValueMapGeneric, K extends KeyValueMapKeys<TKVMap>> = K extends any ? INotificationsObserver<K, TKVMap[K]> : never;
export type KeyValueMapToNotificationsObservers<TKVMap extends KeyValueMapGeneric> = CastKeyValueMapToNotificationsObservers<TKVMap, KeyValueMapKeys<TKVMap>>;
export type KeyValueMapToNotificationsObserversGeneric<TKVMap extends KeyValueMapGeneric> = INotificationsObserver<KeyValueMapKeys<TKVMap>, KeyValueMapValues<TKVMap>>;

// // cast a KeyValueMap to an union of NotificationsObserverLike
// type CastKeyValueMapToNotificationsObserversLike<TKVMap extends KeyValueMapGeneric, K extends KeyValueMapKeys<TKVMap>> = K extends any ? INotificationsObserverLike<K, TKVMap[K]> : never;
// export type KeyValueMapToNotificationsObserversLike<TKVMap extends KeyValueMapGeneric> = CastKeyValueMapToNotificationsObserversLike<TKVMap, KeyValueMapKeys<TKVMap>>;
// export type KeyValueMapToNotificationsObserversLikeGeneric<TKVMap extends KeyValueMapGeneric> = INotificationsObserverLike<KeyValueMapKeys<TKVMap>, KeyValueMapValues<TKVMap>>;


/**
 * Expects
 *  - the NotificationsObserver's name shares at least one value with the TKVMap's keys
 *  - the NotificationsObserver's value is a superset of TKVMap[name] (the union of the possible values from 'name')
 *    -> the NotificationsObserver must support at least all the values that its observable may emit
 */
export type TNotificationsObservablePipeToObserverResult<TInputObserver extends INotificationsObserver<string, any>, TKVMap extends KeyValueMapGeneric> =
  TInputObserver extends INotificationsObserver<infer TName, infer TValue>
    ? IsIntersecting<TName, KeyValueMapKeys<TKVMap>> extends true
      ? IsSubSet<TKVMap[Extract<KeyValueMapKeys<TKVMap>, TName>], TValue> extends true
        ? INotificationsObserver<TName, TValue>
        : never
      : never
    : never;


export type TNotificationsObservableHook<TKVMap extends KeyValueMapGeneric> = IObservableHook<KeyValueMapToNotifications<TKVMap>>;


export type TNotificationsObservableConstructorArgs<TKVMap extends KeyValueMapGeneric> = [(context: INotificationsObservableContext<TKVMap>) => (TNotificationsObservableHook<TKVMap> | void)] | [];


/** INTERFACES **/

export interface INotificationsObservableConstructor {
  new<TKVMap extends KeyValueMapGeneric>(create?: (context: INotificationsObservableContext<TKVMap>) => (TNotificationsObservableHook<TKVMap> | void)): INotificationsObservable<TKVMap>;
}

export interface INotificationsObservableTypedConstructor<TKVMap extends KeyValueMapGeneric> {
  new(create?: (context: INotificationsObservableContext<TKVMap>) => (TNotificationsObservableHook<TKVMap> | void)): INotificationsObservable<TKVMap>;
}


/**
 * A NotificationsObservable is an Observable emitting some Notifications.
 * It provides some shortcut functions to create Observers.
 */
export interface INotificationsObservable<TKVMap extends KeyValueMapGeneric> extends IObservable<KeyValueMapToNotifications<TKVMap>> {

  pipeTo<NO extends INotificationsObserver<any, any>>(observer: NO): TNotificationsObservablePipeToObserverResult<NO, TKVMap>;
  pipeTo<O extends IObserver<any>>(observer: O): TObservablePipeToObserverResult<O, KeyValueMapToNotifications<TKVMap>>;
  pipeTo<C extends (value: any) => void>(callback: C): TObservablePipeToCallbackResult<C, KeyValueMapToNotifications<TKVMap>>;


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



export interface INotificationsObservableContextConstructor {
  // creates a NotificationsObservableContext
  new<TKVMap extends KeyValueMapGeneric>(observable: INotificationsObservable<TKVMap>): INotificationsObservableContext<TKVMap>;
}

export interface INotificationsObservableContext<TKVMap extends KeyValueMapGeneric> extends IObservableContextBase<KeyValueMapToNotifications<TKVMap>> {
  readonly observable: INotificationsObservable<TKVMap>;
  emit(value: KeyValueMapToNotifications<TKVMap>): void;
  dispatch<K extends KeyValueMapKeys<TKVMap>>(name: K, value?: TKVMap[K]): void;
}

