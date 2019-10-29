import { IEventEmitterEventsListener, PureEventEmitter } from './interfaces';
import { ConstructClassWithPrivateMembers } from '../../../../../misc/helpers/ClassWithPrivateMembers';
import { EventsListener } from '../implementation';
import { IsObject } from '../../../../../helpers';
import { IEventLike } from '../event-like/interfaces';


export const EVENT_EMITTER_EVENTS_LISTENER_PRIVATE = Symbol('event-emitter-events-listener-private');

export interface IEventEmitterEventsListenerPrivate<TTarget extends PureEventEmitter> {
  target: TTarget;
  listenersMap: WeakMap<(event: IEventLike) => void, (...args: any) => void>;
}

export interface IEventEmitterEventsListenerInternal<TTarget extends PureEventEmitter> extends IEventEmitterEventsListener<TTarget> {
  [EVENT_EMITTER_EVENTS_LISTENER_PRIVATE]: IEventEmitterEventsListenerPrivate<TTarget>;
}

export function ConstructEventEmitterEventsListener<TTarget extends PureEventEmitter>(
  instance: IEventEmitterEventsListener<TTarget>,
  target: TTarget,
): void {
  ConstructClassWithPrivateMembers(instance, EVENT_EMITTER_EVENTS_LISTENER_PRIVATE);
  const privates: IEventEmitterEventsListenerPrivate<TTarget> = (instance as IEventEmitterEventsListenerInternal<TTarget>)[EVENT_EMITTER_EVENTS_LISTENER_PRIVATE];
  privates.target = target;
  privates.listenersMap = new WeakMap<(event: IEventLike) => void, (...args: any) => void>();
}

export function IsEventEmitterEventsListener(value: any): value is IEventEmitterEventsListener<any> {
  return IsObject(value)
    && value.hasOwnProperty(EVENT_EMITTER_EVENTS_LISTENER_PRIVATE as symbol);
}

/**
 * FUNCTIONS
 */
export function NormalizeNodeJSListenerValue(args: any[]): any {
  return (args.length === 0)
    ? void 0
    : (args.length === 1)
      ? args[0]
      : args;
}

/**
 * METHODS
 */

export function EventEmitterEventsListenerGetTarget<TTarget extends PureEventEmitter>(instance: IEventEmitterEventsListener<TTarget>): TTarget {
  return (instance as IEventEmitterEventsListenerInternal<TTarget>)[EVENT_EMITTER_EVENTS_LISTENER_PRIVATE].target;
}

export function EventEmitterEventsListenerAddEventListener<TTarget extends PureEventEmitter>(
  instance: IEventEmitterEventsListener<TTarget>,
  type: string,
  listener: (event: IEventLike) => void
): void {
  const privates: IEventEmitterEventsListenerPrivate<TTarget> = (instance as IEventEmitterEventsListenerInternal<TTarget>)[EVENT_EMITTER_EVENTS_LISTENER_PRIVATE];
  const _listener = (...args: any) => {
    listener.call(void 0, NormalizeNodeJSListenerValue(args));
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

/**
 * CLASS
 */
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

