import { IObservablePrivatesInternal } from '../../../../core/observable/privates';
import { IObservableHookPrivate } from '../../../../core/observable/hook/privates';
import { IObservableContext } from '../../../../core/observable/context/interfaces';
import { IObserver } from '../../../../core/observer/interfaces';
import { IDistinctValueObservable } from './interfaces';

/** PRIVATES **/

export const DISTINCT_VALUE_OBSERVABLE_PRIVATE = Symbol('distinct-value-observable-private');

export interface IDistinctValueObservablePrivate<T> extends IObservableHookPrivate<T> {
  context: IObservableContext<T>;
  value: T;
  count: number;
  lastCountPerObserver: WeakMap<IObserver<T>, number>;
}

export interface IDistinctValueObservablePrivatesInternal<T> extends IObservablePrivatesInternal<T> {
  [DISTINCT_VALUE_OBSERVABLE_PRIVATE]: IDistinctValueObservablePrivate<T>;
}

export interface IDistinctValueObservableInternal<T> extends IDistinctValueObservablePrivatesInternal<T>, IDistinctValueObservable<T> {
}
