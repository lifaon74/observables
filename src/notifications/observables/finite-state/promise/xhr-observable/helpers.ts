import { ICancelToken } from '../../../../../misc/cancel-token/interfaces';
import { ICancellablePromise } from '../../../../../promises/cancellable-promise/interfaces';
import { CancellablePromise } from '../../../../../promises/cancellable-promise/implementation';
import { StringMaxLength, ToIterable } from '../../../../../helpers';
import { PartialProperties } from '../../../../../classes/types';
import { INotificationsObserver } from '../../../../core/notifications-observer/interfaces';
import { CancelReason } from '../../../../../misc/cancel-token/implementation';

export type XMLHttpRequestExtendedResponseType = XMLHttpRequestResponseType | 'binary-string';


export function CreateFetchError(url: string): Error {
  return new Error(`Failed to fetch '${ StringMaxLength(url, 100) }'`);
}

export function CreateNetworkError(): Error {
  return new Error(`Network error`);
}
export function CreateFetchCancelReason(url: string): CancelReason {
  return new CancelReason(`Fetching '${ StringMaxLength(url, 100) }' has been aborted`);
}

/**
 * Sets headers (type Headers) into xhr (typo XMLHttpRequest)
 * @param headers
 * @param xhr
 */
export function SetHeadersIntoXHR(headers: Headers, xhr: XMLHttpRequest): void {
  headers.forEach((value: string, key: string) => {
    if (xhr !== null) {
      xhr.setRequestHeader(key, value);
    }
  });
}


/**
 * Returns a boolean to assign to xhr.withCredentials from the parameters extracted from request
 * @param request
 */
export function GetXHRWithCredentialsValueFromRequest(request: Request): boolean {
  // xhr.withCredentials = ['same-origin', 'include'].includes(request.credentials);

  const url: URL = new URL(request.url);

  switch (request.credentials) {
    case 'omit':
      return false;
    case 'same-origin':
      return (window.location.origin === url.origin);
    case 'include':
      return true;
    default:
      throw new TypeError(`Unsupported request.credentials`);
  }
}


/**
 * Inits an XMLHttpRequest from a Request
 * @param request
 * @param xhr
 * @param responseType
 */
export function InitXHRFromRequest(request: Request, xhr: XMLHttpRequest, responseType: XMLHttpRequestExtendedResponseType): void {
  const clear = () => {
    xhr.removeEventListener('load', clear);
    xhr.removeEventListener('error', clear);
    request.signal.removeEventListener('abort', onAbort);
  };

  const onAbort = () => {
    clear();
    xhr.abort();
  };

  xhr.open(request.method, request.url, true);
  if (responseType === 'binary-string') {
    xhr.responseType = 'text';
    xhr.overrideMimeType('text/plain; charset=x-user-defined');
  } else {
    xhr.responseType = responseType;
  }

  xhr.withCredentials = GetXHRWithCredentialsValueFromRequest(request);

  SetHeadersIntoXHR(request.headers, xhr);

  xhr.addEventListener('load', clear);
  xhr.addEventListener('error', clear);

  if (request.signal.aborted) {
    onAbort();
  } else {
    request.signal.addEventListener('abort', onAbort);
  }
}

/**
 * Do an XMLHttpRequest from a Request. ReadableStream must be supported.
 * @param request
 * @param xhr
 * @param responseType
 */
export function DoXHRFromRequestUsingReadableStream(
  request: Request,
  xhr: XMLHttpRequest = new XMLHttpRequest(),
  responseType: XMLHttpRequestExtendedResponseType
): XMLHttpRequest {
  InitXHRFromRequest(request, xhr, responseType);
  xhr.send(request.body);
  return xhr;
}

/**
 * Do an XMLHttpRequest from a Request. Casts body to Blob, so ReadableStream are not required.
 * @param request
 * @param xhr
 * @param responseType
 * @param token
 */
export function DoXHRFromRequest(
  request: Request,
  xhr: XMLHttpRequest = new XMLHttpRequest(),
  responseType: XMLHttpRequestExtendedResponseType,
  token?: ICancelToken
): ICancellablePromise<XMLHttpRequest, 'never'> {
  // return CancellablePromise.of<ArrayBuffer>(request.arrayBuffer(), token)
  //   .then((buffer: ArrayBuffer) => {
  //     InitXHRFromRequest(request, xhr, responseType);
  //     xhr.send(buffer);
  //     return xhr;
  //   });
  return CancellablePromise.of<Blob>(request.blob(), token)
    .then((blob: Blob) => {
      InitXHRFromRequest(request, xhr, responseType);
      xhr.send(blob);
      return xhr;
    });
}

/**
 * Converts a raw headers' string to an array of tuple [key, value]
 * @param headers
 */
export function ParseRawHeaders(headers: string): [string, string][] {
  return headers
    .split(/\r?\n/g)
    .map<[string, string]>((header: string) => {
      const parts: string[] = header.split(': ');
      const key: string = parts.shift() as string;
      const value: string = parts.join(': ');
      return [key.trim(), value.trim()];
    })
    .filter(([key]) => (key !== ''));
}




export function BinaryStringToUint8Array(input: string): Uint8Array {
  const length: number = input.length;
  const array: Uint8Array = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    array[i] = input.charCodeAt(i); // & 0xff
  }
  return array;
}

// const BinaryStringToUint8ArrayAsyncProgram = new Program(BinaryStringToUint8Array);
//
// export function BinaryStringToUint8ArrayAsync(input: string): Promise<Uint8Array> {
//   return BinaryStringToUint8ArrayAsyncProgram.run([input]);
// }



/**
 * Assumes xhr.readyState is DONE and response is not null
 * @param xhr
 * @param responseType
 */
export function XHRResponseToUint8Array(xhr: XMLHttpRequest, responseType: XMLHttpRequestExtendedResponseType = xhr.responseType): Uint8Array {
  switch (responseType) {
    case '':
    case 'text':
      return new TextEncoder().encode(xhr.response);
    case 'binary-string':
      return BinaryStringToUint8Array(xhr.response);
    case 'arraybuffer':
      return new Uint8Array(xhr.response);
    case 'blob':
      throw new TypeError(`Cannot synchronously convert a blob to an Uint8Array`);
    // return new Response(xhr.response as Blob, init);
    case 'document':
      return new TextEncoder().encode(new XMLSerializer().serializeToString(xhr.response as Document));
    case 'json':
      return new TextEncoder().encode(JSON.stringify(xhr.response as any));
    default:
      throw new TypeError(`Unsupported response type '${ responseType}'`);
  }
}

/**
 * Assumes xhr.readyState is DONE and response is not null
 * @param xhr
 * @param responseType
 */
export function XHRResponseToBlob(xhr: XMLHttpRequest, responseType: XMLHttpRequestExtendedResponseType = xhr.responseType): Blob {
  const contentType: string | null = xhr.getResponseHeader('content-type');
  switch (responseType) {
    case '':
    case 'text':
      return new Blob([xhr.response as string], { type: contentType || 'text/plain' });
    case 'binary-string':
      return new Blob([BinaryStringToUint8Array(xhr.response as string)], { type: contentType || 'text/plain' });
    case 'arraybuffer':
      return new Blob([xhr.response as ArrayBuffer], { type: contentType || void 0 });
    case 'blob':
      return xhr.response as Blob;
    case 'document':
      return new Blob([new XMLSerializer().serializeToString(xhr.response as Document)], { type: contentType || xhr.response.contentType });
    case 'json':
      return new Blob([JSON.stringify(xhr.response as any)], { type: contentType || 'application/json' });
    default:
      throw new TypeError(`Unsupported response type '${ responseType}'`);
  }
}

/**
 * Assumes xhr.readyState before or equals to xhr.HEADERS_RECEIVED
 * @param xhr
 * @param responseType
 * @param token
 */
export function XHRResponseToReadableStream(
  xhr: XMLHttpRequest,
  responseType: XMLHttpRequestExtendedResponseType = xhr.responseType,
  token?: ICancelToken
): ReadableStream<Uint8Array> {

  let clear: () => void;

  return new ReadableStream<Uint8Array>({
    start(controller) {
      if ((token === void 0) || (!token.cancelled)) {
        const isStreamableResponseType: boolean = (responseType === 'binary-string');

        let tokenObserver: INotificationsObserver<'cancel', any>;
        let readIndex: number = 0;

        clear = () => {
          xhr.removeEventListener('load', onLoad);
          xhr.removeEventListener('error', onError);
          xhr.removeEventListener('progress', onProgress);
          if (tokenObserver !== void 0) {
            tokenObserver.deactivate();
          }
        };

        const onProgress = () => {
          const index: number = xhr.response.length;
          if (index !== readIndex) {
            const data: Uint8Array = BinaryStringToUint8Array(xhr.response.substring(readIndex, index));
            controller.enqueue(data);
            readIndex = index;
          }
        };

        const onLoad = () => {
          clear();
          if (isStreamableResponseType) {
            onProgress();
          } else {
            controller.enqueue(XHRResponseToUint8Array(xhr.response, responseType));
          }
          controller.close();
        };

        const onError = () => {
          clear();
          controller.error(CreateNetworkError());
        };

        const onCancelled = () => {
          if (token !== void 0) { // optional check
            clear();
            controller.error(token.reason);
          }
        };

        xhr.addEventListener('load', onLoad);
        xhr.addEventListener('error', onError);

        if (isStreamableResponseType) {
          xhr.addEventListener('progress', onProgress);
        }


        if (token !== void 0) {
          tokenObserver = token
            .addListener('cancel', onCancelled)
            .activate();
        }
      }
    },
    cancel() {
      if (clear !== void 0) {
        clear();
      }
    },
    // TODO: not implemented yet in some browsers
    // type: 'bytes'
  });
}


/**
 * Assumes xhr.readyState after or equals to xhr.HEADERS_RECEIVED
 * @param xhr
 * @constructor
 */
export function XHRResponseToResponseInit(xhr: XMLHttpRequest): ResponseInit {
  return {
    headers: new Headers(ParseRawHeaders(xhr.getAllResponseHeaders())),
    status: xhr.status,
    statusText: xhr.statusText,
  };
}

/**
 * Creates a Response from an XMLHttpRequest.
 * Assumes xhr.readyState is DONE and response is not null
 * @param xhr
 * @param responseType
 */
export function XHRResponseToResponse(xhr: XMLHttpRequest, responseType: XMLHttpRequestExtendedResponseType = xhr.responseType): Response {
  const init: ResponseInit = XHRResponseToResponseInit(xhr);
  switch (responseType) {
    case '':
    case 'text':
      return new Response(xhr.response as string, init);
    case 'arraybuffer':
      return new Response(xhr.response as ArrayBuffer, init);
    case 'blob':
      return new Response(xhr.response as Blob, init);
    case 'document':
    case 'json':
    case 'binary-string':
      return new Response(XHRResponseToBlob(xhr), init);
    default:
      throw new TypeError(`Unsupported response type '${ responseType}'`);
  }
}

/**
 * Assumes xhr.readyState is after or equal to HEADERS_RECEIVED
 * @param responseType
 * @param xhr
 */
export function XHRResponseToResponseUsingReadableStream(xhr: XMLHttpRequest, responseType?: XMLHttpRequestExtendedResponseType): Response {
  return new Response(XHRResponseToReadableStream(xhr, responseType), XHRResponseToResponseInit(xhr));
}






/** FETCH **/

export function ToURL(url: string | URL = ''): URL {
 return (url instanceof URL)
    ? url
    : new URL(url, window.location.origin);
}

export interface RequestInitWithURL extends RequestInit {
  url: string;
}

/**
 * Creates a Request from RequestInitWithURL
 * @param init
 */
export function CreateRequestFromRequestInitWithURL(init: string | RequestInitWithURL): Request {
  return (typeof init === 'string')
    ? new Request(init)
    : new Request(init.url, init);
}

/**
 * Clones 'request'. May override some parameters with 'init'.
 * @param request
 * @param init
 */
export function CloneRequest(request: RequestInfo, init: PartialProperties<RequestInitWithURL, 'url'> = {}): Promise<Request> {
  return new Promise<Request>((resolve: any, reject: any) => {
    if ('url' in init) {
      const url: string = (init as any).url;
      if (typeof request === 'string') {
        resolve(new Request(url, init));
      } else if (request instanceof Request) {
        const clone: RequestInit = {}; // copy of the main properties of request
        [
          'body', 'cache', 'credentials', 'headers',
          'integrity', 'keepalive', 'method', 'mode',
          'redirect', 'referrer', 'referrerPolicy', 'signal',
          'window'
        ].forEach((key: string) => {
          (clone as any)[key] = (request as any)[key];
        });

        init = Object.assign(clone, init);

        if (['HEAD', 'GET'].includes(request.method.toUpperCase())) {
          resolve(new Request(url, init));
        } else {
          resolve(
            request.blob()
              .then((blob: Blob) => {
                if (blob.size > 0) {
                  init.body = blob;
                }
                return new Request(url, init);
              })
          );
        }
      } else {
        reject(`Expected RequestInfo as request`);
      }
    } else {
      resolve(new Request(request, init));
    }
  });
}

/**
 * Creates a simple Request with an url, method and body.
 * Body is automatically casted to the best fitting type.
 * @param url
 * @param method
 * @param body
 * @param init
 *
 * @example:
 *  CreateSimpleRequest('https://chart.googleapis.com/chart', 'GET', {
      cht: 'qr',
      chs: '256x256',
      chl: data,
    });
 */
export function CreateSimpleRequest(url: string, method: string, body: any = null, init: RequestInit = {}): Request {

  const _init = {
    headers: new Headers(init.headers),
    method: method,
    body: null as (BodyInit | null),
  };


  if (body !== null) {
    const iterableBody: Iterable<[string, any]> = ToIterable(body);

    switch (method) {
      case 'GET':
        url = IterableToURLSearchParams(iterableBody, url).href;
        break;
      case 'POST':
      case 'PUT':
      case 'DELETE':
        if (Array.from(iterableBody).some((value: any) => (value instanceof Blob))) {
          _init.body = IterableToFormData(iterableBody);
        } else {
          _init.headers.append( 'Content-Type', 'application/json');
          _init.body = IterableToJSON(body);
        }
        break;
    }
  }

  return new Request(url, Object.assign(_init, init));
}


/**
 * Rejects responses with status not 'OK'
 * @param response
 */
export function RejectInvalidResponse(response: Response): Promise<Response> {
  return ((200 <= response.status) && (response.status < 400))
  ? Promise.resolve(response)
  : Promise.reject(response);
}



/** CONVERTING ITERATOR TO ... **/

/** ... SEARCH_PARAMS AS STRING */

/**
 * Converts an Iterator to a searchParams string
 * @param input
 */
export function IteratorToSearchParamsString(input: Iterator<[string, any]>): string {
  let str: string = '';
  let result: IteratorResult<[string, any]>;
  while (!(result = input.next()).done) {
    if (str !== '') {
      str += '&';
    }
    str += encodeURIComponent(result.value[0]) + '=' + encodeURIComponent(result.value[1]);
  }
  return str;
}

export function IterableToSearchParamsString(input: Iterable<[string, any]>): string {
  return IteratorToSearchParamsString(input[Symbol.iterator]());
}

export function ObjectToSearchParamsString(input: object): string {
  return IterableToSearchParamsString(Object.entries(input));
}


/** ... URL.SEARCH_PARAMS */

/**
 * Converts an Iterator to an URL where url.searchParams reflects this iterator
 * @param input
 * @param url
 */
export function IteratorToURLSearchParams(input: Iterator<[string, any]>, url?: string | URL): URL {
  const _url: URL = ToURL(url);
  let result: IteratorResult<[string, any]>;
  while (!(result = input.next()).done) {
    _url.searchParams.append(result.value[0], result.value[1]);
  }
  return _url;
}

export function IterableToURLSearchParams(input: Iterable<[string, any]>, url?: string | URL): URL {
  return IteratorToURLSearchParams(input[Symbol.iterator](), url);
}

export function ObjectToURLSearchParams(input: object, url?: string | URL): URL {
  return IterableToURLSearchParams(Object.entries(input), url);
}


/** ... FORM_DATA */

/**
 * Converts an Iterator to a FormData
 * @param input
 * @param formData
 */
export function IteratorToFormData(input: Iterator<[string, any]>, formData: FormData = new FormData()): FormData {
  let result: IteratorResult<[string, any]>;
  while (!(result = input.next()).done) {
    const [key, value] = result.value;
    if (value instanceof Blob) {
      formData.append(key, value, (value instanceof File) ? value.name : `file-${ (Math.random() * Number.MAX_SAFE_INTEGER).toString(16) }-${ Date.now().toString(16) }`);
    } else {
      formData.append(key, value);
    }
  }
  return formData;
}

export function IterableToFormData(input: Iterable<[string, any]>, formData?: FormData): FormData {
  return IteratorToFormData(input[Symbol.iterator](), formData);
}

export function ObjectToFormData(input: object, formData?: FormData): FormData {
  return IterableToFormData(Object.entries(input), formData);
}


/** ... OBJECT */

export function IteratorToObject<T extends object>(input: Iterator<[string, any]>, obj: object = {}): T {
  let result: IteratorResult<[string, any]>;
  while (!(result = input.next()).done) {
    (obj as any)[result.value[0]] = result.value[1];
  }
  return obj as T;
}

export function IterableToObject<T extends object>(input: Iterable<[string, any]>, obj?: object): T {
  return IteratorToObject(input[Symbol.iterator](), obj);
}


/** ... JSON */

export function IteratorToJSON(input: Iterator<[string, any]>): string {
  return JSON.stringify(IteratorToObject(input));
}

export function IterableToJSON(input: Iterable<[string, any]>): string {
  return IteratorToJSON(input[Symbol.iterator]());
}







