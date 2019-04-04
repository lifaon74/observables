import { INotification } from './interfaces';
import { ConstructClassWithPrivateMembers } from '../../../misc/helpers/ClassWithPrivateMembers';
import { KeyValueMapGeneric, KeyValueMapKeys, KeyValueMapValues } from '../interfaces';


export const NOTIFICATION_PRIVATE = Symbol('notification-private');

export interface INotificationPrivate<TKVMap extends KeyValueMapGeneric,> {
  name: KeyValueMapKeys<TKVMap>;
  value: KeyValueMapValues<TKVMap>;
}

export interface INotificationInternal<TKVMap extends KeyValueMapGeneric> {
  [NOTIFICATION_PRIVATE]: INotificationPrivate<TKVMap>;
}

export class Notification<TKVMap extends KeyValueMapGeneric> implements INotification<TKVMap> {

  static fromEvent<N extends string = string, T extends Event = Event>(event: T): INotification<Record<N, T>> {
    return new Notification<Record<N, T>>(event.type as Extract<N, string>, event);
  }

  constructor(name: KeyValueMapKeys<TKVMap>, value: KeyValueMapValues<TKVMap> = void 0) {
    ConstructClassWithPrivateMembers(this, NOTIFICATION_PRIVATE);
    ((this as unknown) as INotificationInternal<TKVMap>)[NOTIFICATION_PRIVATE].name = name;
    ((this as unknown) as INotificationInternal<TKVMap>)[NOTIFICATION_PRIVATE].value = value;
  }

  get name(): KeyValueMapKeys<TKVMap> {
    return ((this as unknown) as INotificationInternal<TKVMap>)[NOTIFICATION_PRIVATE].name;
  }

  get value(): KeyValueMapValues<TKVMap> {
    return ((this as unknown) as INotificationInternal<TKVMap>)[NOTIFICATION_PRIVATE].value;
  }

}
