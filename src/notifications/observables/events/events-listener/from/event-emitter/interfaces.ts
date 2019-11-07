import { IEventsListener, IIEventsListenerConstructor } from '../../interfaces';
import { PureEventEmitter } from './types';

/**
 * INTERFACES
 */

/* CONSTRUCTOR */

export interface IEventEmitterEventsListenerConstructor extends Omit<IIEventsListenerConstructor, 'new'> {
  new<TTarget extends PureEventEmitter>(target: TTarget): IEventEmitterEventsListener<TTarget>;
}

export interface IEventEmitterEventsListenerTypedConstructor<TTarget extends PureEventEmitter> extends Omit<IIEventsListenerConstructor, 'new'> {
  new(target: TTarget): IEventEmitterEventsListener<TTarget>;
}

/* CLASS */

export interface IEventEmitterEventsListener<TTarget extends PureEventEmitter> extends IEventsListener {
  readonly target: TTarget;
}


