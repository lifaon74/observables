import { KeyValueMapGenericConstraint, KeyValueMapKeys } from '../../interfaces';
import { IObservableContextBase } from '../../../../core/observable/context/base/interfaces';
import { INotificationsObservable } from '../interfaces';
import { KeyValueMapToNotifications } from '../types';

/** INTERFACES **/

export interface INotificationsObservableContextConstructor {
  // creates a NotificationsObservableContext
  new<TKVMap extends KeyValueMapGenericConstraint<TKVMap>>(observable: INotificationsObservable<TKVMap>): INotificationsObservableContext<TKVMap>;
}

export interface INotificationsObservableContext<TKVMap extends KeyValueMapGenericConstraint<TKVMap>> extends IObservableContextBase<KeyValueMapToNotifications<TKVMap>> {
  readonly observable: INotificationsObservable<TKVMap>;

  emit(value: KeyValueMapToNotifications<TKVMap>): void;

  dispatch<K extends KeyValueMapKeys<TKVMap>>(name: K, value: TKVMap[K]): void;
}
