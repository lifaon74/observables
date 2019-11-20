import { IFetchObservable} from './interfaces';
import { PromiseObservable } from '../promise-observable/implementation';
import { INotificationsObservable } from '../../../../../core/notifications-observable/interfaces';
import { promisePipe } from '../../../../../../operators/pipes/promisePipe';
import { TPromiseOrValue } from '../../../../../../promises/interfaces';
import { IAdvancedAbortSignal } from '../../../../../../misc/advanced-abort-controller/advanced-abort-signal/interfaces';
import { FETCH_OBSERVABLE_PRIVATE, IFetchObservableInternal, IFetchObservablePrivate } from './privates';
import { ConstructFetchObservable } from './constructor';
import { IFetchObservableOptions, TFetchObservableCastKeyValueMap } from './types';


/** CONSTRUCTOR FUNCTIONS **/

export function FetchObservablePromiseFactory(instance: IFetchObservable, signal: IAdvancedAbortSignal): Promise<Response> {
  const privates: IFetchObservablePrivate = (instance as IFetchObservableInternal)[FETCH_OBSERVABLE_PRIVATE];
  return fetch(...signal.wrapFetchArguments(
    privates.requestInfo,
    privates.requestInit,
  ));
}

/** METHODS **/

/* FUNCTIONS */

export function FetchObservablePromiseTo<T>(instance: IFetchObservable, callback: (response: Response) => TPromiseOrValue<T>): INotificationsObservable<TFetchObservableCastKeyValueMap<T>> {
  return instance.pipeThrough(promisePipe<Response, T, never>((response: Response) => {
    if (response.ok) {
      return callback(response);
    } else {
      throw response;
    }
  }));
}


/** CLASS **/

export class FetchObservable extends PromiseObservable<Response> implements IFetchObservable {

  constructor(requestInfo: RequestInfo, requestInit?: RequestInit, options?: IFetchObservableOptions) {
    super((signal: IAdvancedAbortSignal): Promise<Response> => {
      return FetchObservablePromiseFactory(this, signal);
    }, options);
    ConstructFetchObservable(this, requestInfo, requestInit, options);
  }

  toJSON<T>(): INotificationsObservable<TFetchObservableCastKeyValueMap<T>> {
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

