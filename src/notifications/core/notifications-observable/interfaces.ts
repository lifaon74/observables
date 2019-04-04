import { IObservable, IObservableContext, IObservableHook, IObservableContextBase } from '../../../core/observable/interfaces';
import { INotificationsObserver } from '../notifications-observer/interfaces';
import { KeyValueMapGeneric } from '../interfaces';
import { INotification } from '../notification/interfaces';


export type TNotificationsObservableConstructorArgs<TKVMap extends KeyValueMapGeneric> = [(context: INotificationsObservableContext<TKVMap>) => (IObservableHook<INotification<TKVMap>> | void)] | [];

export interface INotificationsObservableConstructor {
  new<TKVMap extends KeyValueMapGeneric>(create?: (context: INotificationsObservableContext<TKVMap>) => (IObservableHook<INotification<TKVMap>> | void)): INotificationsObservable<TKVMap>;
}

export interface INotificationsObservableTypedConstructor<TKVMap extends KeyValueMapGeneric> {
  new(create?: (context: INotificationsObservableContext<TKVMap>) => (IObservableHook<INotification<TKVMap>> | void)): INotificationsObservable<TKVMap>;
}

/**
 * A NotificationsObservable is an Observable emitting some Notifications.
 * It provides some shortcut functions to create Observers.
 */
export interface INotificationsObservable<TKVMap extends KeyValueMapGeneric> extends IObservable<INotification<TKVMap>> {
  // creates a NotificationsObserver with "name" and "callback" which observes this Observable
  addListener<K extends keyof TKVMap>(name: K, callback: (value: TKVMap[K]) => void): INotificationsObserver<Pick<TKVMap, K>>;

  // removes the Observable's NotificationsObservers matching "name" and "callback"
  removeListener<K extends keyof TKVMap>(name: K, callback?: (value: TKVMap[K]) => void): void;

  // like "addListener" but returns "this"
  on<K extends keyof TKVMap>(name: K, callback: (value: TKVMap[K]) => void): this;

  // like "removeListener" but returns "this"
  off<K extends keyof TKVMap>(name: K, callback?: (value: TKVMap[K]) => void): this;

  // returns the list of observed NotificationsObserver matching "name" and "callback"
  matches(name: string, callback?: (value: any) => void): IterableIterator<INotificationsObserver<TKVMap>>;
}



export interface INotificationsObservableContextConstructor {
  // creates a NotificationsObservableContext
  new<TKVMap extends KeyValueMapGeneric>(observable: IObservable<INotification<TKVMap>>): INotificationsObservableContext<TKVMap>;
}

export interface INotificationsObservableContext<TKVMap extends KeyValueMapGeneric> extends IObservableContextBase<INotification<TKVMap>> {
  readonly observable: INotificationsObservable<TKVMap>;
  emit(value: INotification<TKVMap>): void;
  dispatch<K extends keyof TKVMap>(name: K, value?: TKVMap[K]): void;
}

