import { IFetchObservable, TFetchObservableCastKeyValueMap } from './interfaces';
import { IPromiseObservableInternal, PromiseObservable } from '../promise-observable/implementation';
import { ConstructClassWithPrivateMembers } from '../../../misc/helpers/ClassWithPrivateMembers';
import { IPromiseCancelToken } from '../promise-observable/promise-cancel-token/interfaces';
import { IPromiseObservableOptions } from '../promise-observable/interfaces';
import { INotificationsObservable } from '../../core/notifications-observable/interfaces';
import { promisePipe } from '../../../operators/pipes/promisePipe';
import { IsObject } from '../../../helpers';

export const FETCH_OBSERVABLE_PRIVATE = Symbol('fetch-observable-private');

export interface IFetchObservablePrivate {
  requestInfo: RequestInfo;
  requestInit: RequestInit;
}

export interface IFetchObservableInternal extends IFetchObservable, IPromiseObservableInternal<Response, Error, any> {
  [FETCH_OBSERVABLE_PRIVATE]: IFetchObservablePrivate;
}

export function ConstructFetchObservable(observable: IFetchObservable, requestInfo: RequestInfo, requestInit?: RequestInit): void {
  ConstructClassWithPrivateMembers(observable, FETCH_OBSERVABLE_PRIVATE);

  if ((typeof requestInfo === 'string') || (requestInfo instanceof Request)) {
    (observable as IFetchObservableInternal)[FETCH_OBSERVABLE_PRIVATE].requestInfo = requestInfo;
  } else {
    throw new TypeError(`Expected string or Request as first parameter of FetchObservable's constructor.`);
  }

  if ((typeof requestInit === 'object') && (requestInit !== null)) {
    (observable as IFetchObservableInternal)[FETCH_OBSERVABLE_PRIVATE].requestInit = requestInit;
  } else if (requestInit !== void 0) {
    throw new TypeError(`Expected RequestInit or void as second parameter of FetchObservable's constructor.`);
  }
}

export function IsFetchObservable(value: any): value is IFetchObservable {
  return IsObject(value)
    && (FETCH_OBSERVABLE_PRIVATE in value);
}


/**
 * IMPLEMENTATION
 */

export function FetchObservablePromiseFactory(observable: IFetchObservable, token: IPromiseCancelToken): Promise<Response> {
  return fetch(...token.wrapFetchArguments(
    (observable as IFetchObservableInternal)[FETCH_OBSERVABLE_PRIVATE].requestInfo,
    (observable as IFetchObservableInternal)[FETCH_OBSERVABLE_PRIVATE].requestInit,
  ));
}


export class FetchObservable extends PromiseObservable<Response, Error, any> implements IFetchObservable {

  constructor(requestInfo: RequestInfo, requestInit?: RequestInit, options?: IPromiseObservableOptions) {
    super((token: IPromiseCancelToken): Promise<Response> => {
      return FetchObservablePromiseFactory(this, token);
    }, options);
    ConstructFetchObservable(this, requestInfo, requestInit);
  }

  toJSON<T>(): INotificationsObservable<TFetchObservableCastKeyValueMap<T>> {
    return this.pipeThrough(promisePipe<Response, T, Error, any>((response: Response) => response.json()));
  }

  toText(): INotificationsObservable<TFetchObservableCastKeyValueMap<string>> {
    return this.pipeThrough(promisePipe<Response, string, Error, any>((response: Response) => response.text()));
  }

  toArrayBuffer(): INotificationsObservable<TFetchObservableCastKeyValueMap<ArrayBuffer>> {
    return this.pipeThrough(promisePipe<Response, ArrayBuffer, Error, any>((response: Response) => response.arrayBuffer()));
  }

  toBlob(): INotificationsObservable<TFetchObservableCastKeyValueMap<Blob>> {
    return this.pipeThrough(promisePipe<Response, Blob, Error, any>((response: Response) => response.blob()));
  }

  toFormData(): INotificationsObservable<TFetchObservableCastKeyValueMap<FormData>> {
    return this.pipeThrough(promisePipe<Response, FormData, Error, any>((response: Response) => response.formData()));
  }

}

