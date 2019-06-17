import { Notification } from '../../../core/notification/implementation';
import {
  INotificationsObservableInternal, NotificationsObservable
} from '../../../core/notifications-observable/implementation';
import { INotificationsObserver } from '../../../core/notifications-observer/interfaces';
import { ConstructClassWithPrivateMembers } from '../../../../misc/helpers/ClassWithPrivateMembers';
import { IPromiseCancelToken, IPromiseCancelTokenKeyValueMap, TCancelStrategy, TOnCancelled } from './interfaces';
import { ObservableEmitAll } from '../../../../core/observable/implementation';
import { NotificationsObserver } from '../../../core/notifications-observer/implementation';
import { Reason } from '../../../../misc/reason/implementation';
import { INotification } from '../../../core/notification/interfaces';
import { IsObject, noop } from '../../../../helpers';
import { TPromiseOrValue, TPromiseType } from '../../../../promises/interfaces';
import { Finally, PromiseTry } from '../../../..';


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
  if (IsObject(globalThis) && ('AbortController' in globalThis)) {
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
  if (IsObject(globalThis) && ('AbortController' in globalThis)) {
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


// export function GetPromiseCreateCallbackFromCancelStrategy(token: IPromiseCancelToken, strategy: TCancelStrategy = 'never'): TPromiseCreateCallback<void> {
//   switch (strategy) {
//     case 'never':
//       return PromiseCreateCallbackNoop();
//     case 'resolve':
//       return PromiseCreateCallbackResolve<void>(void 0);
//     case 'reject':
//       return PromiseCreateCallbackReject(token.reason);
//     default:
//       throw new TypeError(`Unexpected strategy: ${ strategy }`);
//   }
// }
//
// export function ApplyCancelStrategyLike<P extends PromiseLike<void>>(token: IPromiseCancelToken, strategy?: TCancelStrategy, promiseConstructor: TPromiseConstructorLike<P> = Promise as any): P {
//   return new promiseConstructor(GetPromiseCreateCallbackFromCancelStrategy(token, strategy) as TPromiseCreateCallback<TPromiseType<P>>);
// }
//
// export function PromiseCancelTokenWarpPromiseLike<P extends PromiseLike<any>>(token: IPromiseCancelToken, promise: P, strategy?: TCancelStrategy, waitUntilPromiseResolved: boolean = false): P {
//   const promiseConstructor: TPromiseConstructorLike<P> = promise.constructor as TPromiseConstructorLike<P>;
//
//   return (token.cancelled && !waitUntilPromiseResolved)
//     ? ApplyCancelStrategyLike(token, strategy, promiseConstructor)
//     : promise
//       .then((value: any) => {
//         return token.cancelled
//           ? ApplyCancelStrategyLike(token, strategy, promiseConstructor)
//           : new promiseConstructor(PromiseCreateCallbackResolve<any>(value));
//       }, (reason: any) => {
//         return token.cancelled
//           ? ApplyCancelStrategyLike(token, strategy, promiseConstructor)
//           : new promiseConstructor(PromiseCreateCallbackReject(reason));
//       }) as P;
// }

/**
 * Returns a Promise with a cancel strategy:
 *  - never: never resolves
 *  - resolve: resolves with undefined
 *  - reject: rejects with token.reason
 * @param token
 * @param strategy
 */
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

/**
 * If present, apply the onCancelled function and when resolved, the cancel strategy
 * @param token
 * @param strategy
 * @param onCancelled
 */
export function ApplyOnCancelCallback(
  token: IPromiseCancelToken,
  strategy?: TCancelStrategy,
  onCancelled?: TOnCancelled,
): Promise<void> {
  const promise: Promise<void> = (typeof onCancelled === 'function')
    ? PromiseTry<void>(() => onCancelled.call(token))
    : Promise.resolve();

  return promise.then(() => ApplyCancelStrategy(token, strategy));
}

/**
 * Returns a Promise resolving as soon as 'promise' is resolved or 'token' is cancelled
 * @param token
 * @param promise
 */
export function RaceCancelled<T>(
  token: IPromiseCancelToken,
  promise: Promise<T>,
): Promise<T | void> {
  let observer: INotificationsObserver<'cancel', void>;

  return Promise.race<T | void>([
    new Promise<void>((resolve: any) => {
      if (token.cancelled) {
        resolve();
      } else {
        observer = token.addListener('cancel', () => {
          resolve();
        });
        observer.activate();
      }
    }),
    promise
  ])
    .then(...Finally<T>(() => {
      if (observer !== void 0) {
        observer.deactivate();
      }
    }));
}


/**
 * Races between the promise and a cancelled state.
 *  if cancel first, apply strategy
 *  else pass though promise
 * @param token
 * @param promise
 * @param strategy
 * @param onCancelled
 */
export function PromiseCancelTokenWrapPromise<T>(
  token: IPromiseCancelToken,
  promise: Promise<T>,
  strategy?: TCancelStrategy,
  onCancelled?: TOnCancelled,
): Promise<T | void> {
  return RaceCancelled<T>(token, promise)
    .then(...Finally<T>(() => {
      return token.cancelled
        ? ApplyOnCancelCallback(token, strategy, onCancelled)
        : Promise.resolve();
    }));
}

export function PromiseCancelTokenWrapFunction<CB extends (...args: any[]) => any>(
  token: PromiseCancelToken,
  callback: CB,
  strategy?: TCancelStrategy,
  onCancelled?: TOnCancelled,
): (...args: Parameters<CB>) => Promise<TPromiseType<ReturnType<CB>> | void> {
  type T = TPromiseType<ReturnType<CB>>;
  return function (...args: Parameters<CB>): Promise<T | void> {
    return token.cancelled
      ? ApplyOnCancelCallback(token, strategy, onCancelled)
      : PromiseCancelTokenWrapPromise<T>(token, PromiseTry<T>(() => callback.apply(null, args)), strategy, onCancelled);
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

  wrapPromise<T>(
    promise: Promise<T>,
    strategy?: TCancelStrategy,
    onCancelled?: TOnCancelled,
  ): Promise<T | void> {
    return PromiseCancelTokenWrapPromise<T>(this, promise, strategy, onCancelled);
  }

  wrapFunction<CB extends (...args: any[]) => any>(
    callback: CB,
    strategy?: TCancelStrategy,
    onCancelled?: TOnCancelled,
  ): (...args: Parameters<CB>) => Promise<TPromiseType<ReturnType<CB>> | void> {
    return PromiseCancelTokenWrapFunction<CB>(this, callback, strategy, onCancelled);
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


