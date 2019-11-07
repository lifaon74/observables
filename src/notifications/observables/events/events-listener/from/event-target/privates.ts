import { PureEventTarget } from './types';
import { IEventsListenerPrivatesInternal } from '../../privates';
import { IEventTargetEventsListener } from './interfaces';

/** PRIVATES **/

export const EVENT_TARGET_EVENTS_LISTENER_PRIVATE = Symbol('event-target-events-listener-private');

export interface IEventTargetEventsListenerPrivate<TTarget extends PureEventTarget> {
  target: TTarget;
}

export interface IEventTargetEventsListenerPrivatesInternal<TTarget extends PureEventTarget> extends IEventsListenerPrivatesInternal {
  [EVENT_TARGET_EVENTS_LISTENER_PRIVATE]: IEventTargetEventsListenerPrivate<TTarget>;
}

export interface IEventTargetEventsListenerInternal<TTarget extends PureEventTarget> extends IEventTargetEventsListenerPrivatesInternal<TTarget>, IEventTargetEventsListener<TTarget> {
}
