import { IObservable } from '../../interfaces';
import { IObservableContextBase } from './interfaces';

/** PRIVATES **/

export const OBSERVABLE_CONTEXT_BASE_PRIVATE = Symbol('observable-context-base-private');

export interface IObservableContextBasePrivate<T> {
  observable: IObservable<T>;
}

export interface IObservableContextBasePrivatesInternal<T> {
  [OBSERVABLE_CONTEXT_BASE_PRIVATE]: IObservableContextBasePrivate<T>;
}

export interface IObservableContextBaseInternal<T> extends IObservableContextBasePrivatesInternal<T>, IObservableContextBase<T> {
}
