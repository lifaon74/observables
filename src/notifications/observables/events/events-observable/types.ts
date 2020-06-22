import { IEventLike } from '../events-listener/event-like/interfaces';
import { Targets, TargetToEventMap } from '../events-listener/from/event-target/target-to-event-map';
import { IEventsListener } from '../events-listener/interfaces';
import { IEventsObservable } from './interfaces';
import { KeyValueMapConstraint } from '../../../core/types';

/** TYPES **/

// export type EventKeyValueMapConstraint = { [key: string]: IEventLike };
export type EventsObservableKeyValueMapGeneric = { [key: string]: IEventLike };
export type EventKeyValueMapConstraint<TKVMap> = KeyValueMapConstraint<TKVMap, EventsObservableKeyValueMapGeneric>;


export type PredefinedEventsObservables<A = TargetToEventMap> = A extends [infer TTarget, infer TKVMap]
  ? TTarget extends IEventsListener
    ? TKVMap extends EventKeyValueMapConstraint<TKVMap>
      ? IEventsObservable<TKVMap, TTarget>
      : never
    : never
  : never;

export type CastTargetToEventsObservable<T extends Targets> = Extract<PredefinedEventsObservables, IEventsObservable<any, T>>;


