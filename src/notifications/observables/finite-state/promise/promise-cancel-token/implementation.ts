import { Notification } from '../../../../core/notification/implementation';
import {
  INotificationsObservableInternal, NotificationsObservable
} from '../../../../core/notifications-observable/implementation';
import { INotificationsObserver } from '../../../../core/notifications-observer/interfaces';
import { ConstructClassWithPrivateMembers } from '../../../../../misc/helpers/ClassWithPrivateMembers';
import {
  IPromiseCancelToken, IPromiseCancelTokenConstructor, IPromiseCancelTokenKeyValueMap,
  TPromiseCancelTokenWrapPromiseCallback, TCancelStrategy, TOnCancelled
} from './interfaces';
import { NotificationsObserver } from '../../../../core/notifications-observer/implementation';
import { Reason } from '../../../../../misc/reason/implementation';
import { IsObject, noop } from '../../../../../helpers';
import { TPromiseOrValue, TPromiseType } from '../../../../../promises/interfaces';
import { Finally, IsPromiseLikeBase, PromiseTry } from '../../../../../promises/helpers';
import { INotificationsObservableContext } from '../../../../core/notifications-observable/interfaces';


export const PROMISE_CANCEL_TOKEN_PRIVATE = Symbol('promise-cancel-token-private');

export interface IPromiseCancelTokenPrivate {
  context: INotificationsObservableContext<IPromiseCancelTokenKeyValueMap>;
  cancelled: boolean;
  reason: any | undefined;
}

export interface IPromiseCancelTokenInternal extends IPromiseCancelToken, INotificationsObservableInternal<IPromiseCancelTokenKeyValueMap> {
  [PROMISE_CANCEL_TOKEN_PRIVATE]: IPromiseCancelTokenPrivate;
}


export function ConstructPromiseCancelToken(
  instance: IPromiseCancelToken,
  context: INotificationsObservableContext<IPromiseCancelTokenKeyValueMap>
): void {
  ConstructClassWithPrivateMembers(instance, PROMISE_CANCEL_TOKEN_PRIVATE);
  const privates: IPromiseCancelTokenPrivate = (instance as IPromiseCancelTokenInternal)[PROMISE_CANCEL_TOKEN_PRIVATE];
  privates.context = context;
  privates.cancelled = false;
  privates.reason = void 0;
}

export function IsPromiseCancelToken(value: any): value is IPromiseCancelToken {
  return IsObject(value)
    && (PROMISE_CANCEL_TOKEN_PRIVATE in value);
}

export function PromiseCancelTokenCancel(instance: IPromiseCancelToken, reason: any = void 0): void {
  const privates: IPromiseCancelTokenPrivate = (instance as IPromiseCancelTokenInternal)[PROMISE_CANCEL_TOKEN_PRIVATE];
  if (!privates.cancelled) {
    privates.cancelled = true;
    privates.reason = reason;
    privates.context.emit(new CancelNotification(reason));
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
 * @param instance
 * @param requestInfo
 * @param requestInit
 */
export function LinkPromiseCancelTokenWithFetchArguments(instance: IPromiseCancelToken, requestInfo: RequestInfo, requestInit?: RequestInit): RequestInit | undefined {
  if (IsObject(globalThis) && ('AbortController' in globalThis)) {
    const signal: AbortSignal | null = ExtractSignalFromFetchArguments(requestInfo, requestInit);
    if (signal === null) {
      const controller: AbortController = instance.toAbortController();
      // shallow copy of RequestInit
      requestInit = (requestInit === void 0) ? {} : Object.assign({}, requestInit);
      requestInit.signal = controller.signal;
    } else {
      instance.linkWithAbortSignal(signal);
    }
  }
  return requestInit;
}

/**
 * Just like the previous functions, but simplifies fetch calls:
 *  fetch(...LinkPromiseCancelTokenWithFetchArgumentsSpread(instance, requestInfo, requestInit))
 * @param instance
 * @param requestInfo
 * @param requestInit
 */
export function LinkPromiseCancelTokenWithFetchArgumentsSpread(instance: IPromiseCancelToken, requestInfo: RequestInfo, requestInit?: RequestInit): [RequestInfo, RequestInit | undefined] {
  return [requestInfo, LinkPromiseCancelTokenWithFetchArguments(instance, requestInfo, requestInit)];
}


/**
 * IMPLEMENTATION
 */

/**
 * Links a PromiseCancelToken with an AbortController.
 * Returns a function, when invoked => undo the link
 * @param instance
 * @param controller
 */
export function PromiseCancelTokenLinkWithAbortController(instance: IPromiseCancelToken, controller: AbortController): () => void {
  if (controller.signal.aborted) {
    if ((instance as IPromiseCancelTokenInternal)[PROMISE_CANCEL_TOKEN_PRIVATE].cancelled) {
      // both cancelled => do nothing
    } else {
      instance.cancel(new PromiseCancelReason(`AbortController aborted`));
    }
    return () => {
    };
  } else if ((instance as IPromiseCancelTokenInternal)[PROMISE_CANCEL_TOKEN_PRIVATE].cancelled) {
    controller.abort();
    return () => {
    };
  } else { // none cancelled
    const clear = () => {
      controller.signal.removeEventListener('abort', onControllerAborted, false);
      tokenCancelListener.deactivate();
    };

    const tokenCancelListener: INotificationsObserver<'cancel', any> = instance.addListener('cancel', () => {
      // PromiseCancelToken has been cancelled first
      clear();
      controller.abort();
    }).activate();


    const onControllerAborted = () => {
      // controller has been cancelled first
      clear();
      instance.cancel(new PromiseCancelReason(`AbortController aborted`));
    };

    controller.signal.addEventListener('abort', onControllerAborted, false);

    return clear;
  }
}


/**
 * Links a PromiseCancelToken with an AbortSignal
 *  If the AbortSignal aborts, the Token is cancelled
 *  WARN: cannot cancel a AbortSignal if the Token is cancelled
 * @param instance
 * @param signal
 */
export function PromiseCancelTokenLinkWithAbortSignal(instance: IPromiseCancelToken, signal: AbortSignal): () => void {
  if (signal.aborted) {
    if ((instance as IPromiseCancelTokenInternal)[PROMISE_CANCEL_TOKEN_PRIVATE].cancelled) {
      // both cancelled => do nothing
    } else {
      instance.cancel(new PromiseCancelReason(`AbortSignal aborted`));
    }
    return () => {
    };
  } else if ((instance as IPromiseCancelTokenInternal)[PROMISE_CANCEL_TOKEN_PRIVATE].cancelled) {
    throw new Error(`Trying to link a cancelled PromiseCancelToken with a non aborted signal.`);
  } else {
    const clear = () => {
      signal.removeEventListener('abort', onControllerAborted, false);
      tokenCancelListener.deactivate();
    };

    const tokenCancelListener: INotificationsObserver<'cancel', any> = instance.addListener('cancel', () => {
      clear();
      throw new Error(`A PromiseCancelToken linked with an AbortSignal has been cancelled. But a AbortSignal is not directly cancellable.`);
    }).activate();

    const onControllerAborted = () => {
      // controller has been cancelled first
      clear();
      instance.cancel(new PromiseCancelReason(`AbortSignal aborted`));
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
 *  - reject: rejects with instance.reason
 * @param instance
 * @param strategy
 */
export function ApplyCancelStrategy(instance: IPromiseCancelToken, strategy: TCancelStrategy = 'never'): Promise<void> {
  switch (strategy) {
    case 'never':
      return new Promise<never>(noop);
    case 'resolve':
      return Promise.resolve();
    case 'reject':
      return Promise.reject(instance.reason);
    default:
      throw new TypeError(`Unexpected strategy: ${ strategy }`);
  }
}

/**
 * If present, apply the onCancelled function and when resolved, the cancel strategy
 * @param instance
 * @param strategy
 * @param onCancelled
 */
export function ApplyOnCancelCallback(
  instance: IPromiseCancelToken,
  strategy?: TCancelStrategy,
  onCancelled?: TOnCancelled,
): Promise<void> {
  const promise: Promise<void> = (typeof onCancelled === 'function')
    ? PromiseTry<void>(() => onCancelled.call(instance, instance.reason))
    : Promise.resolve();

  return promise.then(() => ApplyCancelStrategy(instance, strategy));
}

/**
 * Returns a Promise resolving as soon as 'promise' is resolved or 'instance' is cancelled
 * @param instance
 * @param promise
 */
export function RaceCancelled<T>(
  instance: IPromiseCancelToken,
  promise: Promise<T>,
): Promise<T | void> {
  let observer: INotificationsObserver<'cancel', void>;

  return Promise.race<T | void>([
    new Promise<void>((resolve: any) => {
      if (instance.cancelled) {
        resolve();
      } else {
        observer = instance.addListener('cancel', () => {
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
 * @param instance
 * @param promise
 * @param strategy
 * @param onCancelled
 */
export function PromiseCancelTokenWrapPromise<T>(
  instance: IPromiseCancelToken,
  promise: Promise<T>,
  strategy?: TCancelStrategy,
  onCancelled?: TOnCancelled,
): Promise<T | void> {
  return RaceCancelled<T>(instance, promise)
    .then<T | void, never | void>((value: T) => {
      return instance.cancelled
        ? ApplyOnCancelCallback(instance, strategy, onCancelled)
        : value;
    }, (error: any) => {
      if (instance.cancelled) {
        return ApplyOnCancelCallback(instance, strategy, onCancelled);
      } else {
        throw error;
      }
    });
    // .then(...Finally<T>(() => {
    //   return instance.cancelled
    //     ? ApplyOnCancelCallback(instance, strategy, onCancelled)
    //     : Promise.resolve();
    // }));
}

export function PromiseCancelTokenWrapPromiseOrCreate<T>(
  instance: IPromiseCancelToken,
  promiseOrCallback: Promise<T> | TPromiseCancelTokenWrapPromiseCallback<T>,
  strategy?: TCancelStrategy,
  onCancelled?: TOnCancelled,
): Promise<T | void> {
  if (typeof promiseOrCallback === 'function') {
    // ensures promiseOrCallback is called only if token is not cancelled
    return PromiseCancelTokenWrapFunction(instance, () => {
      return new Promise<T>((resolve: (value?: TPromiseOrValue<T>) => void, reject: (reason?: any) => void) => {
        promiseOrCallback.call(instance, resolve, reject, instance);
      })
    }, strategy, onCancelled)();
  } else if (IsPromiseLikeBase(promiseOrCallback)) {
    return PromiseCancelTokenWrapPromise<T>(instance, promiseOrCallback, strategy, onCancelled);
  } else {
    throw new TypeError(`Expected Promise or function as token.wrapPromise's first argument.`);
  }
}

export function PromiseCancelTokenWrapFunction<CB extends (...args: any[]) => any>(
  instance: IPromiseCancelToken,
  callback: CB,
  strategy?: TCancelStrategy,
  onCancelled?: TOnCancelled,
): (...args: Parameters<CB>) => Promise<TPromiseType<ReturnType<CB>> | void> {
  type T = TPromiseType<ReturnType<CB>>;
  return function (...args: Parameters<CB>): Promise<T | void> {
    return instance.cancelled
      ? ApplyOnCancelCallback(instance, strategy, onCancelled)
      : PromiseCancelTokenWrapPromise<T>(instance, PromiseTry<T>(() => callback.apply(this, args)), strategy, onCancelled);
  };
}


export function PromiseCancelTokenLinkWithTokens(
  instance: IPromiseCancelToken,
  tokens: IPromiseCancelToken[],
): () => void {
  const index: number = tokens.findIndex(_ => _.cancelled);

  if (index === -1) {
    const clear = () => {
      tokenObserver.deactivate();
      tokensObserver.forEach(_ => _.deactivate());
    };

    const cancel = (reason: any) => {
      clear();
      instance.cancel(reason);
    };

    const tokenObserver = instance.addListener('cancel', clear);
    const tokensObserver = tokens.map(_ => _.addListener('cancel', cancel));
    tokenObserver.activate();
    tokensObserver.forEach(_ => _.activate());
    return clear;
  } else {
    instance.cancel(tokens[index].reason);
    return noop;
  }
}

export function PromiseCancelTokenOf(
  constructor: IPromiseCancelTokenConstructor,
  tokens: IPromiseCancelToken[],
): IPromiseCancelToken {
  const instance: IPromiseCancelToken = new constructor();
  PromiseCancelTokenLinkWithTokens(instance, tokens);
  return instance;
}


export class PromiseCancelToken extends NotificationsObservable<IPromiseCancelTokenKeyValueMap> implements IPromiseCancelToken {

  static of(...tokens: IPromiseCancelToken[]): IPromiseCancelToken {
    return PromiseCancelTokenOf(this, tokens);
  }

  constructor() {
    let context: INotificationsObservableContext<IPromiseCancelTokenKeyValueMap>;
    super((_context: INotificationsObservableContext<IPromiseCancelTokenKeyValueMap>) => {
      context = _context;
    });
    // @ts-ignore
    ConstructPromiseCancelToken(this, context);
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

  linkWithToken(...tokens: IPromiseCancelToken[]): () => void {
    return PromiseCancelTokenLinkWithTokens(this, tokens);
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
    promiseOrCallback: Promise<T> | TPromiseCancelTokenWrapPromiseCallback<T>,
    strategy?: TCancelStrategy,
    onCancelled?: TOnCancelled,
  ): Promise<T | void> {
    return PromiseCancelTokenWrapPromiseOrCreate<T>(this, promiseOrCallback, strategy, onCancelled);
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


