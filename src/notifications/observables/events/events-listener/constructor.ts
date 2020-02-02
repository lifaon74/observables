import { IEventsListener } from './interfaces';
import { IsObject } from '../../../../helpers';
import { EVENTS_LISTENER_PRIVATE } from './privates';
import { ConstructClassWithPrivateMembers } from '../../../../misc/helpers/ClassWithPrivateMembers';

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
