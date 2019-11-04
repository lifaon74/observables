import { EventEmitter } from 'events';

/**
 * TYPES
 */

export type PureEventEmitter =
  Pick<EventEmitter, 'addListener' | 'removeListener'>
  & Partial<Pick<EventEmitter, 'emit'>>;
