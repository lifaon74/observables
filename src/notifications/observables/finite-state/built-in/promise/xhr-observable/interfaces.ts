import { IFiniteStateObservable } from '../../../interfaces';
import {
  IXHRObservableKeyValueMap, IXHRObservableOptions, IXHRObservableRequestInit, TXHRObservableFinalState,
  TXHRObservableMode
} from './types';


/** INTERFACES **/

export interface IXHRObservableConstructor {
  new(requestInfo: RequestInfo, requestInit?: IXHRObservableRequestInit, options?: IXHRObservableOptions): IXHRObservable;
}

/**
 * A XHRObservable is an Observable which will fetch a Request when observed.
 */
export interface IXHRObservable extends IFiniteStateObservable<Response, TXHRObservableFinalState, TXHRObservableMode, IXHRObservableKeyValueMap> {

  // toJson<T>(): INotificationsObservable<TXHRObservableCastKeyValueMap<T>>;
  //
  // toText(): INotificationsObservable<TXHRObservableCastKeyValueMap<string>>;
  //
  // toArrayBuffer(): INotificationsObservable<TXHRObservableCastKeyValueMap<ArrayBuffer>>;
  //
  // toBlob(): INotificationsObservable<TXHRObservableCastKeyValueMap<Blob>>;
  //
  // toFormData(): INotificationsObservable<TXHRObservableCastKeyValueMap<FormData>>;

}
