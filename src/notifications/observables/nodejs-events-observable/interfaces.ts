import { INotificationsObservable } from '../../core/notifications-observable/interfaces';
import { KeyValueMapConstraint, KeyValueMapKeys } from '../../core/interfaces';


export type NodeJSEventsObservableKeyValueMapGeneric = {
  [key: string]: Event;
};

export type NodeJSEventKeyValueMapConstraint<TKVMap extends object> = KeyValueMapConstraint<TKVMap, NodeJSEventsObservableKeyValueMapGeneric>;



export interface PureNodeJSEventTarget {
  addListener(event: string | symbol, listener: (...args: any[]) => void): this;
  removeListener(event: string | symbol, listener: (...args: any[]) => void): this;
}


export interface INodeJSEventsObservableConstructor {
  new<TKVMap extends NodeJSEventKeyValueMapConstraint<TKVMap>, TTarget extends PureNodeJSEventTarget = PureNodeJSEventTarget>(target: TTarget, name?: KeyValueMapKeys<TKVMap> | null): INodeJSEventsObservable<TKVMap, TTarget>;
}



/**
 * An NodeJSEventsObservable is a wrapper around a NotificationsObservable,
 * which allows to listen to the Events emitted by 'target'.
 * To force an Event's type you may provide a 'name', else the Event's type will be determined by the NotificationsObservers observing it.
 */
export interface INodeJSEventsObservable<TKVMap extends NodeJSEventKeyValueMapConstraint<TKVMap>, TTarget extends PureNodeJSEventTarget = PureNodeJSEventTarget> extends INotificationsObservable<TKVMap> {
  // the target of the events' listener
  readonly target: TTarget;

  // optional name of the event to listen to
  readonly name: KeyValueMapKeys<TKVMap> | null;
}
