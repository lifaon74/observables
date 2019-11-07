import { IGenericEvent } from './interfaces';
import { IEventLikePrivatesInternal } from '../privates';

/** PRIVATES **/

export const GENERIC_EVENT_PRIVATE = Symbol('generic-event-private');

export interface IGenericEventPrivate<T> {
  value: T;
}

export interface IGenericEventPrivatesInternal<T> extends IEventLikePrivatesInternal {
  [GENERIC_EVENT_PRIVATE]: IGenericEventPrivate<T>;
}

export interface IGenericEventInternal<T> extends IGenericEventPrivatesInternal<T>, IGenericEvent<T> {
}
