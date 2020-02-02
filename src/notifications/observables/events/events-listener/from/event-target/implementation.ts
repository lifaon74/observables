import { IEventTargetEventsListener } from './interfaces';
import { EventsListener } from '../../implementation';
import { IEventLike } from '../../event-like/interfaces';
import { PureEventTarget } from './types';
import { EVENT_TARGET_EVENTS_LISTENER_PRIVATE, IEventTargetEventsListenerInternal } from './privates';
import { ConstructEventTargetEventsListener } from './constructor';


/**
 * METHODS
 */

/* GETTERS/SETTERS */

export function EventTargetEventsListenerGetTarget<TTarget extends PureEventTarget>(instance: IEventTargetEventsListener<TTarget>): TTarget {
  return (instance as IEventTargetEventsListenerInternal<TTarget>)[EVENT_TARGET_EVENTS_LISTENER_PRIVATE].target;
}

export function EventTargetEventsListenerAddEventListener<TTarget extends PureEventTarget>(
  instance: IEventTargetEventsListener<TTarget>,
  type: string,
  listener: (event: IEventLike) => void
): void {
  instance.target.addEventListener(type, listener);
}

/* METHODS */

export function EventTargetEventsListenerRemoveEventListener<TTarget extends PureEventTarget>(
  instance: IEventTargetEventsListener<TTarget>,
  type: string,
  listener: (event: IEventLike) => void
): void {
  instance.target.removeEventListener(type, listener);
}

export function EventTargetEventsListenerDispatchEvent<TTarget extends PureEventTarget>(
  instance: IEventTargetEventsListener<TTarget>,
  event: Event,
): void {
  if (typeof instance.target.dispatchEvent === 'function') {
    instance.target.dispatchEvent(event);
  } else {
    throw new TypeError(`dispatchEvent is undefined`);
  }
}


/** CLASS **/

export class EventTargetEventsListener<TTarget extends PureEventTarget> extends EventsListener implements IEventTargetEventsListener<TTarget> {

  constructor(target: TTarget) {
    super();
    ConstructEventTargetEventsListener(this, target);
  }

  get target(): TTarget {
    return EventTargetEventsListenerGetTarget<TTarget>(this);
  }

  addEventListener(type: string, listener: (event: IEventLike) => void): void {
    return EventTargetEventsListenerAddEventListener<TTarget>(this, type, listener);
  }

  removeEventListener(type: string, listener: (event: IEventLike) => void): void {
    return EventTargetEventsListenerRemoveEventListener<TTarget>(this, type, listener);
  }

  dispatchEvent(event: Event): void {
    return EventTargetEventsListenerDispatchEvent<TTarget>(this, event);
  }
}

