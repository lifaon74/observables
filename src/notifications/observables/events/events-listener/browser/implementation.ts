import { IEventTargetEventsListener, PureEventTarget } from './interfaces';
import { ConstructClassWithPrivateMembers } from '../../../../../misc/helpers/ClassWithPrivateMembers';
import { EventsListener } from '../implementation';
import { IsObject } from '../../../../../helpers';
import { IEventLike } from '../event-like/interfaces';


export const EVENT_TARGET_EVENTS_LISTENER_PRIVATE = Symbol('event-target-events-listener-private');

export interface IEventTargetEventsListenerPrivate<TTarget extends PureEventTarget> {
  target: TTarget;
}

export interface IEventTargetEventsListenerInternal<TTarget extends PureEventTarget> extends IEventTargetEventsListener<TTarget> {
  [EVENT_TARGET_EVENTS_LISTENER_PRIVATE]: IEventTargetEventsListenerPrivate<TTarget>;
}

export function ConstructEventTargetEventsListener<TTarget extends PureEventTarget>(
  instance: IEventTargetEventsListener<TTarget>,
  target: TTarget,
): void {
  ConstructClassWithPrivateMembers(instance, EVENT_TARGET_EVENTS_LISTENER_PRIVATE);
  const privates: IEventTargetEventsListenerPrivate<TTarget> = (instance as IEventTargetEventsListenerInternal<TTarget>)[EVENT_TARGET_EVENTS_LISTENER_PRIVATE];
  privates.target = target;
}

export function IsEventTargetEventsListener(value: any): value is IEventTargetEventsListener<any> {
  return IsObject(value)
    && value.hasOwnProperty(EVENT_TARGET_EVENTS_LISTENER_PRIVATE as symbol);
}


/**
 * METHODS
 */

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

/**
 * CLASS
 */
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

