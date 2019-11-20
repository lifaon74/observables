import { IFetchObservable} from './interfaces';
import { IsObject } from '../../../../../../helpers';
import { FETCH_OBSERVABLE_PRIVATE, IFetchObservableInternal, IFetchObservablePrivate } from './privates';
import { ConstructClassWithPrivateMembers } from '../../../../../../misc/helpers/ClassWithPrivateMembers';
import { IFetchObservableOptions } from './types';

/** CONSTRUCTOR **/

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
