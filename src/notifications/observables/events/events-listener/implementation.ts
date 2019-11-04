import { IEventsListener } from './interfaces';
import { ConstructClassWithPrivateMembers } from '../../../../misc/helpers/ClassWithPrivateMembers';
import { IsObject } from '../../../../helpers';

/** PRIVATES **/

export const EVENTS_LISTENER_PRIVATE = Symbol('events-listener-private');

export interface IEventsListenerPrivate {
}

export interface IEventsListenerPrivatesInternal {
  [EVENTS_LISTENER_PRIVATE]: IEventsListenerPrivate;
}

export interface IEventsListenerInternal extends IEventsListenerPrivatesInternal, IEventsListener {
}

/** CONSTRUCTOR **/

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
 * ABSTRACT CLASS
 */

export abstract class EventsListener implements IEventsListener {

  protected constructor() {
    ConstructEventsListener(this);
  }

  abstract addEventListener(event: string, listener: (...args: any[]) => void): void;

  abstract removeEventListener(event: string, listener: (...args: any[]) => void): void;
}

