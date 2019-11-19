import { ISource } from './interfaces';
import { IDistinctValueObservablePrivatesInternal } from '../../distinct-value-observable/sync/privates';
import { IDistinctValueObservableContext } from '../../distinct-value-observable/sync/context/interfaces';

/** PRIVATES **/

export const SOURCE_PRIVATE = Symbol('source-private');

export interface ISourcePrivate<T> {
  context: IDistinctValueObservableContext<T>;
}

export interface ISourcePrivatesInternal<T> extends IDistinctValueObservablePrivatesInternal<T> {
  [SOURCE_PRIVATE]: ISourcePrivate<T>;
}

export interface ISourceInternal<T> extends ISourcePrivatesInternal<T>, ISource<T> {
}
