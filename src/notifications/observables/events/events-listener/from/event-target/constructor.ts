import { IEventTargetEventsListener } from './interfaces';
import { IsObject } from '../../../../../../helpers';
import {
  EVENT_TARGET_EVENTS_LISTENER_PRIVATE, IEventTargetEventsListenerInternal, IEventTargetEventsListenerPrivate
} from './privates';
import { PureEventTarget } from './types';
import { ConstructClassWithPrivateMembers } from '../../../../../../misc/helpers/ClassWithPrivateMembers';

/** CONSTRUCTOR **/

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
