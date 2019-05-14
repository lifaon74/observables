import {
  IPromiseNotificationKeyValueMap, IPromiseObservable, IPromiseObservableOptions
} from '../promise-observable/interfaces';

export type TFetchObservableKeyValueMap = IPromiseNotificationKeyValueMap<Response, Error, any>;
export type TFetchObservableCastKeyValueMap<T> = IPromiseNotificationKeyValueMap<T, Error, any>;


export interface IFetchObservableConstructor {
  new(requestInfo: RequestInfo, requestInit?: RequestInit, options?: IPromiseObservableOptions): IFetchObservable;
}

/**
 * A FetchObservable is an Observable which will fetch a Request when observed.
 */
export interface IFetchObservable extends IPromiseObservable<Response, Error, any>  {
  // toJSON<T>(): INotificationsObservable<TPromiseNotificationType, T | Error | any>;
}
