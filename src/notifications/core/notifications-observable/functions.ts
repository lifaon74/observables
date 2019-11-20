import { INotificationsObservableMatchOptions, KeyValueMapToNotificationsObservers } from './types';
import { IsObject } from '../../../helpers';
import { KeyValueMapGenericConstraint, KeyValueMapKeys } from '../interfaces';
import { INotificationsObservable } from './interfaces';
import { INotification } from '../notification/interfaces';
import {
  INotificationsObservableInternal, INotificationsObservablePrivate, NOTIFICATIONS_OBSERVABLE_PRIVATE
} from './privates';
import { Notification } from '../notification/implementation';
import { IObserverInternal, OBSERVER_PRIVATE } from '../../../core/observer/privates';
import { IObservable } from '../../../core/observable/interfaces';

/** FUNCTIONS **/

export type INotificationsObservableMatchOptionStrict = Required<INotificationsObservableMatchOptions>;

export function NormalizeNotificationsObservableMatchOptions(options: INotificationsObservableMatchOptions = {}): INotificationsObservableMatchOptionStrict {
  if (IsObject(options)) {
    const _options: INotificationsObservableMatchOptionStrict = {} as INotificationsObservableMatchOptionStrict;

    _options.includeGlobalObservers = Boolean(options.includeGlobalObservers);

    return _options;
  } else {
    throw new TypeError(`Expected object or void as options`);
  }
}

/**
 * Dispatches a Notification with 'name' and 'value' for all the observers observing this instance
 */
export function NotificationsObservableDispatch<TKVMap extends KeyValueMapGenericConstraint<TKVMap>, K extends KeyValueMapKeys<TKVMap>>(
  instance: INotificationsObservable<TKVMap>,
  name: K,
  value: TKVMap[K],
  notification?: INotification<K, TKVMap[K]>
): void {
  const privates: INotificationsObservablePrivate<TKVMap> = (instance as INotificationsObservableInternal<TKVMap>)[NOTIFICATIONS_OBSERVABLE_PRIVATE];

  if (privates.observersMap.has(name as KeyValueMapKeys<TKVMap>)) {
    const observers: KeyValueMapToNotificationsObservers<TKVMap>[] = (privates.observersMap.get(name as KeyValueMapKeys<TKVMap>) as KeyValueMapToNotificationsObservers<TKVMap>[]).slice(0);
    for (let i = 0, l = observers.length; i < l; i++) {
      observers[i].callback(value);
    }
  }

  const length: number = privates.othersObservers.length;
  if (length > 0) {
    if (notification === void 0) {
      notification = new Notification<K, TKVMap[K]>(name, value);
    }
    for (let i = 0; i < length; i++) {
      ((privates.othersObservers[i] as unknown) as IObserverInternal<INotification<K, TKVMap[K]>>)[OBSERVER_PRIVATE].onEmit(notification, (instance as unknown) as IObservable<INotification<K, TKVMap[K]>>);
    }
  }
}
