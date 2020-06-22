import { IObservable, IObservableConstructor, IObservableTypedConstructor } from '../../../core/observable/interfaces';
import { INotificationsObserver } from '../notifications-observer/interfaces';
import { IObserver } from '../../../core/observer/interfaces';
import { IObservableObserver } from '../../../core/observable-observer/interfaces';
import {
  TObservableObservedByResultNonCyclic, TObservablePipeThroughResult, TObservablePipeToCallbackResult,
  TObservablePipeToObserverResult, TObserverOrCallback
} from '../../../core/observable/types';
import { INotificationsObservableContext } from './context/interfaces';
import {
  INotificationsObservableMatchOptions, KeyValueMapToNotifications, TNotificationsObservableHook,
  TNotificationsObservablePipeThroughResult, TNotificationsObservablePipeToObserverResult
} from './types';
import { KeyValueMap, KeyValueMapKeys } from '../types';


/** INTERFACES **/

export interface INotificationsObservableConstructor extends Omit<IObservableConstructor, 'new'> {
  new<TKVMap extends KeyValueMap>(create?: (context: INotificationsObservableContext<TKVMap>) => (TNotificationsObservableHook<TKVMap> | void)): INotificationsObservable<TKVMap>;
}

export interface INotificationsObservableTypedConstructor<TKVMap extends KeyValueMap> extends Omit<IObservableTypedConstructor<KeyValueMapToNotifications<TKVMap>>, 'new'> {
  new(create?: (context: INotificationsObservableContext<TKVMap>) => (TNotificationsObservableHook<TKVMap> | void)): INotificationsObservable<TKVMap>;
}


/**
 * A NotificationsObservable is an Observable emitting some Notifications.
 * It provides some shortcut functions to create Observers.
 */
export interface INotificationsObservable<TKVMap extends KeyValueMap> extends IObservable<KeyValueMapToNotifications<TKVMap>> {

  pipeTo<NO extends INotificationsObserver<any, any>>(observer: NO): TNotificationsObservablePipeToObserverResult<NO, TKVMap>;

  pipeTo<O extends IObserver<any>>(observer: O): TObservablePipeToObserverResult<O, KeyValueMapToNotifications<TKVMap>>;

  pipeTo<C extends (value: any) => void>(callback: C): TObservablePipeToCallbackResult<C, KeyValueMapToNotifications<TKVMap>>;

  pipeThrough<OO extends IObservableObserver<INotificationsObserver<any, any>, IObservable<any>>>(observableObserver: OO): TNotificationsObservablePipeThroughResult<OO, TKVMap>;

  pipeThrough<OO extends IObservableObserver<IObserver<any>, IObservable<any>>>(observableObserver: OO): TObservablePipeThroughResult<OO, KeyValueMapToNotifications<TKVMap>>;


  // creates a NotificationsObserver with "name" and "callback" which observes this Observable
  addListener<TKey extends KeyValueMapKeys<TKVMap>>(name: TKey, callback: (value: TKVMap[TKey]) => void): INotificationsObserver<TKey, TKVMap[TKey]>;

  // removes the Observable's NotificationsObservers matching "name" and "callback"
  removeListener<TKey extends KeyValueMapKeys<TKVMap>>(name: TKey, callback?: (value: TKVMap[TKey]) => void): void;

  // like "addListener" but returns "this"
  on<TKey extends KeyValueMapKeys<TKVMap>>(name: TKey, callback: (value: TKVMap[TKey]) => void): this;

  // like "removeListener" but returns "this"
  off<TKey extends KeyValueMapKeys<TKVMap>>(name: TKey, callback?: (value: TKVMap[TKey]) => void): this;


  /**
   * Returns true if this observable has an Observer matching "name" and "callback".
   *  If 'callback' is not defined, searches only for 'name'
   *  If options.includeGlobalObservers is true, and this Observable is observed by at least one Observer with a type different than NotificationsObserver, then returns true.
   */
  hasListener(name: string, callback?: (value: any) => void, options?: INotificationsObservableMatchOptions): boolean;

  /**
   * Returns the list of Observer matching "name" and "callback"
   *  If 'callback' is not defined, searches only for 'name'
   *  If options.includeGlobalObservers is true, includes the list of Observers with a type different than NotificationsObserver.
   */
  matches(name: string, callback?: (value: any) => void, options?: INotificationsObservableMatchOptions): Generator<IObserver<KeyValueMapToNotifications<TKVMap>>, void, undefined>;

  // matches(name: string, callback?: (value: any) => void): IterableIterator<KeyValueMapToNotificationsObservers<TKVMap>>;
}

export interface IBaseNotificationsObservable<TName extends string, TValue> extends INotificationsObservable<Record<TName, TValue>> {
  observedBy<O extends TObserverOrCallback<any>[]>(...observers: O): TObservableObservedByResultNonCyclic<O, KeyValueMapToNotifications<Record<TName, TValue>>, this>; // returns this
}


