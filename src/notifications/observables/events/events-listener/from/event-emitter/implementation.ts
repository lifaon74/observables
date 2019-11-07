import { IEventEmitterEventsListener } from './interfaces';
import { EventsListener } from '../../implementation';
import { IEventLike } from '../../event-like/interfaces';
import { PureEventEmitter } from './types';
import {
  EVENT_EMITTER_EVENTS_LISTENER_PRIVATE, IEventEmitterEventsListenerInternal, IEventEmitterEventsListenerPrivate
} from './privates';
import { NodeJSListenerValueToGenericEvent, NormalizeNodeJSListenerValue } from './functions';
import { ConstructEventEmitterEventsListener } from './constructor';


/**
 * METHODS
 */

/* GETTERS/SETTERS */

export function EventEmitterEventsListenerGetTarget<TTarget extends PureEventEmitter>(instance: IEventEmitterEventsListener<TTarget>): TTarget {
  return (instance as IEventEmitterEventsListenerInternal<TTarget>)[EVENT_EMITTER_EVENTS_LISTENER_PRIVATE].target;
}


/* METHODS */

export function EventEmitterEventsListenerAddEventListener<TTarget extends PureEventEmitter>(
  instance: IEventEmitterEventsListener<TTarget>,
  type: string,
  listener: (event: IEventLike) => void
): void {
  const privates: IEventEmitterEventsListenerPrivate<TTarget> = (instance as IEventEmitterEventsListenerInternal<TTarget>)[EVENT_EMITTER_EVENTS_LISTENER_PRIVATE];
  const _listener = (...args: any) => {
    listener.call(void 0, NodeJSListenerValueToGenericEvent(type, args));
  };
  privates.listenersMap.set(listener, _listener);
  instance.target.addListener(type, _listener);
}


export function EventEmitterEventsListenerRemoveEventListener<TTarget extends PureEventEmitter>(
  instance: IEventEmitterEventsListener<TTarget>,
  type: string,
  listener: (event: IEventLike) => void
): void {
  const privates: IEventEmitterEventsListenerPrivate<TTarget> = (instance as IEventEmitterEventsListenerInternal<TTarget>)[EVENT_EMITTER_EVENTS_LISTENER_PRIVATE];
  if (privates.listenersMap.has(listener)) {
    const _listener = privates.listenersMap.get(listener) as (...args: any) => void;
    instance.target.removeListener(type, _listener);
  }
}

export function EventEmitterEventsListenerDispatchEvent<TTarget extends PureEventEmitter>(
  instance: IEventEmitterEventsListener<TTarget>,
  event: IEventLike
): boolean {
  if (typeof instance.target.emit === 'function') {
    return instance.target.emit(event.type, event);
  } else {
    throw new TypeError(`dispatchEvent is undefined`);
  }
}


/** CLASS **/

export class EventEmitterEventsListener<TTarget extends PureEventEmitter> extends EventsListener implements IEventEmitterEventsListener<TTarget> {

  constructor(target: TTarget) {
    super();
    ConstructEventEmitterEventsListener(this, target);
  }

  get target(): TTarget {
    return EventEmitterEventsListenerGetTarget<TTarget>(this);
  }

  addEventListener(type: string, listener: (event: IEventLike) => void): void {
    return EventEmitterEventsListenerAddEventListener<TTarget>(this, type, listener);
  }

  removeEventListener(type: string, listener: (event: IEventLike) => void): void {
    return EventEmitterEventsListenerRemoveEventListener<TTarget>(this, type, listener);
  }

  dispatchEvent(event: IEventLike): boolean {
    return EventEmitterEventsListenerDispatchEvent<TTarget>(this, event);
  }
}

