import { Notification } from '../../notifications/core/notification/implementation';
import {
  INotificationsObservableInternal, NotificationsObservable
} from '../../notifications/core/notifications-observable/implementation';
import { INotificationsObserver } from '../../notifications/core/notifications-observer/interfaces';
import { ConstructClassWithPrivateMembers } from '../helpers/ClassWithPrivateMembers';
import {
  ICancelToken, ICancelTokenConstructor, ICancelTokenKeyValueMap,
  TCancelTokenWrapPromiseCallback, TCancelStrategy, TCancelStrategyReturnedPromise,
  TCancelStrategyReturn, ICancelTokenWrapPromiseOptions
} from './interfaces';
import { NotificationsObserver } from '../../notifications/core/notifications-observer/implementation';
import { Reason } from '../reason/implementation';
import { IsObject, noop } from '../../helpers';
import { TPromise, TPromiseOrValue, TPromiseType } from '../../promises/interfaces';
import { Finally, IsPromiseLikeBase, NEVER_PROMISE, PromiseTry, VOID_PROMISE } from '../../promises/helpers';
import { INotificationsObservableContext } from '../../notifications/core/notifications-observable/interfaces';




export const CANCEL_TOKEN_PRIVATE = Symbol('cancel-token-private');

export interface ICancelTokenPrivate {
  context: INotificationsObservableContext<ICancelTokenKeyValueMap>;
  cancelled: boolean;
  reason: any | undefined;
}

export interface ICancelTokenInternal extends ICancelToken, INotificationsObservableInternal<ICancelTokenKeyValueMap> {
  [CANCEL_TOKEN_PRIVATE]: ICancelTokenPrivate;
}


export function ConstructCancelToken(
  instance: ICancelToken,
  context: INotificationsObservableContext<ICancelTokenKeyValueMap>
): void {
  ConstructClassWithPrivateMembers(instance, CANCEL_TOKEN_PRIVATE);
  const privates: ICancelTokenPrivate = (instance as ICancelTokenInternal)[CANCEL_TOKEN_PRIVATE];
  privates.context = context;
  privates.cancelled = false;
  privates.reason = void 0;
}

export function IsCancelToken(value: any): value is ICancelToken {
  return IsObject(value)
    && (CANCEL_TOKEN_PRIVATE in value);
}

export function CancelTokenCancel(instance: ICancelToken, reason: any = void 0): void {
  const privates: ICancelTokenPrivate = (instance as ICancelTokenInternal)[CANCEL_TOKEN_PRIVATE];
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
 * Links a CancelToken with the fetch arguments.
 * Returns the modified RequestInit
 * @param instance
 * @param requestInfo
 * @param requestInit
 */
export function LinkCancelTokenWithFetchArguments(instance: ICancelToken, requestInfo: RequestInfo, requestInit?: RequestInit): RequestInit | undefined {
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
 *  fetch(...LinkCancelTokenWithFetchArgumentsSpread(instance, requestInfo, requestInit))
 * @param instance
 * @param requestInfo
 * @param requestInit
 */
export function LinkCancelTokenWithFetchArgumentsSpread(instance: ICancelToken, requestInfo: RequestInfo, requestInit?: RequestInit): [RequestInfo, RequestInit | undefined] {
  return [requestInfo, LinkCancelTokenWithFetchArguments(instance, requestInfo, requestInit)];
}


/**
 * IMPLEMENTATION
 */

export interface ICancelTokenWrapPromiseOptionsStrict<TStrategy extends TCancelStrategy, TCancelled> extends ICancelTokenWrapPromiseOptions<TStrategy, TCancelled> {
  strategy: TStrategy;
}


export function CancelTokenNormalizeWrapPromiseOptions<TStrategy extends TCancelStrategy, TCancelled>(options?: ICancelTokenWrapPromiseOptions<TStrategy, TCancelled>): ICancelTokenWrapPromiseOptionsStrict<TStrategy, TCancelled> {
  const _options: ICancelTokenWrapPromiseOptionsStrict<TStrategy, TCancelled> = {} as ICancelTokenWrapPromiseOptionsStrict<TStrategy, TCancelled>;
  if (options === void 0) {
    options = {};
  } else if (!IsObject(options)) {
    throw new TypeError(`Expected object or void as options`);
  }

  if (options.strategy === void 0) {
    _options.strategy = 'never' as TStrategy;
  } else if (['resolve', 'reject', 'never'].includes(options.strategy)) {
    _options.strategy = options.strategy;
  } else {
    throw new TypeError(`Expected 'resolve', 'reject', 'never' or void as options.strategy`);
  }

  if (options.onCancelled === void 0) {
    _options.onCancelled = void 0;
  } else if (typeof options.onCancelled === 'function') {
    _options.onCancelled = options.onCancelled;
  } else {
    throw new TypeError(`Expected function or void as options.onCancelled`);
  }


  if (options.onCancelledToken === void 0) {
    if (_options.onCancelled !== void 0) {
      _options.onCancelledToken = new CancelToken();
    }
  } else if (IsCancelToken(options.onCancelledToken)) {
    if (_options.onCancelled === void 0) {
      throw new Error(`options.onCancelledToken is defined but options.onCancelled is missing`);
    } else {
      _options.onCancelledToken = options.onCancelledToken;
    }
  } else {
    throw new TypeError(`Expected CancelledToken or void as options.onCancelledToken`);
  }
  return _options;
}

/**
 * Links a CancelToken with an AbortController.
 * Returns a function, when invoked => undo the link
 * @param instance
 * @param controller
 */
export function CancelTokenLinkWithAbortController(instance: ICancelToken, controller: AbortController): () => void {
  if (controller.signal.aborted) {
    if ((instance as ICancelTokenInternal)[CANCEL_TOKEN_PRIVATE].cancelled) {
      // both cancelled => do nothing
    } else {
      instance.cancel(new CancelReason(`AbortController aborted`));
    }
    return () => {
    };
  } else if ((instance as ICancelTokenInternal)[CANCEL_TOKEN_PRIVATE].cancelled) {
    controller.abort();
    return () => {
    };
  } else { // none cancelled
    const clear = () => {
      controller.signal.removeEventListener('abort', onControllerAborted, false);
      tokenCancelListener.deactivate();
    };

    const tokenCancelListener: INotificationsObserver<'cancel', any> = instance.addListener('cancel', () => {
      // CancelToken has been cancelled first
      clear();
      controller.abort();
    }).activate();


    const onControllerAborted = () => {
      // controller has been cancelled first
      clear();
      instance.cancel(new CancelReason(`AbortController aborted`));
    };

    controller.signal.addEventListener('abort', onControllerAborted, false);

    return clear;
  }
}


/**
 * Links a CancelToken with an AbortSignal
 *  If the AbortSignal aborts, the Token is cancelled
 *  WARN: cannot cancel a AbortSignal if the Token is cancelled
 * @param instance
 * @param signal
 */
export function CancelTokenLinkWithAbortSignal(instance: ICancelToken, signal: AbortSignal): () => void {
  if (signal.aborted) {
    if ((instance as ICancelTokenInternal)[CANCEL_TOKEN_PRIVATE].cancelled) {
      // both cancelled => do nothing
    } else {
      instance.cancel(new CancelReason(`AbortSignal aborted`));
    }
    return () => {
    };
  } else if ((instance as ICancelTokenInternal)[CANCEL_TOKEN_PRIVATE].cancelled) {
    throw new Error(`Trying to link a cancelled CancelToken with a non aborted signal.`);
  } else {
    const clear = () => {
      signal.removeEventListener('abort', onControllerAborted, false);
      tokenCancelListener.deactivate();
    };

    const tokenCancelListener: INotificationsObserver<'cancel', any> = instance.addListener('cancel', () => {
      clear();
      throw new Error(`A CancelToken linked with an AbortSignal has been cancelled. But a AbortSignal is not directly cancellable.`);
    }).activate();

    const onControllerAborted = () => {
      // controller has been cancelled first
      clear();
      instance.cancel(new CancelReason(`AbortSignal aborted`));
    };

    signal.addEventListener('abort', onControllerAborted, false);

    return clear;
  }
}



/**
 * Returns a Promise with a cancel strategy:
 *  - never: never resolves
 *  - resolve: resolves with undefined
 *  - reject: rejects with instance.reason
 * @param strategy
 * @param reason
 */
export function ApplyCancelStrategy<TStrategy extends TCancelStrategy>(strategy?: TStrategy, reason?: string): TPromise<TCancelStrategyReturn<TStrategy>> {
  switch (strategy) {
    case void 0:
    case 'never':
      return NEVER_PROMISE;
    case 'resolve':
      return VOID_PROMISE as Promise<TCancelStrategyReturn<TStrategy>>;
    case 'reject':
      return Promise.reject(reason);
    default:
      throw new TypeError(`Unexpected strategy: ${ strategy }`);
  }
}

export function ApplyCancelStrategyFromInstance<TStrategy extends TCancelStrategy>(instance: ICancelToken, strategy?: TStrategy, reason: string = instance.reason): TPromise<TCancelStrategyReturn<TStrategy>> {
  return ApplyCancelStrategy(strategy, reason);
}


/**
 * Calls the onCancelled function.
 * @param instance
 * @param options
 */
export function ApplyOnCancelCallback<TStrategy extends TCancelStrategy, TCancelled>(
  instance: ICancelToken,
  options: ICancelTokenWrapPromiseOptionsStrict<TStrategy, TCancelled>,
): TPromise<TCancelled | TCancelStrategyReturn<TStrategy>> {
  if (typeof options.onCancelled === 'function') {
    const newToken: ICancelToken = options.onCancelledToken as ICancelToken;
    return newToken.wrapPromise<TCancelled | TCancelStrategyReturn<TStrategy>, TStrategy, never>(
      PromiseTry<TCancelled | TCancelStrategyReturn<TStrategy>>(() => (options.onCancelled as Function).call(instance, instance.reason, newToken)),
      {
        strategy: options.strategy,
      }
    );
  } else {
    return ApplyCancelStrategyFromInstance<TStrategy>(instance, options.strategy);
  }
}

/**
 * Returns a Promise resolving as soon as 'promise' is resolved or 'instance' is cancelled
 * @param instance
 * @param promise
 */
export function RaceCancelled<T>(
  instance: ICancelToken,
  promise: TPromise<T>,
): TPromise<T | void> {
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
 * @param options
 */
export function CancelTokenWrapPromise<T, TStrategy extends TCancelStrategy, TCancelled>(
  instance: ICancelToken,
  promise: TPromise<T>,
  options: ICancelTokenWrapPromiseOptionsStrict<TStrategy, TCancelled>,
): TCancelStrategyReturnedPromise<T, TStrategy, TCancelled> {
  return RaceCancelled<T>(instance, promise)
    .then((value: T): TPromiseOrValue<T | TCancelStrategyReturn<TStrategy> | TCancelled> => {
      return instance.cancelled
        ? ApplyOnCancelCallback<TStrategy, TCancelled>(instance, options)
        : value;
    }, (error: any): TPromiseOrValue<never | TCancelStrategyReturn<TStrategy> | TCancelled> => {
      if (instance.cancelled) {
        return ApplyOnCancelCallback<TStrategy, TCancelled>(instance, options);
      } else {
        throw error;
      }
    });
}

export function CancelTokenWrapPromiseOrCreate<T, TStrategy extends TCancelStrategy, TCancelled>(
  instance: ICancelToken,
  promiseOrCallback: TPromise<T> | TCancelTokenWrapPromiseCallback<T>,
  options: ICancelTokenWrapPromiseOptionsStrict<TStrategy, TCancelled>,
): TCancelStrategyReturnedPromise<T, TStrategy, TCancelled> {
  if (typeof promiseOrCallback === 'function') {
    // ensures promiseOrCallback is called only if token is not cancelled
    return CancelTokenWrapFunction<() => TPromise<T>, TStrategy, TCancelled>(instance, () => {
      return new Promise<T>((resolve: (value?: TPromiseOrValue<T>) => void, reject: (reason?: any) => void) => {
        promiseOrCallback.call(instance, resolve, reject, instance);
      })
    }, options)();
  } else if (IsPromiseLikeBase(promiseOrCallback)) {
    return CancelTokenWrapPromise<T, TStrategy, TCancelled>(instance, promiseOrCallback, options);
  } else {
    throw new TypeError(`Expected Promise or function as token.wrapPromise's first argument.`);
  }
}

export function CancelTokenWrapFunction<CB extends (...args: any[]) => any, TStrategy extends TCancelStrategy, TCancelled>(
  instance: ICancelToken,
  callback: CB,
  options: ICancelTokenWrapPromiseOptionsStrict<TStrategy, TCancelled>,
): (...args: Parameters<CB>) => TCancelStrategyReturnedPromise<TPromiseType<ReturnType<CB>>, TStrategy, TCancelled> {
  type T = TPromiseType<ReturnType<CB>>;
  return function (...args: Parameters<CB>): TCancelStrategyReturnedPromise<T, TStrategy, TCancelled> {
    return instance.cancelled
      ? ApplyOnCancelCallback<TStrategy, TCancelled>(instance, options)
      : CancelTokenWrapPromise<T, TStrategy, TCancelled>(instance, PromiseTry<T>(() => callback.apply(this, args)), options);
  };
}


export function CancelTokenLinkWithTokens(
  instance: ICancelToken,
  tokens: ICancelToken[],
): () => void {
  if (tokens.length > 0) {
    const index: number = tokens.findIndex(token => token.cancelled);

    if (index === -1) {
      const clear = () => {
        tokenObserver.deactivate();
        tokensObserver.forEach(tokenObserver => tokenObserver.deactivate());
      };

      const cancel = (reason: any) => {
        clear();
        instance.cancel(reason);
      };

      const tokenObserver = instance.addListener('cancel', clear);
      const tokensObserver = tokens.map(tokenObserver => tokenObserver.addListener('cancel', cancel));
      tokenObserver.activate();
      tokensObserver.forEach(tokenObserver => tokenObserver.activate());
      return clear;
    } else {
      instance.cancel(tokens[index].reason);
      return noop;
    }
  } else {
    throw new Error(`Expected at least one token`);
  }
}

export function CancelTokenOf(
  constructor: ICancelTokenConstructor,
  tokens: ICancelToken[],
): ICancelToken {
  const instance: ICancelToken = new constructor();
  CancelTokenLinkWithTokens(instance, tokens);
  return instance;
}


export class CancelToken extends NotificationsObservable<ICancelTokenKeyValueMap> implements ICancelToken {

  static of(...tokens: ICancelToken[]): ICancelToken {
    return CancelTokenOf(this, tokens);
  }

  constructor() {
    let context: INotificationsObservableContext<ICancelTokenKeyValueMap>;
    super((_context: INotificationsObservableContext<ICancelTokenKeyValueMap>) => {
      context = _context;
    });
    // @ts-ignore
    ConstructCancelToken(this, context);
  }

  get cancelled(): boolean {
    return ((this as unknown) as ICancelTokenInternal)[CANCEL_TOKEN_PRIVATE].cancelled;
  }

  get reason(): any {
    return ((this as unknown) as ICancelTokenInternal)[CANCEL_TOKEN_PRIVATE].reason;
  }


  cancel(reason?: any): void {
    CancelTokenCancel(this, reason);
  }

  linkWithToken(...tokens: ICancelToken[]): () => void {
    return CancelTokenLinkWithTokens(this, tokens);
  }

  toAbortController(): AbortController {
    const controller: AbortController = new AbortController();
    this.linkWithAbortController(controller);
    return controller;
  }

  linkWithAbortController(controller: AbortController): () => void {
    return CancelTokenLinkWithAbortController(this, controller);
  }

  linkWithAbortSignal(signal: AbortSignal): () => void {
    return CancelTokenLinkWithAbortSignal(this, signal);
  }

  wrapPromise<T, TStrategy extends TCancelStrategy, TCancelled>(
    promiseOrCallback: TPromise<T> | TCancelTokenWrapPromiseCallback<T>,
    options?: ICancelTokenWrapPromiseOptions<TStrategy, TCancelled>,
  ): TCancelStrategyReturnedPromise<T, TStrategy, TCancelled> {
    return CancelTokenWrapPromiseOrCreate<T, TStrategy, TCancelled>(this, promiseOrCallback, CancelTokenNormalizeWrapPromiseOptions(options));
  }

  wrapFunction<CB extends (...args: any[]) => any, TStrategy extends TCancelStrategy, TCancelled>(
    callback: CB,
    options?: ICancelTokenWrapPromiseOptions<TStrategy, TCancelled>,
  ): (...args: Parameters<CB>) => TCancelStrategyReturnedPromise<TPromiseType<ReturnType<CB>>, TStrategy, TCancelled> {
    return CancelTokenWrapFunction<CB, TStrategy, TCancelled>(this, callback, CancelTokenNormalizeWrapPromiseOptions(options));
  }

  wrapFetchArguments(requestInfo: RequestInfo, requestInit?: RequestInit): [RequestInfo, RequestInit | undefined] {
    return LinkCancelTokenWithFetchArgumentsSpread(this, requestInfo, requestInit);
  }
}


export class CancelTokenObserver extends NotificationsObserver<'cancel', any> {
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
 * An Error which indicates something has been cancelled.
 */
export class CancelError extends Error {
  static discard(reason: any): void | never {
    if (!(reason instanceof CancelError)) {
      throw reason;
    }
  }

  constructor(message: string = 'Cancelled') {
    super(message);
    (this as any).name = 'CancelError';
  }
}

/**
 * A Reason which indicates something has been cancelled.
 */
export class CancelReason extends Reason<'CANCEL'> {
  static discard(reason: any): void | never {
    if (!(reason instanceof CancelReason)) {
      throw reason;
    }
  }

  constructor(message: string = 'Cancelled') {
    super(message, 'CANCEL');
  }
}


