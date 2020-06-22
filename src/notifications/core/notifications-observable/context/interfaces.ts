import { KeyValueMap, KeyValueMapKeys } from '../../types';
import { IObservableContextBase } from '../../../../core/observable/context/base/interfaces';
import { INotificationsObservable } from '../interfaces';
import { KeyValueMapToNotifications } from '../types';
import { IObservableContextConstructor } from '../../../../core/observable/context/interfaces';

/** INTERFACES **/

export interface INotificationsObservableContextStatic extends Omit<IObservableContextConstructor, 'new'> {
}

export interface INotificationsObservableContextConstructor extends INotificationsObservableContextStatic {
  // creates a NotificationsObservableContext
  new<TKVMap extends KeyValueMap>(observable: INotificationsObservable<TKVMap>): INotificationsObservableContext<TKVMap>;
}

export interface INotificationsObservableContext<TKVMap extends KeyValueMap> extends IObservableContextBase<KeyValueMapToNotifications<TKVMap>> {
  readonly observable: INotificationsObservable<TKVMap>;

  emit(value: KeyValueMapToNotifications<TKVMap>): void;

  dispatch<K extends KeyValueMapKeys<TKVMap>>(name: K, value: TKVMap[K]): void;
}
