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
  signal: AbortSignal | null;
}

export interface IFetchObservableInternal extends IFetchObservable, IPromiseObservableInternal<Response, Error, any> {
  [FETCH_OBSERVABLE_PRIVATE]: IFetchObservablePrivate;
}

export function ConstructFetchObservable(observable: IFetchObservable, requestInfo: RequestInfo, requestInit: RequestInit = {}): void {
  ConstructClassWithPrivateMembers(observable, FETCH_OBSERVABLE_PRIVATE);

  if ((typeof requestInfo === 'string') || (requestInfo instanceof Request)) {
    (observable as IFetchObservableInternal)[FETCH_OBSERVABLE_PRIVATE].requestInfo = requestInfo;
  } else {
    throw new TypeError(`Expected string or Request as first parameter of FetchObservable's constructor.`);
  }

  if ((typeof requestInit === 'object') && (requestInit !== null)) {
    (observable as IFetchObservableInternal)[FETCH_OBSERVABLE_PRIVATE].requestInit = requestInit;
  } else {
    throw new TypeError(`Expected RequestInit or void as second parameter of FetchObservable's constructor.`);
  }

  (observable as IFetchObservableInternal)[FETCH_OBSERVABLE_PRIVATE].signal = ExtractSignalFromFetchArguments(requestInfo, requestInit);
}

export function IsFetchObservable(value: any): value is IFetchObservable {
  return IsObject(value)
    && (FETCH_OBSERVABLE_PRIVATE in value);
}

/**
 * HELPERS - public
 */

/**
 * Returns the linked AbortSignal (if exists) of a fetch request
 * @param requestInfo
 * @param requestInit
 */
export function ExtractSignalFromFetchArguments(requestInfo: RequestInfo, requestInit: RequestInit = {}): AbortSignal | null {
  if ('AbortController' in self) {
    if (requestInit.signal instanceof AbortSignal) {
      return requestInit.signal;
    } else if (
      (requestInfo instanceof Request)
      && (requestInfo.signal instanceof AbortSignal)
    ) {
      return requestInfo.signal;
    } else {
      return null;
    }
  } else {
    return null;
  }
}

/**
 * Links a PromiseCancelToken with the fetch arguments.
 * Returns the modified RequestInit
 * @param token
 * @param requestInfo
 * @param requestInit
 */
export function LinkPromiseCancelTokenWithFetchArguments(token: IPromiseCancelToken, requestInfo: RequestInfo, requestInit?: RequestInit): RequestInit {
  if ('AbortController' in self) {
    const signal: AbortSignal | null = ExtractSignalFromFetchArguments(requestInfo, requestInit);
    if (signal === null) {
      const controller: AbortController = token.toAbortController();
      // shallow copy of RequestInit
      requestInit = (requestInit === void 0) ? {} : Object.assign({}, requestInit);
      requestInit.signal = controller.signal;
    } else {
      token.linkWithAbortSignal(signal);
    }
  }
  return requestInit;
}

/**
 * Just like the previous functions, but simplifies fetch calls:
 *  fetch(...LinkPromiseCancelTokenWithFetchArgumentsSpread(token, requestInfo, requestInit))
 * @param token
 * @param requestInfo
 * @param requestInit
 */
export function LinkPromiseCancelTokenWithFetchArgumentsSpread(token: IPromiseCancelToken, requestInfo: RequestInfo, requestInit?: RequestInit): [RequestInfo, RequestInit]  {
  return [requestInfo, LinkPromiseCancelTokenWithFetchArguments(token, requestInfo, requestInit)];
}


/**
 * IMPLEMENTATION
 */
export function FetchObservablePromiseFactory(observable: IFetchObservable, token: IPromiseCancelToken): Promise<Response> {
  let init: RequestInit = (observable as IFetchObservableInternal)[FETCH_OBSERVABLE_PRIVATE].requestInit;

  if ('AbortController' in self) {
    if ((observable as IFetchObservableInternal)[FETCH_OBSERVABLE_PRIVATE].signal === null) {
      const controller: AbortController = token.toAbortController();
      // shallow copy of RequestInit
      init = Object.assign({}, (observable as IFetchObservableInternal)[FETCH_OBSERVABLE_PRIVATE].requestInit);
      init.signal = controller.signal;
    } else {
      token.linkWithAbortSignal((observable as IFetchObservableInternal)[FETCH_OBSERVABLE_PRIVATE].signal);
    }
  }

  return fetch((observable as IFetchObservableInternal)[FETCH_OBSERVABLE_PRIVATE].requestInfo, init);
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

