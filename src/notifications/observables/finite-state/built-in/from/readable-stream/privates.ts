import { IFromReadableStreamObservable } from './interfaces';
import { IFiniteStateObservablePrivatesInternal } from '../../../privates';
import {
  IFromReadableStreamObservableKeyValueMap, TFromReadableStreamObservableFinalState, TFromReadableStreamObservableMode
} from './types';

/** PRIVATES **/

export const FROM_READABLE_STREAM_OBSERVABLE_PRIVATE = Symbol('from-readable-stream-observable-private');

export interface IFromReadableStreamObservablePrivate<T> {
}

export interface IFromReadableStreamObservablePrivatesInternal<T> extends IFiniteStateObservablePrivatesInternal<T, TFromReadableStreamObservableFinalState, TFromReadableStreamObservableMode, IFromReadableStreamObservableKeyValueMap<T>> {
  [FROM_READABLE_STREAM_OBSERVABLE_PRIVATE]: IFromReadableStreamObservablePrivate<T>;
}

export interface IFromReadableStreamObservableInternal<T> extends IFromReadableStreamObservablePrivatesInternal<T>, IFromReadableStreamObservable<T> {
}
