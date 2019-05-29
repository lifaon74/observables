import { INotificationsObservable } from '../../../core/notifications-observable/interfaces';
import { TPromiseOrValue, TPromiseType } from '../../../../promises/interfaces';

export interface IPromiseCancelTokenConstructor {
  new(): IPromiseCancelToken;
}

export interface IPromiseCancelTokenKeyValueMap {
  cancel: any;
}

/**
 * Represents a Token able to cancel a Promise.
 *  This Token is a NotificationsObservable which may send a 'cancel' Notification
 */
export interface IPromiseCancelToken extends INotificationsObservable<IPromiseCancelTokenKeyValueMap> {
  readonly cancelled: boolean;
  readonly reason: any;

  // cancels the Token and notify the Promise to stop its job.
  cancel(reason?: any): void;

  // creates an AbortController linked with this Token
  toAbortController(): AbortController;

  /**
   * Links this Token with an AbortController
   *  If the AbortController aborts, the Token is cancelled
   *  If the Token is cancelled, aborts the AbortController
   */
  linkWithAbortController(controller: AbortController): () => void;

  /**
   * Links this Token with an AbortSignal
   *  If the AbortSignal aborts, the Token is cancelled
   *  WARN: cannot cancel a AbortSignal if the Token is cancelled, prefer using linkWithAbortController instead
   */
  linkWithAbortSignal(signal: AbortSignal): () => void;


  /**
   * Wraps a promise with a this Token:
   *  Returns a Promise:
   *    if the token is cancelled, the Promise will never resolve
   *    else the Promise is resolved with the received value
   * @param promise
   */
  wrapPromise<P extends PromiseLike<any>>(promise: P): P;

  /**
   * Wraps a callback with this Token:
   *  Returns a function similar to 'callback':
   *    Has the same parameters than 'callback'
   *    If the token is cancelled, returns a Promise never resolved
   *    Else, returns a Promise resolved with the callback's return
   */
  wrapCallback<CB extends (...args: any[]) => any>(callback: CB): (...args: Parameters<CB>) => Promise<TPromiseType<ReturnType<CB>>>;
}
