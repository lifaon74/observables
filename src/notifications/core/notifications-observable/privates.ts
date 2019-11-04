import { KeyValueMapGenericConstraint, KeyValueMapKeys } from '../interfaces';
import { IObservableHookPrivate } from '../../../core/observable/hook/privates';
import { INotificationsObservable } from './interfaces';
import { IObservableContext } from '../../../core/observable/context/interfaces';
import { IObserver } from '../../../core/observer/interfaces';
import { KeyValueMapToNotifications, KeyValueMapToNotificationsObservers } from './types';
import { IObservablePrivatesInternal } from '../../../core/observable/privates';

/** PRIVATES **/

export const NOTIFICATIONS_OBSERVABLE_PRIVATE = Symbol('notifications-observable-private');

export interface INotificationsObservablePrivate<TKVMap extends KeyValueMapGenericConstraint<TKVMap>> extends IObservableHookPrivate<KeyValueMapToNotifications<TKVMap>> {
  context: IObservableContext<KeyValueMapToNotifications<TKVMap>>;
  observersMap: Map<KeyValueMapKeys<TKVMap>, KeyValueMapToNotificationsObservers<TKVMap>[]>; // map from a name to a list of observers
  othersObservers: IObserver<KeyValueMapToNotifications<TKVMap>>[]; // observers which are not of type NotificationsObserver
}

export interface INotificationsObservablePrivatesInternal<TKVMap extends KeyValueMapGenericConstraint<TKVMap>> extends IObservablePrivatesInternal<KeyValueMapToNotifications<TKVMap>> {
  [NOTIFICATIONS_OBSERVABLE_PRIVATE]: INotificationsObservablePrivate<TKVMap>;
}

export interface INotificationsObservableInternal<TKVMap extends KeyValueMapGenericConstraint<TKVMap>> extends INotificationsObservablePrivatesInternal<TKVMap>, INotificationsObservable<TKVMap> {
}
