import { IGenericEvent } from '../../event-like/generic/interfaces';

type EventEmitter = NodeJS.EventEmitter;

/**
 * TYPES
 */

export type PureEventEmitter =
  Pick<EventEmitter, 'addListener' | 'removeListener'>
  & Partial<Pick<EventEmitter, 'emit'>>;

export type TNodeJSListenerValueToGenericEventValue<T extends any[]> = T[0] | T;

export type RemapNodeJSEvents<TMap> = {
  [TKey in keyof TMap]: IGenericEvent<TMap[TKey]>;
}

