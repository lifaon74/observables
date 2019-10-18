import { IFetchObservable, IFetchObservableOptions, TFetchObservableCastKeyValueMap } from './interfaces';
import { IPromiseObservableInternal, PromiseObservable } from '../promise-observable/implementation';
import { ConstructClassWithPrivateMembers } from '../../../../../misc/helpers/ClassWithPrivateMembers';
import { ICancelToken } from '../../../../../misc/cancel-token/interfaces';
import { INotificationsObservable } from '../../../../core/notifications-observable/interfaces';
import { promisePipe } from '../../../../../operators/pipes/promisePipe';
import { IsObject } from '../../../../../helpers';
import { TPromiseOrValue } from '../../../../../promises/interfaces';

export const FETCH_OBSERVABLE_PRIVATE = Symbol('fetch-observable-private');

export interface IFetchObservablePrivate {
  requestInfo: RequestInfo;
  requestInit: RequestInit;
  // fetch: typeof fetch;
}

export interface IFetchObservableInternal extends IFetchObservable, IPromiseObservableInternal<Response> {
  [FETCH_OBSERVABLE_PRIVATE]: IFetchObservablePrivate;
}

export function ConstructFetchObservable(
  instance: IFetchObservable,
  requestInfo: RequestInfo,
  requestInit?: RequestInit,
  options: IFetchObservableOptions = {}
): void {
  ConstructClassWithPrivateMembers(instance, FETCH_OBSERVABLE_PRIVATE);
  const privates: IFetchObservablePrivate = (instance as IFetchObservableInternal)[FETCH_OBSERVABLE_PRIVATE];

  if ((typeof requestInfo === 'string') || (requestInfo instanceof Request)) {
    privates.requestInfo = requestInfo;
  } else {
    throw new TypeError(`Expected string or Request as first parameter of FetchObservable's constructor.`);
  }

  if ((typeof requestInit === 'object') && (requestInit !== null)) {
    privates.requestInit = requestInit;
  } else if (requestInit !== void 0) {
    throw new TypeError(`Expected RequestInit or void as second parameter of FetchObservable's constructor.`);
  }

  // if (IsObject(options)) {
  //   if (options.fetch === void 0) {
  //     privates.fetch = window.fetch;
  //   } else if (typeof options.fetch === 'function') {
  //     privates.fetch = options.fetch;
  //   } else {
  //     throw new TypeError(`Expected function or void as options.fetch`);
  //   }
  // } else {
  //   throw new TypeError(`Expected object or void as third parameter of FetchObservable's constructor`);
  // }
}

export function IsFetchObservable(value: any): value is IFetchObservable {
  return IsObject(value)
    && value.hasOwnProperty(FETCH_OBSERVABLE_PRIVATE as symbol);
}

export function FetchObservablePromiseFactory(instance: IFetchObservable, token: ICancelToken): Promise<Response> {
  const privates: IFetchObservablePrivate = (instance as IFetchObservableInternal)[FETCH_OBSERVABLE_PRIVATE];
  return fetch(...token.wrapFetchArguments(
    privates.requestInfo,
    privates.requestInit,
  ));
}

export function FetchObservablePromiseTo<T>(instance: IFetchObservable, callback: (response: Response) => TPromiseOrValue<T>): INotificationsObservable<TFetchObservableCastKeyValueMap<T>> {
  return instance.pipeThrough(promisePipe<Response, T, never>((response: Response) => {
    if (response.ok) {
      return callback(response);
    } else {
      throw response;
    }
  }));
}


export class FetchObservable extends PromiseObservable<Response> implements IFetchObservable {

  constructor(requestInfo: RequestInfo, requestInit?: RequestInit, options?: IFetchObservableOptions) {
    super((token: ICancelToken): Promise<Response> => {
      return FetchObservablePromiseFactory(this, token);
    }, options);
    ConstructFetchObservable(this, requestInfo, requestInit, options);
  }

  toJson<T>(): INotificationsObservable<TFetchObservableCastKeyValueMap<T>> {
    return FetchObservablePromiseTo<T>(this, (response: Response) => response.json());
  }

  toText(): INotificationsObservable<TFetchObservableCastKeyValueMap<string>> {
    return FetchObservablePromiseTo<string>(this, (response: Response) => response.text());
  }

  toArrayBuffer(): INotificationsObservable<TFetchObservableCastKeyValueMap<ArrayBuffer>> {
    return FetchObservablePromiseTo<ArrayBuffer>(this, (response: Response) => response.arrayBuffer());
  }

  toBlob(): INotificationsObservable<TFetchObservableCastKeyValueMap<Blob>> {
    return FetchObservablePromiseTo<Blob>(this, (response: Response) => response.blob());
  }

  toFormData(): INotificationsObservable<TFetchObservableCastKeyValueMap<FormData>> {
    return FetchObservablePromiseTo<FormData>(this, (response: Response) => response.formData());
  }

}

