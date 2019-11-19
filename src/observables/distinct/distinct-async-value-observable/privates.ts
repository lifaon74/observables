import { IDistinctValueObservablePrivatesInternal } from '../distinct-value-observable/privates';
import { IAsyncDistinctValueObservable } from './interfaces';
import { IObservableHookPrivate } from '../../../core/observable/hook/privates';
import { IDistinctValueObservableContext } from '../distinct-value-observable/context/interfaces';
import { IAdvancedAbortController } from '../../../misc/advanced-abort-controller/interfaces';

/** PRIVATES **/

export const DISTINCT_ASYNC_VALUE_OBSERVABLE_PRIVATE = Symbol('distinct-async-value-observable-private');

export interface IAsyncDistinctValueObservablePrivate<T> extends IObservableHookPrivate<T> {
  context: IDistinctValueObservableContext<T>;
  promise: Promise<T> | null;
  controller: IAdvancedAbortController | null;
}

export interface IAsyncDistinctValueObservablePrivatesInternal<T> extends IDistinctValueObservablePrivatesInternal<T> {
  [DISTINCT_ASYNC_VALUE_OBSERVABLE_PRIVATE]: IAsyncDistinctValueObservablePrivate<T>;
}

export interface IAsyncDistinctValueObservableInternal<T> extends IAsyncDistinctValueObservablePrivatesInternal<T>, IAsyncDistinctValueObservable<T> {
}
