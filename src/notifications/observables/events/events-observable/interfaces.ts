import { INotificationsObservable } from '../../../core/notifications-observable/interfaces';
import { KeyValueMapKeys } from '../../../core/types';
import { Targets } from '../events-listener/from/event-target/target-to-event-map';
import { IEventsListener } from '../events-listener/interfaces';
import { CastTargetToEventsObservable, EventKeyValueMapConstraint } from './types';

/** INTERFACES **/

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

/*-------------*/

// const a: IEventsObservableConstructor = null as any;
// const b = new a(window);
//
// const c = new a(new FileReader());
// .on('load', () => {
// })
// .on('resize', () => {
// });

// const a: AbortSignalEventMap extends { [key: string]: Event } ? true : false;
// const b: IEventsObservable<AbortSignalEventMap> = null;
// const b: IEventsObservable<AbortSignalEventMap & AbstractWorkerEventMap> = null;
// const b: IEventsObservable<{ a: 1 }> = null;
// const b: IEventsObservable<never> = null;
