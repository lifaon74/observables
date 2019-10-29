import { IEventLike } from '../interfaces';

/**
 * CLASS
 */

export interface IGenericEventConstructor {
  new<T>(type: string, value: T): IGenericEvent<T>;
}

export interface IGenericEvent<T> extends IEventLike {
  readonly value: T;
}

