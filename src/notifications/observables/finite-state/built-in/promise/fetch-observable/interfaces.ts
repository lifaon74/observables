import { IPromiseObservable } from '../promise-observable/interfaces';
import { INotificationsObservable } from '../../../../../core/notifications-observable/interfaces';
import { IFetchObservableOptions, IFetchObservableRequestInit, TFetchObservableCastKeyValueMap } from './types';

/** INTERFACES **/

export interface IFetchObservableConstructor {
  new(requestInfo: RequestInfo, requestInit?: IFetchObservableRequestInit, options?: IFetchObservableOptions): IFetchObservable;
}

/**
 * A FetchObservable is an Observable which will fetch a Request when observed.
 */
export interface IFetchObservable extends IPromiseObservable<Response> {

  toJSON<T>(): INotificationsObservable<TFetchObservableCastKeyValueMap<T>>;

  toText(): INotificationsObservable<TFetchObservableCastKeyValueMap<string>>;

  toArrayBuffer(): INotificationsObservable<TFetchObservableCastKeyValueMap<ArrayBuffer>>;

  toBlob(): INotificationsObservable<TFetchObservableCastKeyValueMap<Blob>>;

  toFormData(): INotificationsObservable<TFetchObservableCastKeyValueMap<FormData>>;

}
