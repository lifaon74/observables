import { KeyValueMapGenericConstraint, KeyValueMapKeys, KeyValueMapValues } from '../../interfaces';
import { INotificationsObservable } from '../interfaces';
import { INotificationsObservableContext, INotificationsObservableContextConstructor } from './interfaces';
import { AllowObservableContextBaseConstruct } from '../../../../core/observable/context/base/constructor';
import { ObservableContextBase } from '../../../../core/observable/context/base/implementation';
import { KeyValueMapToNotifications } from '../types';
import {
  IObservableContextBaseInternal, OBSERVABLE_CONTEXT_BASE_PRIVATE
} from '../../../../core/observable/context/base/privates';
import { NotificationsObservableDispatch } from '../functions';

/** NEW **/

export function NewNotificationsObservableContext<TKVMap extends KeyValueMapGenericConstraint<TKVMap>>(notificationsObservable: INotificationsObservable<TKVMap>): INotificationsObservableContext<TKVMap> {
  AllowObservableContextBaseConstruct(true);
  const context: INotificationsObservableContext<TKVMap> = new (NotificationsObservableContext as INotificationsObservableContextConstructor)<TKVMap>(notificationsObservable);
  AllowObservableContextBaseConstruct(false);
  return context;
}

/** METHODS **/

export function NotificationsObservableContextEmit<TKVMap extends KeyValueMapGenericConstraint<TKVMap>>(instance: INotificationsObservableContext<TKVMap>, notification: KeyValueMapToNotifications<TKVMap>): void {
  NotificationsObservableDispatch<TKVMap, KeyValueMapKeys<TKVMap>>(
    ((instance as unknown) as IObservableContextBaseInternal<KeyValueMapToNotifications<TKVMap>>)[OBSERVABLE_CONTEXT_BASE_PRIVATE].observable as INotificationsObservable<TKVMap>,
    notification.name as KeyValueMapKeys<TKVMap>,
    notification.value as KeyValueMapValues<TKVMap>,
    notification
  );
}

export function NotificationsObservableContextDispatch<TKVMap extends KeyValueMapGenericConstraint<TKVMap>, K extends KeyValueMapKeys<TKVMap>>(
  instance: INotificationsObservableContext<TKVMap>,
  name: K,
  value: TKVMap[K]
): void {
  NotificationsObservableDispatch<TKVMap, K>(((instance as unknown) as IObservableContextBaseInternal<KeyValueMapToNotifications<TKVMap>>)[OBSERVABLE_CONTEXT_BASE_PRIVATE].observable as INotificationsObservable<TKVMap>, name, value);
}


/** CLASS **/

export class NotificationsObservableContext<TKVMap extends KeyValueMapGenericConstraint<TKVMap>> extends ObservableContextBase<KeyValueMapToNotifications<TKVMap>> implements INotificationsObservableContext<TKVMap> {
  protected constructor(observable: INotificationsObservable<TKVMap>) {
    super(observable);
  }

  get observable(): INotificationsObservable<TKVMap> {
    // @ts-ignore
    return super.observable as any as INotificationsObservable<TKVMap>;
  }

  emit(value: KeyValueMapToNotifications<TKVMap>): void {
    NotificationsObservableContextEmit<TKVMap>(this, value);
  }

  dispatch<K extends KeyValueMapKeys<TKVMap>>(name: K, value: TKVMap[K]): void {
    NotificationsObservableContextDispatch<TKVMap, K>(this, name, value);
    // this.emit(new Notification<TKVMap>(name, value));
  }

}

