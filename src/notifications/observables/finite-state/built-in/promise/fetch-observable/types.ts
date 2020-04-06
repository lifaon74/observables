import { IPromiseObservableKeyValueMap, IPromiseObservableOptions } from '../promise-observable/types';

/** TYPES **/

export type IFetchObservableKeyValueMap = IPromiseObservableKeyValueMap<Response>;
export type TFetchObservableCastKeyValueMap<T> = IPromiseObservableKeyValueMap<T>;

export interface IFetchObservableRequestInit extends Omit<RequestInit, 'signal'> {
}

export interface IFetchObservableOptions extends IPromiseObservableOptions {
  // fetch?: typeof fetch;
}
