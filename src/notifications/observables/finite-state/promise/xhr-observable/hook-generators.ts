import {
  IFiniteStateObservable, IFiniteStateObservableContext, TFiniteStateObservableCreateCallback,
  TFiniteStateObservableMode
} from '../../interfaces';
import { PromiseCancelReason, PromiseCancelToken } from '../promise-cancel-token/implementation';
import { Notification } from '../../../../core/notification/implementation';
import { IXHRObservableKeyValueMap, TXHRObservableFinalState } from './interfaces';
import { EventsObservable } from '../../../events/events-observable/implementation';
import { IEventsObservable } from '../../../events/events-observable/interfaces';
import { IProgress } from '../../../../../misc/progress/interfaces';
import { Progress } from '../../../../../misc/progress/implementation';
import {
  DoXHRFromRequestUsingReadableStream, CreateXHRError, XHRResponseToResponseUsingReadableStream,
  XMLHttpRequestExtendedResponseType, XHRResponseToReadableStream, XHRResponseToResponseInit
} from './helpers';
import { IPromiseCancelToken } from '../promise-cancel-token/interfaces';


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

    // TODO => use token to abort everything
    let token: IPromiseCancelToken = new PromiseCancelToken();

    function clear() {
      if (xhr !== null) {
        if (xhr.readyState !== xhr.DONE) {
          xhr.abort();
        }
        xhrObservable.clearObservers();
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
          // const responseType: XMLHttpRequestExtendedResponseType = 'blob';
          const responseType: XMLHttpRequestExtendedResponseType = 'binary-string';
          const stream: ReadableStream<Uint8Array> = XHRResponseToReadableStream(xhr, responseType);

          xhrObservable = new EventsObservable<XMLHttpRequestEventMap, XMLHttpRequest>(xhr)
            .on('readystatechange', () => {
              if (xhr !== null) {  // optional check
                if (xhr.readyState === xhr.HEADERS_RECEIVED) {
                  context.next(new Response(stream, XHRResponseToResponseInit(xhr)));
                }
              }
            })
            .on('load', () => {
              if (xhr !== null) { // may append if onUnobserved into the 'next'
                clear();
                context.complete();
              }
            })
            .on('error', () => {
              if (xhr !== null) { // optional check
                clear();
                context.error(CreateXHRError(xhr));
              }
            })
            .on('progress', (event: ProgressEvent) => {
              if (xhr !== null) { // optional check
                context.emit(new Notification<'progress', IProgress>('progress', Progress.fromEvent(event)));
              }
            })
            .on('abort', () => {
              if (xhr !== null) { // optional check
                context.emit(new Notification<'cancel', PromiseCancelReason>('cancel', new PromiseCancelReason(`XHR aborted`)));
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

          DoXHRFromRequestUsingReadableStream(request, xhr, responseType);
        }
      },
      onUnobserved(): void {
        const instance: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap> = this;
        if (
          (!instance.observed)
          && (instance.state === 'next')
        ) {
          clear();
          context.clearCache();
        }
      },
    };
  };
}


