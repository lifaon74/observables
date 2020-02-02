import { IEventsListener } from './interfaces';

/** PRIVATES **/

export const EVENTS_LISTENER_PRIVATE = Symbol('events-listener-private');

export interface IEventsListenerPrivate {
}

export interface IEventsListenerPrivatesInternal {
  [EVENTS_LISTENER_PRIVATE]: IEventsListenerPrivate;
}

export interface IEventsListenerInternal extends IEventsListenerPrivatesInternal, IEventsListener {
}
