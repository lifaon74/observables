import { PureEventEmitter } from './event-emitter/types';
import { PureEventTarget } from './event-target/types';
import { IEventEmitterEventsListener } from './event-emitter/interfaces';
import { IEventTargetEventsListener } from './event-target/interfaces';
import { EventEmitterEventsListener } from './event-emitter/implementation';
import { IsEventEmitter } from './event-emitter/constructor';
import { IsEventTarget } from './event-target/constructor';


export type EventEmitterLike = PureEventEmitter | PureEventTarget;

export type InferEventsListenerFromEventEmitterLike<TTarget extends EventEmitterLike> = TTarget extends PureEventEmitter
  ? IEventEmitterEventsListener<TTarget>
  : (
    TTarget extends PureEventTarget
      ? IEventTargetEventsListener<TTarget>
      : never
    )
  ;

export function InferEventsListener<TTarget extends EventEmitterLike>(target: TTarget): InferEventsListenerFromEventEmitterLike<TTarget> {
  if (IsEventEmitter(target)) {
    return new EventEmitterEventsListener<PureEventEmitter>(target) as unknown as InferEventsListenerFromEventEmitterLike<TTarget>;
  } else if (IsEventTarget(target)) {
    return target as unknown as InferEventsListenerFromEventEmitterLike<TTarget>;
  } else {
    throw new TypeError(`Cannot infer the event emitter like type of target`);
  }
}
