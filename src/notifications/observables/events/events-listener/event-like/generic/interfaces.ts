import { IEventLike, IEventLikeConstructor } from '../interfaces';

/**
 * INTERFACES
 */

/* CONSTRUCTOR */

export interface IGenericEventConstructor extends Omit<IEventLikeConstructor, 'new'> {
  new<T>(type: string, value: T): IGenericEvent<T>;
}

export interface IGenericEventTypesConstructor<T> extends Omit<IEventLikeConstructor, 'new'> {
  new(type: string, value: T): IGenericEvent<T>;
}

/* CLASS */

export interface IGenericEvent<T> extends IEventLike {
  readonly value: T;
}

