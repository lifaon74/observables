import { IEventLike } from './interfaces';

/** PRIVATES **/

export const EVENT_LIKE_PRIVATE = Symbol('event-like-private');

export interface IEventLikePrivate {
  type: string;
}

export interface IEventLikePrivatesInternal {
  [EVENT_LIKE_PRIVATE]: IEventLikePrivate;
}

export interface IEventLikeInternal extends IEventLikePrivatesInternal, IEventLike {
}
