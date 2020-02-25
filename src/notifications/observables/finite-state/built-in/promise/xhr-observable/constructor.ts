import { IXHRObservable } from './interfaces';
import { ConstructClassWithPrivateMembers } from '../../../../../../misc/helpers/ClassWithPrivateMembers';
import { IXHRObservableInternal, IXHRObservablePrivate, XHR_OBSERVABLE_PRIVATE } from './privates';
import { IsObject } from '../../../../../../helpers';
import { IXHRObservableOptions, IXHRObservableRequestInit } from './types';
import { EnsureRequestInitDoesntContainSignal } from '../fetch-observable/functions';

/** CONSTRUCTOR **/

export function ConstructXHRObservable(
  instance: IXHRObservable,
  requestInfo: RequestInfo,
  requestInit?: IXHRObservableRequestInit,
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
    EnsureRequestInitDoesntContainSignal(requestInit, 'XHRObservable');
    privates.requestInit = requestInit;
  } else if (requestInit !== void 0) {
    throw new TypeError(`Expected RequestInit or void as second parameter of XHRObservable's constructor.`);
  }
}

export function IsXHRObservable(value: any): value is IXHRObservable {
  return IsObject(value)
    && value.hasOwnProperty(XHR_OBSERVABLE_PRIVATE as symbol);
}
