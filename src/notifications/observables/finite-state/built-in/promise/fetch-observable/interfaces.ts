import { IPromiseObservable } from '../promise-observable/interfaces';
import { INotificationsObservable } from '../../../../../core/notifications-observable/interfaces';
import { IPromiseObservableKeyValueMap, IPromiseObservableOptions } from '../promise-observable/types';

export type IFetchObservableKeyValueMap = IPromiseObservableKeyValueMap<Response>;
export type TFetchObservableCastKeyValueMap<T> = IPromiseObservableKeyValueMap<T>;

export interface IFetchObservableOptions extends IPromiseObservableOptions {
  // fetch?: typeof fetch;
}

export interface IFetchObservableConstructor {
  new(requestInfo: RequestInfo, requestInit?: RequestInit, options?: IFetchObservableOptions): IFetchObservable;
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
