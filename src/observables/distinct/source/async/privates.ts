import { IAsyncSource } from './interfaces';
import { IAsyncDistinctValueObservablePrivatesInternal } from '../../distinct-value-observable/async/privates';
import { IAsyncDistinctValueObservableContext } from '../../distinct-value-observable/async/context/interfaces';

/** PRIVATES **/

export const ASYNC_SOURCE_PRIVATE = Symbol('async-source-private');

export interface IAsyncSourcePrivate<T> {
  context: IAsyncDistinctValueObservableContext<T>;
}

export interface IAsyncSourcePrivatesInternal<T> extends IAsyncDistinctValueObservablePrivatesInternal<T> {
  [ASYNC_SOURCE_PRIVATE]: IAsyncSourcePrivate<T>;
}

export interface IAsyncSourceInternal<T> extends IAsyncSourcePrivatesInternal<T>, IAsyncSource<T> {

}
