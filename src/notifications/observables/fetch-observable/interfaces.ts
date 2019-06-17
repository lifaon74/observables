import {
  IPromiseNotificationKeyValueMap, IPromiseObservable, IPromiseObservableOptions
} from '../promise-observable/interfaces';
import { INotificationsObservable } from '../../core/notifications-observable/interfaces';

export type TFetchObservableKeyValueMap<TErrored = Error> = IPromiseNotificationKeyValueMap<Response, TErrored, any>;
export type TFetchObservableCastKeyValueMap<T, TErrored = Error> = IPromiseNotificationKeyValueMap<T, TErrored, any>;

export interface IFetchObservableOptions extends IPromiseObservableOptions{
  // fetch?: typeof fetch;
}

export interface IFetchObservableConstructor {
  new(requestInfo: RequestInfo, requestInit?: RequestInit, options?: IFetchObservableOptions): IFetchObservable;
}

/**
 * A FetchObservable is an Observable which will fetch a Request when observed.
 */
export interface IFetchObservable extends IPromiseObservable<Response, Error, any> {

  toJson<T>(): INotificationsObservable<TFetchObservableCastKeyValueMap<T, Error | Response>>;

  toText(): INotificationsObservable<TFetchObservableCastKeyValueMap<string, Error | Response>>;

  toArrayBuffer(): INotificationsObservable<TFetchObservableCastKeyValueMap<ArrayBuffer, Error | Response>>;

  toBlob(): INotificationsObservable<TFetchObservableCastKeyValueMap<Blob, Error | Response>>;

  toFormData(): INotificationsObservable<TFetchObservableCastKeyValueMap<FormData, Error | Response>>;

}
