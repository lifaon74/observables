import { IFiniteStateObservablePrivatesInternal } from '../../../privates';
import {
  IFromIterableObservableKeyValueMap, TFromIterableObservableFinalState, TFromIterableObservableMode
} from './types';
import { IFromIterableObservable } from './interfaces';
import {
  TInferSyncOrAsyncIterableValueType, TSyncOrAsyncIterable
} from '../../../../../../misc/helpers/iterators/interfaces';

/** PRIVATES **/

export const FROM_ITERABLE_OBSERVABLE_PRIVATE = Symbol('from-iterable-observable-private');

export interface IFromIterableObservablePrivate<TIterable extends TSyncOrAsyncIterable<any>> {
  iterable: TIterable;
  isAsync: boolean;
}

export interface IFromIterableObservablePrivatesInternal<TIterable extends TSyncOrAsyncIterable<any>> extends IFiniteStateObservablePrivatesInternal<TInferSyncOrAsyncIterableValueType<TIterable>, TFromIterableObservableFinalState, TFromIterableObservableMode, IFromIterableObservableKeyValueMap<TIterable>> {
  [FROM_ITERABLE_OBSERVABLE_PRIVATE]: IFromIterableObservablePrivate<TIterable>;
}

export interface IFromIterableObservableInternal<TIterable extends TSyncOrAsyncIterable<any>> extends IFromIterableObservablePrivatesInternal<TIterable>, IFromIterableObservable<TIterable> {
}
