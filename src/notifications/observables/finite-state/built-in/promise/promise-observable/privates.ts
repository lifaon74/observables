import { IFiniteStateObservablePrivatesInternal } from '../../../privates';
import { IPromiseObservableKeyValueMap, TPromiseObservableFinalState, TPromiseObservableMode } from './types';
import { IPromiseObservable } from './interfaces';

/** PRIVATES **/

export const PROMISE_OBSERVABLE_PRIVATE = Symbol('promise-observable-private');

export interface IPromiseObservablePrivate<T> {
}

export interface IPromiseObservablePrivatesInternal<T> extends IFiniteStateObservablePrivatesInternal<T, TPromiseObservableFinalState, TPromiseObservableMode, IPromiseObservableKeyValueMap<T>> {
  [PROMISE_OBSERVABLE_PRIVATE]: IPromiseObservablePrivate<T>;
}

export interface IPromiseObservableInternal<T> extends IPromiseObservablePrivatesInternal<T>, IPromiseObservable<T> {
}
