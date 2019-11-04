import { IGenericEvent } from './interfaces';
import { EventLike } from '../implementation';
import { IsObject } from '../../../../../../helpers';
import { ConstructClassWithPrivateMembers } from '../../../../../../misc/helpers/ClassWithPrivateMembers';

/** PRIVATES **/

export const EVENT_LIKE_PRIVATE = Symbol('event-like-private');

export interface IGenericEventPrivate<T> {
  value: T;
}

export interface IGenericEventPrivatesInternal<T> {
  [EVENT_LIKE_PRIVATE]: IGenericEventPrivate<T>;
}

export interface IGenericEventInternal<T> extends IGenericEventPrivatesInternal<T>, IGenericEvent<T> {
}

/** CONSTRUCTOR **/

export function ConstructGenericEvent<T>(
  instance: IGenericEvent<T>,
  value: T,
): void {
  ConstructClassWithPrivateMembers(instance, EVENT_LIKE_PRIVATE);
  const privates: IGenericEventPrivate<T> = (instance as IGenericEventInternal<T>)[EVENT_LIKE_PRIVATE];
  privates.value = value;
}

export function IsGenericEvent(value: any): value is IGenericEvent<any> {
  return IsObject(value)
    && value.hasOwnProperty(EVENT_LIKE_PRIVATE as symbol);
}


/**
 * METHODS
 */

export function GenericEventGetValue<T>(instance: IGenericEvent<T>): T {
  return (instance as IGenericEventInternal<T>)[EVENT_LIKE_PRIVATE].value;
}

/**
 * CLASS
 */

export class GenericEvent<T> extends EventLike implements IGenericEvent<T> {

  protected constructor(type: string, value: T) {
    super(type);
    ConstructGenericEvent(this, value);
  }

  get value(): T {
    return GenericEventGetValue<T>(this);
  }
}

