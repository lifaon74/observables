import { IEventsListener } from './interfaces';
import { ConstructClassWithPrivateMembers } from '../../../../misc/helpers/ClassWithPrivateMembers';
import { IsObject } from '../../../../helpers';


export const EVENTS_LISTENER_PRIVATE = Symbol('events-listener-private');

export interface IEventsListenerPrivate {
}

export interface IEventsListenerInternal extends IEventsListener {
  [EVENTS_LISTENER_PRIVATE]: IEventsListenerPrivate;
}

export function ConstructEventsListener(
  instance: IEventsListener,
): void {
  ConstructClassWithPrivateMembers(instance, EVENTS_LISTENER_PRIVATE);
}

export function IsEventsListener(value: any): value is IEventsListener {
  return IsObject(value)
    && value.hasOwnProperty(EVENTS_LISTENER_PRIVATE as symbol);
}

/**
 * CLASS
 */

export abstract class EventsListener implements IEventsListener {

  protected constructor() {
    ConstructEventsListener(this);
  }

  abstract addEventListener(event: string, listener: (...args: any[]) => void): void;

  abstract removeEventListener(event: string, listener: (...args: any[]) => void): void;
}

