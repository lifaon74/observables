
/** TYPES **/

export interface IIdleDeadline {
  readonly didTimeout: boolean;
  timeRemaining(): DOMHighResTimeStamp;
}

export interface IRequestIdleCallbackOptions {
  timeout?: number;
}

export type TRequestIdleCallbackCallback = (idleDeadline: IIdleDeadline) => void;


export type TRequestIdleCallbackReturn = any;
export type TRequestIdleCallback = (callback: TRequestIdleCallbackCallback, options?: IRequestIdleCallbackOptions) => TRequestIdleCallbackReturn;

export type TCancelIdleCallback = (handle: TRequestIdleCallbackReturn) => void;



/** IMPLEMENTATION **/


let _requestIdleCallback: TRequestIdleCallback;
let _cancelIdleCallback: TCancelIdleCallback;
const nativeSupport: boolean = (('requestIdleCallback' in globalThis) && ('cancelIdleCallback' in globalThis));

export function requestIdleCallback(callback: TRequestIdleCallbackCallback, options?: IRequestIdleCallbackOptions): TRequestIdleCallbackReturn {
  if (_requestIdleCallback === void 0) {
    if (nativeSupport) {
      _requestIdleCallback = globalThis['requestIdleCallback'];
    } else {
      _requestIdleCallback = (callback: TRequestIdleCallbackCallback, options: IRequestIdleCallbackOptions = {}): TRequestIdleCallbackReturn => {
        const start: number = Date.now();
        const timeout: number = (options.timeout === void 0) ? Number.POSITIVE_INFINITY : options.timeout;
        return setTimeout(() => {
          callback({
            didTimeout: (Date.now() - start) > timeout,
            timeRemaining: () => {
              return Math.max(0, 50 - (Date.now() - start));
            }
          });
        }, 1) as TRequestIdleCallbackReturn;
      };
    }
  }
  return _requestIdleCallback(callback, options);
}

export function cancelIdleCallback(handle: number) {
  if (_requestIdleCallback === void 0) {
    if (nativeSupport) {
      _cancelIdleCallback = globalThis['cancelIdleCallback'];
    } else {
      _cancelIdleCallback = (handle: number): void => {
        clearTimeout(handle);
      };
    }
  }
  return _cancelIdleCallback(handle);
}
