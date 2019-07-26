import {
  KeyValueMapToNotifications
} from '../../../../core/notifications-observable/interfaces';
import {
  IFiniteStateObservable,
  IFiniteStateObservableExposedOptions,
  IFiniteStateObservableKeyValueMapGeneric, TFiniteStateObservableFinalState, TFiniteStateObservableMode
} from '../../interfaces';
import { IProgress } from '../../../../../misc/progress/interfaces';

/** TYPES **/

export type TXHRObservableFinalState = TFiniteStateObservableFinalState | 'cancel';
export type TXHRObservableMode = TFiniteStateObservableMode | 'every';

export interface IXHRObservableKeyValueMap extends IFiniteStateObservableKeyValueMapGeneric<Response, TXHRObservableFinalState> {
  'download-progress': IProgress;
  'cancel': any;
  'upload-complete': void;
  'upload-progress': IProgress;
}

export type TXHRObservableNotifications = KeyValueMapToNotifications<IXHRObservableKeyValueMap>;

export interface IXHRObservableOptions extends IFiniteStateObservableExposedOptions<TXHRObservableMode> {
}


/** INTERFACES **/

export interface IXHRObservableConstructor {
  new(requestInfo: RequestInfo, requestInit?: RequestInit, options?: IXHRObservableOptions): IXHRObservable;
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
