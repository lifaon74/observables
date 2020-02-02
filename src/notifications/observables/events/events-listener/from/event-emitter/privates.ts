import { PureEventEmitter } from './types';
import { IEventLike } from '../../event-like/interfaces';
import { IEventEmitterEventsListener } from './interfaces';
import { IEventsListenerPrivatesInternal } from '../../privates';

/** PRIVATES **/

export const EVENT_EMITTER_EVENTS_LISTENER_PRIVATE = Symbol('event-emitter-events-listener-private');

export interface IEventEmitterEventsListenerPrivate<TTarget extends PureEventEmitter> {
  target: TTarget;
  listenersMap: WeakMap<(event: IEventLike) => void, (...args: any) => void>;
}

export interface IEventEmitterEventsListenerPrivatesInternal<TTarget extends PureEventEmitter> extends IEventsListenerPrivatesInternal {
  [EVENT_EMITTER_EVENTS_LISTENER_PRIVATE]: IEventEmitterEventsListenerPrivate<TTarget>;
}

export interface IEventEmitterEventsListenerInternal<TTarget extends PureEventEmitter> extends IEventEmitterEventsListenerPrivatesInternal<TTarget>, IEventEmitterEventsListener<TTarget> {
}
