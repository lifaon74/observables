import { INotificationsObservable } from '../../../core/notifications-observable/interfaces';
import { KeyValueMapConstraint, KeyValueMapKeys } from '../../../core/interfaces';
import { Targets, TargetToEventMap } from '../events-listener/browser/target-to-event-map';
import { IEventsListener } from '../events-listener/interfaces';
import { IEventLike } from '../events-listener/event-like/interfaces';


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

// interface A {
//   // new<T extends EventTarget>(target: T): Cast;
//   new<T extends EventTarget>(target: T): CastTargetToEventsObservable<T>;
// }
//
// const _a: A = null;
// const __a = new _a(window);


export interface IEventsObservableConstructor {
  new<TTarget extends Targets>(target: TTarget): CastTargetToEventsObservable<TTarget>;
  new<TKVMap extends EventKeyValueMapConstraint<TKVMap>, TTarget extends IEventsListener = IEventsListener>(target: TTarget, name?: KeyValueMapKeys<TKVMap> | null): IEventsObservable<TKVMap, TTarget>;
}


/**
 * An EventsObservable is a wrapper around a NotificationsObservable,
 * which allows to listen to the Events emitted by 'target'.
 * To force an Event's type you may provide a 'name', else the Event's type will be determined by the NotificationsObservers observing it.
 */
export interface IEventsObservable<TKVMap extends EventKeyValueMapConstraint<TKVMap>, TTarget extends IEventsListener = IEventsListener> extends INotificationsObservable<TKVMap> {
  // the target of the events' listener
  readonly target: TTarget;

  // optional name of the event to listen to
  readonly name: KeyValueMapKeys<TKVMap> | null;
}

// const a: IEventsObservableConstructor = null;
// const b = new a(window);
//
// new a(new FileReader())
//   .on('load', () => {
//   })
//   .on('resize', () => {
//   });

// const a: AbortSignalEventMap extends { [key: string]: Event } ? true : false;
// const b: IEventsObservable<AbortSignalEventMap> = null;
// const b: IEventsObservable<AbortSignalEventMap & AbstractWorkerEventMap> = null;
// const b: IEventsObservable<{ a: 1 }> = null;
// const b: IEventsObservable<never> = null;
