import {
  IXHRObservable, IXHRObservableKeyValueMap, IXHRObservableOptions, TXHRObservableFinalState, TXHRObservableMode
} from './interfaces';
import { ConstructClassWithPrivateMembers } from '../../../../../misc/helpers/ClassWithPrivateMembers';
import { IsObject } from '../../../../../helpers';
import { FiniteStateObservable } from '../../implementation';
import { GenerateFiniteStateObservableHookFromXHR } from './hook-generators';
import { TFiniteStateObservableCreateCallback } from '../../interfaces';

export const XHR_OBSERVABLE_PRIVATE = Symbol('xhr-observable-private');

export interface IXHRObservablePrivate {
  requestInfo: RequestInfo;
  requestInit: RequestInit;
}

export interface IXHRObservableInternal extends IXHRObservable {
  [XHR_OBSERVABLE_PRIVATE]: IXHRObservablePrivate;
}

export function ConstructXHRObservable(
  instance: IXHRObservable,
  requestInfo: RequestInfo,
  requestInit?: RequestInit,
  options: IXHRObservableOptions = {}
): void {
  ConstructClassWithPrivateMembers(instance, XHR_OBSERVABLE_PRIVATE);
  const privates: IXHRObservablePrivate = (instance as IXHRObservableInternal)[XHR_OBSERVABLE_PRIVATE];

  if ((typeof requestInfo === 'string') || (requestInfo instanceof Request)) {
    privates.requestInfo = requestInfo;
  } else {
    throw new TypeError(`Expected string or Request as first parameter of XHRObservable's constructor.`);
  }

  if (IsObject(requestInit)) {
    privates.requestInit = requestInit;
  } else if (requestInit !== void 0) {
    throw new TypeError(`Expected RequestInit or void as second parameter of XHRObservable's constructor.`);
  }
}

export function IsXHRObservable(value: any): value is IXHRObservable {
  return IsObject(value)
    && value.hasOwnProperty(XHR_OBSERVABLE_PRIVATE as symbol);
}


// export function XHRObservablePromiseTo<T>(instance: IXHRObservable, callback: (response: Response) => TPromiseOrValue<T>): INotificationsObservable<TXHRObservableCastKeyValueMap<T>> {
//   return instance.pipeThrough(promisePipe<Response, T, never>((response: Response) => {
//     if (response.ok) {
//       return callback(response);
//     } else {
//       throw response;
//     }
//   }));
// }


export class XHRObservable extends FiniteStateObservable<Response, TXHRObservableFinalState, TXHRObservableMode, IXHRObservableKeyValueMap> implements IXHRObservable {

  constructor(requestInfo: RequestInfo, requestInit?: RequestInit, options?: IXHRObservableOptions) {
    super(
      GenerateFiniteStateObservableHookFromXHR(requestInfo, requestInit) as TFiniteStateObservableCreateCallback<Response, TXHRObservableFinalState, TXHRObservableMode, IXHRObservableKeyValueMap>,
      options
    );
    ConstructXHRObservable(this, requestInfo, requestInit, options);
  }

  //
  // toJson<T>(): INotificationsObservable<TXHRObservableCastKeyValueMap<T>> {
  //   return XHRObservablePromiseTo<T>(this, (response: Response) => response.json());
  // }
  //
  // toText(): INotificationsObservable<TXHRObservableCastKeyValueMap<string>> {
  //   return XHRObservablePromiseTo<string>(this, (response: Response) => response.text());
  // }
  //
  // toArrayBuffer(): INotificationsObservable<TXHRObservableCastKeyValueMap<ArrayBuffer>> {
  //   return XHRObservablePromiseTo<ArrayBuffer>(this, (response: Response) => response.arrayBuffer());
  // }
  //
  // toBlob(): INotificationsObservable<TXHRObservableCastKeyValueMap<Blob>> {
  //   return XHRObservablePromiseTo<Blob>(this, (response: Response) => response.blob());
  // }
  //
  // toFormData(): INotificationsObservable<TXHRObservableCastKeyValueMap<FormData>> {
  //   return XHRObservablePromiseTo<FormData>(this, (response: Response) => response.formData());
  // }

}

