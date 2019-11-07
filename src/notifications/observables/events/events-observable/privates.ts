import { EventKeyValueMapConstraint, IEventsObservable } from './interfaces';
import { IEventsListener } from '../events-listener/interfaces';
import { KeyValueMapKeys, KeyValueMapValues } from '../../../core/interfaces';
import { IObserver } from '../../../../core/observer/interfaces';
import { KeyValueMapToNotifications } from '../../../core/notifications-observable/types';
import { INotificationsObservablePrivatesInternal } from '../../../core/notifications-observable/privates';

/** PRIVATES **/

export const EVENTS_OBSERVABLE_PRIVATE = Symbol('events-observable-private');

export interface IEventsObservablePrivate<TKVMap extends EventKeyValueMapConstraint<TKVMap>, TTarget extends IEventsListener> {
  target: TTarget;
  name: KeyValueMapKeys<TKVMap> | null;
  observerListenerMap: WeakMap<IObserver<KeyValueMapToNotifications<TKVMap>>, (event: KeyValueMapValues<TKVMap>) => void>;
}

export interface IEventsObservablePrivatesInternal<TKVMap extends EventKeyValueMapConstraint<TKVMap>, TTarget extends IEventsListener> extends INotificationsObservablePrivatesInternal<TKVMap> {
  [EVENTS_OBSERVABLE_PRIVATE]: IEventsObservablePrivate<TKVMap, TTarget>;
}

export interface IEventsObservableInternal<TKVMap extends EventKeyValueMapConstraint<TKVMap>, TTarget extends IEventsListener> extends IEventsObservablePrivatesInternal<TKVMap, TTarget>, IEventsObservable<TKVMap, TTarget> {
}
