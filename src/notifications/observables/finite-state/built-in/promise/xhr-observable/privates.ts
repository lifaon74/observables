import { IFiniteStateObservablePrivatesInternal } from '../../../privates';
import { IXHRObservable} from './interfaces';
import { IXHRObservableKeyValueMap, TXHRObservableFinalState, TXHRObservableMode } from './types';

/** PRIVATES **/

export const XHR_OBSERVABLE_PRIVATE = Symbol('xhr-observable-private');

export interface IXHRObservablePrivate {
  requestInfo: RequestInfo;
  requestInit: RequestInit;
}

export interface IXHRObservablePrivatesInternal extends IFiniteStateObservablePrivatesInternal<Response, TXHRObservableFinalState, TXHRObservableMode, IXHRObservableKeyValueMap> {
  [XHR_OBSERVABLE_PRIVATE]: IXHRObservablePrivate;
}

export interface IXHRObservableInternal extends IXHRObservablePrivatesInternal, IXHRObservable {
}
