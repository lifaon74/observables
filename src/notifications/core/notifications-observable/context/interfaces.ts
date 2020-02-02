import { KeyValueMapGenericConstraint, KeyValueMapKeys } from '../../interfaces';
import { IObservableContextBase } from '../../../../core/observable/context/base/interfaces';
import { INotificationsObservable } from '../interfaces';
import { KeyValueMapToNotifications } from '../types';
import { IObservableContextConstructor } from '../../../../core/observable/context/interfaces';

/** INTERFACES **/

export interface INotificationsObservableContextStatic extends Omit<IObservableContextConstructor, 'new'> {
}

export interface INotificationsObservableContextConstructor extends INotificationsObservableContextStatic {
  // creates a NotificationsObservableContext
  new<TKVMap extends KeyValueMapGenericConstraint<TKVMap>>(observable: INotificationsObservable<TKVMap>): INotificationsObservableContext<TKVMap>;
}

export interface INotificationsObservableContext<TKVMap extends KeyValueMapGenericConstraint<TKVMap>> extends IObservableContextBase<KeyValueMapToNotifications<TKVMap>> {
  readonly observable: INotificationsObservable<TKVMap>;

  emit(value: KeyValueMapToNotifications<TKVMap>): void;

  dispatch<K extends KeyValueMapKeys<TKVMap>>(name: K, value: TKVMap[K]): void;
}
