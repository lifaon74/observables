import {
  IXHRObservable, IXHRObservableKeyValueMap, IXHRObservableOptions, TXHRObservableFinalState, TXHRObservableMode
} from './interfaces';
import { FiniteStateObservable } from '../../../implementation';
import { GenerateFiniteStateObservableHookFromXHR } from './hook-generators';
import { TFiniteStateObservableCreateCallback } from '../../../types';
import { ConstructXHRObservable } from './constructor';


// export function XHRObservablePromiseTo<T>(instance: IXHRObservable, callback: (response: Response) => TPromiseOrValue<T>): INotificationsObservable<TXHRObservableCastKeyValueMap<T>> {
//   return instance.pipeThrough(promisePipe<Response, T, never>((response: Response) => {
//     if (response.ok) {
//       return callback(response);
//     } else {
//       throw response;
//     }
//   }));
// }

/** CLASS */

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

