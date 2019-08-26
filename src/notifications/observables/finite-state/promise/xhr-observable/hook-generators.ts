import {
  IFiniteStateObservable, IFiniteStateObservableContext, TFiniteStateObservableCreateCallback,
  TFiniteStateObservableMode
} from '../../interfaces';
import { CancelReason, CancelToken } from '../../../../../misc/cancel-token/implementation';
import { Notification } from '../../../../core/notification/implementation';
import { IXHRObservableKeyValueMap, TXHRObservableFinalState } from './interfaces';
import { EventsObservable } from '../../../events/events-observable/implementation';
import { IEventsObservable } from '../../../events/events-observable/interfaces';
import { IProgress } from '../../../../../misc/progress/interfaces';
import { Progress } from '../../../../../misc/progress/implementation';
import {
  XMLHttpRequestExtendedResponseType, XHRResponseToReadableStream, XHRResponseToResponseInit, CreateFetchCancelReason,
  CreateFetchError, DoXHRFromRequest
} from './helpers';
import { ICancelToken } from '../../../../../misc/cancel-token/interfaces';
import { FiniteStateObservableHookDefaultOnUnobserved } from '../../helpers';


export interface IGenerateFiniteStateObservableHookFromXHROptions {
  useReadableStream?: boolean;
}

/**
 * Generates an Hook for a FiniteStateObservable, based on a Promise:
 *  - when the Observable is freshly observed, calls the factory
 *  - emits 'next' when the promise if fulfilled with the incoming value, then emits 'complete'
 *  - emits 'error' if promise is errored
 *  - emits 'cancel' if promise is cancelled from the factory
 *  - if the FiniteStateObservable is no more observed and the promise is still pending, cancels the token, and resets the state
 * @param requestInfo
 * @param requestInit
 * @param options
 */
export function GenerateFiniteStateObservableHookFromXHR(
  requestInfo: RequestInfo,
  requestInit?: RequestInit,
  options: IGenerateFiniteStateObservableHookFromXHROptions = {},
): TFiniteStateObservableCreateCallback<Response, TXHRObservableFinalState, TFiniteStateObservableMode, IXHRObservableKeyValueMap> {

  // if ((typeof requestInfo !== 'string') && !(requestInfo instanceof Request)) {
  //   throw new TypeError(`Expected string or Request as first parameter.`);
  // }
  //
  // if (!IsObject(requestInit) && (requestInit !== void 0)) {
  //   throw new TypeError(`Expected RequestInit or void as second parameter.`);
  // }

  const request: Request = new Request(requestInfo, requestInit);

  type TValue = Response;
  type TFinalState = TXHRObservableFinalState;
  type TMode = TFiniteStateObservableMode;
  type TKVMap = IXHRObservableKeyValueMap;

  return function (context: IFiniteStateObservableContext<TValue, TFinalState, TMode, TKVMap>) {
    let xhr: XMLHttpRequest | null = null;
    let xhrObservable: IEventsObservable<XMLHttpRequestEventMap, XMLHttpRequest>;
    let xhrUploadObservable: IEventsObservable<XMLHttpRequestEventTargetEventMap, XMLHttpRequestUpload>;
    let token: ICancelToken;

    function clear() {
      if (xhr !== null) {
        if (xhr.readyState !== xhr.DONE) {
          xhr.abort();
          token.cancel(CreateFetchCancelReason(request.url));
        }
        xhrObservable.clearObservers();
        xhrUploadObservable.clearObservers();
        xhr = null;
      }
    }

    return {
      onObserved(): void {
        const instance: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap> = this;
        if (
          (xhr === null)
          && (instance.observers.length === 1) // optional check
          && (instance.state === 'next') // optional check
        ) {
          xhr = new XMLHttpRequest();
          token = new CancelToken();
          // const responseType: XMLHttpRequestExtendedResponseType = 'blob';
          const responseType: XMLHttpRequestExtendedResponseType = 'binary-string';
          const stream: ReadableStream<Uint8Array> = XHRResponseToReadableStream(xhr, responseType, token);

          xhrObservable = new EventsObservable<XMLHttpRequestEventMap, XMLHttpRequest>(xhr)
            .on('readystatechange', () => {
              if (xhr !== null) {  // optional check
                if (xhr.readyState === xhr.HEADERS_RECEIVED) {
                  context.next(new Response(stream, XHRResponseToResponseInit(xhr)));
                }
              }
            })
            .on('load', () => {
              if (xhr !== null) { // optional check
                clear();
                context.complete();
              }
            })
            .on('error', () => {
              if (xhr !== null) { // optional check
                clear();
                context.error(CreateFetchError(request.url));
              }
            })
            .on('progress', (event: ProgressEvent) => {
              if (xhr !== null) { // optional check
                context.emit(new Notification<'download-progress', IProgress>('download-progress', Progress.fromEvent(event)));
              }
            })
            .on('abort', () => {
              if (xhr !== null) { // optional check
                if (instance.observed) {
                  context.emit(new Notification<'cancel', CancelReason>('cancel', new CancelReason(`XHR aborted`)));
                }
              }
            })
          ;

          xhrUploadObservable = new EventsObservable<XMLHttpRequestEventTargetEventMap, XMLHttpRequestUpload>(xhr.upload)
            .on('load', () => {
              if (xhr !== null) {  // optional check
                context.emit(new Notification<'upload-complete', void>('upload-complete', void 0));
              }
            })
            .on('progress', (event: ProgressEvent) => {
              if (xhr !== null) {  // optional check
                context.emit(new Notification<'upload-progress', IProgress>('upload-progress', Progress.fromEvent(event)));
              }
            })
          ;

          // DoXHRFromRequestUsingReadableStream(request, xhr, responseType); // INFO should replace following in the future when supported
          DoXHRFromRequest(request, xhr, responseType, token);
        }
      },
      onUnobserved(): void {
        FiniteStateObservableHookDefaultOnUnobserved<TValue, TFinalState, TMode, TKVMap>(this, context, clear);
      },
    };
  };
}


