import { IEventLike } from './interfaces';
import { ConstructClassWithPrivateMembers } from '../../../../../misc/helpers/ClassWithPrivateMembers';
import { IsObject } from '../../../../../helpers';

export const EVENT_LIKE_PRIVATE = Symbol('event-like-private');

export interface IEventLikePrivate {
  type: string;
}

export interface IEventLikeInternal extends IEventLike {
  [EVENT_LIKE_PRIVATE]: IEventLikePrivate;
}

export function ConstructEventLike(
  instance: IEventLike,
  type: string,
): void {
  ConstructClassWithPrivateMembers(instance, EVENT_LIKE_PRIVATE);
  const privates: IEventLikePrivate = (instance as IEventLikeInternal)[EVENT_LIKE_PRIVATE];
  privates.type = type;
}

export function IsEventLike(value: any): value is IEventLike {
  return IsObject(value)
    && value.hasOwnProperty(EVENT_LIKE_PRIVATE as symbol);
}


export function EventLikeGetType(instance: IEventLike): string {
  return (instance as IEventLikeInternal)[EVENT_LIKE_PRIVATE].type;
}

/**
 * CLASS
 */

export abstract class EventLike implements IEventLike {

  protected constructor(type: string) {
    ConstructEventLike(this, type);
  }

  get type(): string {
    return EventLikeGetType(this);
  }
}

