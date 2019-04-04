import { KeyValueMapGeneric, KeyValueMapKeys, KeyValueMapValues } from '../interfaces';

export interface INotificationConstructor {
  // converts an Event to a Notification
  fromEvent<N extends string = string, T extends Event = Event>(event: T): INotification<Record<N, T>>;

  new<TKVMap extends KeyValueMapGeneric>(name: KeyValueMapKeys<TKVMap>, value?: KeyValueMapValues<TKVMap>): INotification<TKVMap>;
}

/**
 * A notification is a tuple containing a name and a value.
 *  Its purpose its to associate a key with a value to allow filtering at the end of the pipe.
 *  @Example:
 *    const notification = new Notification<Record<'click', Event>, 'click'>()
 */
export interface INotification<TKVMap extends KeyValueMapGeneric> {
  readonly name: KeyValueMapKeys<TKVMap>;
  readonly value: KeyValueMapValues<TKVMap>;
}

export type TPickNotification<TKVMap, K extends keyof TKVMap> = INotification<Pick<TKVMap, K>>;
export type TRecordNotification<K extends string, T> = INotification<{ [_K in K]: T }>;
