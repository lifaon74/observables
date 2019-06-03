import { Notification } from '../../../core/notification/implementation';
import {
  INotificationsObservableInternal, NotificationsObservable
} from '../../../core/notifications-observable/implementation';
import { INotificationsObserver } from '../../../core/notifications-observer/interfaces';
import { ConstructClassWithPrivateMembers } from '../../../../misc/helpers/ClassWithPrivateMembers';
import { IPromiseCancelToken, IPromiseCancelTokenKeyValueMap, TCancelStrategy } from './interfaces';
import { ObservableEmitAll } from '../../../../core/observable/implementation';
import { NotificationsObserver } from '../../../core/notifications-observer/implementation';
import { Reason } from '../../../../misc/reason/implementation';
import { INotification } from '../../../core/notification/interfaces';
import { IsObject, noop } from '../../../../helpers';
import { TPromiseType } from '../../../../promises/interfaces';


export const PROMISE_CANCEL_TOKEN_PRIVATE = Symbol('promise-cancel-token-private');

export interface IPromiseCancelTokenPrivate {
  cancelled: boolean;
  reason: any | undefined;
}

export interface IPromiseCancelTokenInternal extends IPromiseCancelToken, INotificationsObservableInternal<IPromiseCancelTokenKeyValueMap> {
  [PROMISE_CANCEL_TOKEN_PRIVATE]: IPromiseCancelTokenPrivate;
}


export function ConstructPromiseCancelToken(token: IPromiseCancelToken): void {
  ConstructClassWithPrivateMembers(token, PROMISE_CANCEL_TOKEN_PRIVATE);
  (token as IPromiseCancelTokenInternal)[PROMISE_CANCEL_TOKEN_PRIVATE].cancelled = false;
  (token as IPromiseCancelTokenInternal)[PROMISE_CANCEL_TOKEN_PRIVATE].reason = void 0;
}

export function IsPromiseCancelToken(value: any): value is IPromiseCancelToken {
  return IsObject(value)
    && (PROMISE_CANCEL_TOKEN_PRIVATE in value);
}

export function PromiseCancelTokenCancel(token: IPromiseCancelToken, reason: any = void 0): void {
  if (!(token as IPromiseCancelTokenInternal)[PROMISE_CANCEL_TOKEN_PRIVATE].cancelled) {
    (token as IPromiseCancelTokenInternal)[PROMISE_CANCEL_TOKEN_PRIVATE].cancelled = true;
    (token as IPromiseCancelTokenInternal)[PROMISE_CANCEL_TOKEN_PRIVATE].reason = reason;
    ObservableEmitAll<INotification<'cancel', any>>(token, new CancelNotification(reason));
  }
}

/**
 * HELPERS - public
 */

/**
 * Returns the linked AbortSignal (if exists) of a fetch request
 * @param requestInfo
 * @param requestInit
 */
export function ExtractSignalFromFetchArguments(requestInfo: RequestInfo, requestInit: RequestInit = {}): AbortSignal | null {
  if ('AbortController' in self) {
    if (requestInit.signal instanceof AbortSignal) {
      return requestInit.signal;
    } else if (
      (requestInfo instanceof Request)
      && (requestInfo.signal instanceof AbortSignal)
    ) {
      return requestInfo.signal;
    } else {
      return null;
    }
  } else {
    return null;
  }
}

/**
 * Links a PromiseCancelToken with the fetch arguments.
 * Returns the modified RequestInit
 * @param token
 * @param requestInfo
 * @param requestInit
 */
export function LinkPromiseCancelTokenWithFetchArguments(token: IPromiseCancelToken, requestInfo: RequestInfo, requestInit?: RequestInit): RequestInit | undefined {
  if ('AbortController' in self) {
    const signal: AbortSignal | null = ExtractSignalFromFetchArguments(requestInfo, requestInit);
    if (signal === null) {
      const controller: AbortController = token.toAbortController();
      // shallow copy of RequestInit
      requestInit = (requestInit === void 0) ? {} : Object.assign({}, requestInit);
      requestInit.signal = controller.signal;
    } else {
      token.linkWithAbortSignal(signal);
    }
  }
  return requestInit;
}

/**
 * Just like the previous functions, but simplifies fetch calls:
 *  fetch(...LinkPromiseCancelTokenWithFetchArgumentsSpread(token, requestInfo, requestInit))
 * @param token
 * @param requestInfo
 * @param requestInit
 */
export function LinkPromiseCancelTokenWithFetchArgumentsSpread(token: IPromiseCancelToken, requestInfo: RequestInfo, requestInit?: RequestInit): [RequestInfo, RequestInit | undefined] {
  return [requestInfo, LinkPromiseCancelTokenWithFetchArguments(token, requestInfo, requestInit)];
}



/**
 * IMPLEMENTATION
 */

/**
 * Links a PromiseCancelToken with an AbortController.
 * Returns a function, when invoked => undo the link
 * @param token
 * @param controller
 */
export function PromiseCancelTokenLinkWithAbortController(token: IPromiseCancelToken, controller: AbortController): () => void {
  if (controller.signal.aborted) {
    if ((token as IPromiseCancelTokenInternal)[PROMISE_CANCEL_TOKEN_PRIVATE].cancelled) {
      // both cancelled => do nothing
    } else {
      token.cancel(new PromiseCancelReason(`AbortController aborted`));
    }
    return () => {
    };
  } else if ((token as IPromiseCancelTokenInternal)[PROMISE_CANCEL_TOKEN_PRIVATE].cancelled) {
    controller.abort();
    return () => {
    };
  } else { // none cancelled
    const clear = () => {
      controller.signal.removeEventListener('abort', onControllerAborted, false);
      tokenCancelListener.deactivate();
    };

    const tokenCancelListener: INotificationsObserver<'cancel', any> = token.addListener('cancel', () => {
      // PromiseCancelToken has been cancelled first
      clear();
      controller.abort();
    }).activate();


    const onControllerAborted = () => {
      // controller has been cancelled first
      clear();
      token.cancel(new PromiseCancelReason(`AbortController aborted`));
    };

    controller.signal.addEventListener('abort', onControllerAborted, false);

    return clear;
  }
}


/**
 * Links a PromiseCancelToken with an AbortSignal
 *  If the AbortSignal aborts, the Token is cancelled
 *  WARN: cannot cancel a AbortSignal if the Token is cancelled
 * @param token
 * @param signal
 */
export function PromiseCancelTokenLinkWithAbortSignal(token: IPromiseCancelToken, signal: AbortSignal): () => void {
  if (signal.aborted) {
    if ((token as IPromiseCancelTokenInternal)[PROMISE_CANCEL_TOKEN_PRIVATE].cancelled) {
      // both cancelled => do nothing
    } else {
      token.cancel(new PromiseCancelReason(`AbortSignal aborted`));
    }
    return () => {
    };
  } else if ((token as IPromiseCancelTokenInternal)[PROMISE_CANCEL_TOKEN_PRIVATE].cancelled) {
    throw new Error(`Trying to link a cancelled PromiseCancelToken with a non aborted signal.`);
  } else {
    const clear = () => {
      signal.removeEventListener('abort', onControllerAborted, false);
      tokenCancelListener.deactivate();
    };

    const tokenCancelListener: INotificationsObserver<'cancel', any> = token.addListener('cancel', () => {
      clear();
      throw new Error(`A PromiseCancelToken linked with an AbortSignal has been cancelled. But a AbortSignal is not directly cancellable.`);
    }).activate();

    const onControllerAborted = () => {
      // controller has been cancelled first
      clear();
      token.cancel(new PromiseCancelReason(`AbortSignal aborted`));
    };

    signal.addEventListener('abort', onControllerAborted, false);

    return clear;
  }
}

export function ApplyCancelStrategy(token: IPromiseCancelToken, strategy: TCancelStrategy = 'never'): Promise<void> {
  switch (strategy) {
    case 'never':
      return new Promise<never>(noop);
    case 'resolve':
      return Promise.resolve();
    case 'reject':
      return Promise.reject(token.reason);
    default:
      throw new TypeError(`Unexpected strategy: ${ strategy }`);
  }
}

export function PromiseCancelTokenWarpPromise<P extends PromiseLike<any>>(token: IPromiseCancelToken, promise: P, strategy?: TCancelStrategy): P {
  return promise
    .then((value: any) => {
      return (token.cancelled)
        ? ApplyCancelStrategy(token, strategy)
        : Promise.resolve<any>(value);
    }, (reason: any) => {
      return (token.cancelled)
        ? ApplyCancelStrategy(token, strategy)
        : Promise.reject(reason);
    }) as P;
}

export function PromiseCancelTokenWrapFunction<CB extends (...args: any[]) => any>(token: PromiseCancelToken, callback: CB, strategy?: TCancelStrategy): (...args: Parameters<CB>) => Promise<TPromiseType<ReturnType<CB>>> {
  type T = TPromiseType<ReturnType<CB>>;
  return function(...args: Parameters<CB>): Promise<T> {
    return new Promise<T>((resolve: any) => {
      if (token.cancelled) {
        resolve(ApplyCancelStrategy(token, strategy));
      } else {
        resolve(callback.apply(this, args));
      }
    });
  };
}

export class PromiseCancelToken extends NotificationsObservable<IPromiseCancelTokenKeyValueMap> implements IPromiseCancelToken {

  constructor() {
    super();
    ConstructPromiseCancelToken(this);
  }

  get cancelled(): boolean {
    return ((this as unknown) as IPromiseCancelTokenInternal)[PROMISE_CANCEL_TOKEN_PRIVATE].cancelled;
  }

  get reason(): any {
    return ((this as unknown) as IPromiseCancelTokenInternal)[PROMISE_CANCEL_TOKEN_PRIVATE].reason;
  }


  cancel(reason?: any): void {
    PromiseCancelTokenCancel(this, reason);
  }

  toAbortController(): AbortController {
    const controller: AbortController = new AbortController();
    this.linkWithAbortController(controller);
    return controller;
  }

  linkWithAbortController(controller: AbortController): () => void {
    return PromiseCancelTokenLinkWithAbortController(this, controller);
  }

  linkWithAbortSignal(signal: AbortSignal): () => void {
    return PromiseCancelTokenLinkWithAbortSignal(this, signal);
  }

  wrapPromise<P extends PromiseLike<any>>(promise: P, strategy?: TCancelStrategy): P  {
    return PromiseCancelTokenWarpPromise<P>(this, promise);
  }

  wrapFunction<CB extends (...args: any[]) => any>(callback: CB, strategy?: TCancelStrategy): (...args: Parameters<CB>) => Promise<TPromiseType<ReturnType<CB>>> {
    return PromiseCancelTokenWrapFunction<CB>(this, callback);
  }

  wrapFetchArguments(requestInfo: RequestInfo, requestInit?: RequestInit): [RequestInfo, RequestInit | undefined] {
    return LinkPromiseCancelTokenWithFetchArgumentsSpread(this, requestInfo, requestInit);
  }
}


export class PromiseCancelTokenObserver extends NotificationsObserver<'cancel', any> {
  constructor(callback: (value: any) => void) {
    super('cancel', callback);
  }
}

/**
 * Simple wrapper around a Notification of type 'cancel'
 */
export class CancelNotification extends Notification<'cancel', any> {
  constructor(reason?: any) {
    super('cancel', reason);
  }
}

/**
 * An Error which indicates than a Promise has been cancelled.
 */
export class PromiseCancelError extends Error {
  static discard(reason: any): void | never {
    if (!(reason instanceof PromiseCancelError)) {
      throw reason;
    }
  }

  constructor(message: string = 'Promise cancelled') {
    super(message);
    (this as any).name = 'PromiseCancelError';
  }
}

/**
 * A Reason which indicates than a Promise has been cancelled.
 */
export class PromiseCancelReason extends Reason<'CANCEL'> {
  static discard(reason: any): void | never {
    if (!(reason instanceof PromiseCancelReason)) {
      throw reason;
    }
  }

  constructor(message: string = 'Promise cancelled') {
    super(message, 'CANCEL');
  }
}


