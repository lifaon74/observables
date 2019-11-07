import { IEventsListener, IIEventsListenerConstructor } from '../../interfaces';
import { PureEventTarget } from './types';

/**
 * INTERFACES
 */


/* CONSTRUCTOR */

export interface IEventTargetEventsListenerConstructor extends Omit<IIEventsListenerConstructor, 'new'> {
  new<TTarget extends PureEventTarget>(target: TTarget): IEventTargetEventsListener<TTarget>;
}

export interface IEventTargetEventsListenerTypedConstructor<TTarget extends PureEventTarget> extends Omit<IIEventsListenerConstructor, 'new'> {
  new(target: TTarget): IEventTargetEventsListener<TTarget>;
}

/* CLASS */

export interface IEventTargetEventsListener<TTarget extends PureEventTarget> extends IEventsListener {
  readonly target: TTarget;

  dispatchEvent(event: Event): void;
}


