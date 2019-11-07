import { EventEmitter } from 'events';

/**
 * TYPES
 */

export type PureEventEmitter =
  Pick<EventEmitter, 'addListener' | 'removeListener'>
  & Partial<Pick<EventEmitter, 'emit'>>;

export type TNodeJSListenerValueToGenericEventValue<T extends any[]> = T[0] | T;
