import { IFiniteStateObservable } from '../../../interfaces';
import { Notification } from '../../../../../core/notification/implementation';
import { IXHRObservableKeyValueMap, TXHRObservableFinalState } from './interfaces';
import { EventsObservable } from '../../../../events/events-observable/implementation';
import { IEventsObservable } from '../../../../events/events-observable/interfaces';
import { IProgress } from '../../../../../../misc/progress/interfaces';
import { Progress } from '../../../../../../misc/progress/implementation';
import {
  AreReadableStreamSupported, CreateFetchAbortReason, CreateFetchError, DoXHRFromRequest, XHRResponseToReadableStream,
  XHRResponseToResponse, XHRResponseToResponseInit, XMLHttpRequestExtendedResponseType
} from './helpers';
import { FiniteStateObservableHookDefaultOnUnobserved } from '../../../helpers';
import { AdvancedAbortController } from '../../../../../../misc/advanced-abort-controller/implementation';
import { IAdvancedAbortController } from '../../../../../../misc/advanced-abort-controller/interfaces';
import { AbortReason } from '../../../../../../misc/reason/defaults/abort-reason';
import { TFiniteStateObservableCreateCallback, TFiniteStateObservableMode } from '../../../types';
import { IFiniteStateObservableContext } from '../../../context/interfaces';


export interface IGenerateFiniteStateObservableHookFromXHROptions {
  useReadableStream?: boolean;
}

/**
 * Generates an Hook for a FiniteStateObservable, based on an XHR request:
 *  - when the Observable is freshly observed, starts the request
 *  - emits 'next' when the request if complete with the incoming value, then emits 'complete'
 *  - emits 'error' if promise is errored
 *  - emits 'abort' if promise is abortled from the factory
 *  - if the FiniteStateObservable is no more observed and the promise is still pending, aborts the token, and resets the state
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
    let xhr: XMLHttpRequest | null = null; // null if no request
    let xhrObservable: IEventsObservable<XMLHttpRequestEventMap, XMLHttpRequest>;
    let xhrUploadObservable: IEventsObservable<XMLHttpRequestEventTargetEventMap, XMLHttpRequestUpload>;
    let abortController: IAdvancedAbortController;

    const useReadableStream: boolean = AreReadableStreamSupported()
      && ((options.useReadableStream === void 0) ? true : options.useReadableStream);

    const clear = () => {
      if (xhr !== null) {
        if (xhr.readyState !== xhr.DONE) {
          xhr.abort();
          abortController.abort(CreateFetchAbortReason(request.url));
        }
        xhrObservable.clearObservers();
        xhrUploadObservable.clearObservers();
        xhr = null;
      }
    };

    return {
      onObserved(): void {
        const instance: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap> = this as IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>;

        if (
          (xhr === null)
          && (instance.observers.length === 1) // optional check
          && (instance.state === 'next') // optional check
        ) {
          xhr = new XMLHttpRequest();
          abortController = new AdvancedAbortController();
          let stream: ReadableStream<Uint8Array> | undefined;
          let responseType: XMLHttpRequestExtendedResponseType;

          if (useReadableStream) {
            responseType = 'binary-string';
            stream = XHRResponseToReadableStream(xhr, responseType, abortController.signal);
          } else { // in case ReadableStream is not supported
            responseType = 'blob';
          }

          xhrObservable = new EventsObservable<XMLHttpRequestEventMap, XMLHttpRequest>(xhr)
            .on('readystatechange', () => {
              if (xhr !== null) {  // optional check
                if (stream === void 0) { // in case ReadableStream is not supported
                  if (xhr.readyState === xhr.DONE) {
                    context.next(XHRResponseToResponse(xhr, responseType));
                  }
                } else {
                  if (xhr.readyState === xhr.HEADERS_RECEIVED) {
                    context.next(new Response(stream, XHRResponseToResponseInit(xhr)));
                  }
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
                context.emit(new Notification<'progress', IProgress>('progress', Progress.fromEvent(event, 'download')));
              }
            })
            .on('abort', () => {
              if (xhr !== null) { // optional check
                if (instance.observed) {
                  context.emit(new Notification<'abort', AbortReason>('abort', new AbortReason(`XHR aborted`)));
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
                context.emit(new Notification<'progress', IProgress>('progress', Progress.fromEvent(event, 'upload')));
              }
            })
          ;

          // DoXHRFromRequestUsingReadableStream(request, xhr, responseType); // INFO should replace following in the future when supported
          DoXHRFromRequest(request, xhr, responseType, abortController.signal);
        }
      },
      onUnobserved(): void {
        FiniteStateObservableHookDefaultOnUnobserved<TValue, TFinalState, TMode, TKVMap>(this as IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>, context, clear);
      },
    };
  };
}


