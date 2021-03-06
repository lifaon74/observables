import { IEventEmitterEventsListener } from './interfaces';
import { IsObject } from '../../../../../../helpers';
import {
  EVENT_EMITTER_EVENTS_LISTENER_PRIVATE, IEventEmitterEventsListenerInternal, IEventEmitterEventsListenerPrivate
} from './privates';
import { PureEventEmitter } from './types';
import { ConstructClassWithPrivateMembers } from '../../../../../../misc/helpers/ClassWithPrivateMembers';
import { IEventLike } from '../../event-like/interfaces';

/** CONSTRUCTOR **/

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
