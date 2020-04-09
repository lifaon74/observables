import { IGenericEvent } from './interfaces';
import { IsObject } from '../../../../../../helpers';
import { GENERIC_EVENT_PRIVATE, IGenericEventInternal, IGenericEventPrivate } from './privates';
import { ConstructClassWithPrivateMembers } from '@lifaon/class-factory';

/** CONSTRUCTOR **/

export function ConstructGenericEvent<T>(
  instance: IGenericEvent<T>,
  value: T,
): void {
  ConstructClassWithPrivateMembers(instance, GENERIC_EVENT_PRIVATE);
  const privates: IGenericEventPrivate<T> = (instance as IGenericEventInternal<T>)[GENERIC_EVENT_PRIVATE];
  privates.value = value;
}

export function IsGenericEvent(value: any): value is IGenericEvent<any> {
  return IsObject(value)
    && value.hasOwnProperty(GENERIC_EVENT_PRIVATE as symbol);
}
