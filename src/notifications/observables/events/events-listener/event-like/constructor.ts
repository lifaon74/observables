import { IEventLike } from './interfaces';
import { IsObject } from '../../../../../helpers';
import { EVENT_LIKE_PRIVATE, IEventLikeInternal, IEventLikePrivate } from './privates';
import { ConstructClassWithPrivateMembers } from '@lifaon/class-factory';

/** CONSTRUCTOR **/

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
