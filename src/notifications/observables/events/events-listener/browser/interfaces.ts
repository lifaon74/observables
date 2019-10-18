import { IEventsListener, IIEventsListenerConstructor } from '../interfaces';

/**
 * INTERFACES & TYPES
 */
export type PureEventTarget = Pick<EventTarget, 'addEventListener' | 'removeEventListener'> & Partial<Pick<EventTarget, 'dispatchEvent'>>;

/**
 * CLASS
 */

export interface IEventTargetEventsListenerConstructor extends Omit<IIEventsListenerConstructor, 'new'> {
  new<TTarget extends PureEventTarget>(target: TTarget): IEventTargetEventsListener<TTarget>;
}

export interface IEventTargetEventsListener<TTarget extends PureEventTarget> extends IEventsListener {
  readonly target: TTarget;

  dispatchEvent(event: Event): void;
}


