import { IPromiseObservablePrivatesInternal } from '../promise-observable/privates';
import { IFetchObservable } from './interfaces';

/** PRIVATES **/

export const FETCH_OBSERVABLE_PRIVATE = Symbol('fetch-observable-private');

export interface IFetchObservablePrivate {
  requestInfo: RequestInfo;
  requestInit: RequestInit;
  // fetch: typeof fetch;
}

export interface IFetchObservablePrivatesInternal extends IPromiseObservablePrivatesInternal<Response> {
  [FETCH_OBSERVABLE_PRIVATE]: IFetchObservablePrivate;
}

export interface IFetchObservableInternal extends IFetchObservablePrivatesInternal, IFetchObservable {
}
