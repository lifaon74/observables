import { INotificationsObservable } from '../../../core/notifications-observable/interfaces';
import { TPromiseType } from '../../../../promises/interfaces';

export type TCancelStrategy =
  'resolve' // resolve the promise with void
  | 'reject' // reject the promise with the Token's reason
  | 'never' // (default) never resolve the promise, it stays in a pending state forever
  ;


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
   *  WARN: it's impossible to cancel an AbortSignal if/when the Token is cancelled, prefer using linkWithAbortController instead
   */
  linkWithAbortSignal(signal: AbortSignal): () => void;


  /**
   * Wraps a promise with a this Token:
   *  Returns a Promise:
   *    if the token is cancelled, the Promise will never resolve (depends on strategy)
   *    else the Promise is resolved with the received value
   *
   * @Example:
   *  token.wrapPromise(new Promise(_ => setTimeout(_, 100)))
   *    .then(() => {
   *      console.log('never called');
   *    });
   *  token.cancel();
   *
   */
  wrapPromise<P extends PromiseLike<any>>(promise: P, strategy?: TCancelStrategy): P;

  /**
   * Wraps a function with this Token:
   *  Returns a function similar to 'callback':
   *    Has the same parameters than 'callback'
   *    If the token is cancelled, returns a Promise never resolved (depends on strategy)
   *    Else, returns a Promise resolved with the callback's return
   *
   *
   *  @Example:
   *   token.wrapPromise(fetch('abc'))
   *    .then(token.wrap(_ => _.json()));
   *    .then(() => {
   *      console.log('never called');
   *    });
   *  token.cancel();
   */
  wrapFunction<CB extends (...args: any[]) => any>(callback: CB, strategy?: TCancelStrategy): (...args: Parameters<CB>) => Promise<TPromiseType<ReturnType<CB>>>;

  /**
   * Wraps the fetch arguments with this Token:
   *  If the token is cancelled, the fetch will be aborted
   *
   * @Example:
   *  fetch(...token.wrapFetchArguments('http://domain.com'))
   */
  wrapFetchArguments(requestInfo: RequestInfo, requestInit?: RequestInit): [RequestInfo, RequestInit | undefined];

}
