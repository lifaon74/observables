import { IEventLike } from '../events-listener/event-like/interfaces';
import { KeyValueMapConstraint } from '../../../core/interfaces';
import { Targets, TargetToEventMap } from '../events-listener/from/event-target/target-to-event-map';
import { IEventsListener } from '../events-listener/interfaces';
import { IEventsObservable } from './interfaces';

/** TYPES **/

export type EventsObservableKeyValueMapGeneric = {
  [key: string]: IEventLike;
};

export type EventKeyValueMapConstraint<TKVMap extends object> = KeyValueMapConstraint<TKVMap, EventsObservableKeyValueMapGeneric>;

export type PredefinedEventsObservables<A = TargetToEventMap> = A extends [infer TTarget, infer TKVMap]
  ? TTarget extends IEventsListener
    ? TKVMap extends object
      ? TKVMap extends EventKeyValueMapConstraint<TKVMap>
        ? IEventsObservable<TKVMap, TTarget>
        : never
      : never
    : never
  : never;

export type CastTargetToEventsObservable<T extends Targets> = Extract<PredefinedEventsObservables, IEventsObservable<any, T>>;
