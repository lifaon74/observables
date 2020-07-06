import { IObserver } from '../observer/interfaces';
import { IReadonlyList } from '../../misc/readonly-list/interfaces';
import { IObservable } from './interfaces';
import { IObservableHookPrivate } from './hook/privates';

/** PRIVATES **/

export const OBSERVABLE_PRIVATE = Symbol('observable-private');

export interface IObservablePrivate<T> extends IObservableHookPrivate<T> {
  observers: IObserver<T>[];
  readOnlyObservers: IReadonlyList<IObserver<T>>;
  pendingEmit: T[];
  emitting: boolean;
}

export interface IObservablePrivatesInternal<T> {
  [OBSERVABLE_PRIVATE]: IObservablePrivate<T>;
}

export interface IObservableInternal<T> extends IObservablePrivatesInternal<T>, IObservable<T> {
}
