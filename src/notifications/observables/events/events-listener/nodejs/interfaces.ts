import { IEventsListener, IIEventsListenerConstructor } from '../interfaces';
import EventEmitter = NodeJS.EventEmitter;

/**
 * INTERFACES & TYPES
 */
export type PureEventEmitter = Pick<EventEmitter, 'addListener' | 'removeListener'> & Partial<Pick<EventEmitter, 'emit'>>;


/**
 * CLASS
 */

export interface IEventEmitterEventsListenerConstructor extends Omit<IIEventsListenerConstructor, 'new'> {
  new<TTarget extends PureEventEmitter>(target: TTarget): IEventEmitterEventsListener<TTarget>;
}

export interface IEventEmitterEventsListener<TTarget extends PureEventEmitter> extends IEventsListener {
  readonly target: TTarget;
}


