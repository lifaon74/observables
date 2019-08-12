import { INotificationsObservable } from '../../notifications/core/notifications-observable/interfaces';
import { TPromiseOrValue, TPromiseType } from '../../promises/interfaces';


/** TYPES **/

export type TCancelStrategy =
  'resolve' // resolve the promise with void
  | 'reject' // reject the promise with the Token's reason
  | 'never' // (default) never resolve the promise, it stays in a pending state forever
  ;

export type TCancelStrategyReturn<TStrategy extends TCancelStrategy> =
  TStrategy extends 'resolve'
    ? void
    : TStrategy extends 'reject'
    ? never
    : never;
export type TCancelStrategyReturnedPromise<T, TStrategy extends TCancelStrategy, TCancelled> = Promise<T | TCancelStrategyReturn<TStrategy> | TCancelled>;


export type TCancelTokenWrapPromiseCallback<T> = (this: ICancelToken, resolve: (value?: TPromiseOrValue<T>) => void, reject: (reason?: any) => void, token: ICancelToken) => void;

export type TCatchCancelled<T, TStrategy extends TCancelStrategy> = (this: ICancelToken, reason: any, rethrowCancelled: () => Promise<TCancelStrategyReturn<TStrategy>>) => (TPromiseOrValue<T> | Promise<TCancelStrategyReturn<TStrategy>>);


export interface ICancelTokenWrapPromiseOptions<TStrategy extends TCancelStrategy, TCancelled> {
  strategy?: TStrategy;
  onCancelled?: TCatchCancelled<TCancelled, TStrategy>;
}


/** INTERFACES **/

export interface ICancelTokenConstructor {
  new(): ICancelToken;

  /**
   * Builds a new CancelToken from a list of CancelTokens:
   *  - if one of the provided 'tokens' is cancelled, cancel this Token with the cancelled token's reason
   * Equivalent of the 'linkWithTokens' method
   */
  of(...tokens: ICancelToken[]): ICancelToken;
}

export interface ICancelTokenKeyValueMap {
  cancel: any;
}

/**
 * Represents a Token able to cancel a Promise.
 *  This Token is a NotificationsObservable which may send a 'cancel' Notification
 */
export interface ICancelToken extends INotificationsObservable<ICancelTokenKeyValueMap> {
  readonly cancelled: boolean;
  readonly reason: any;

  // cancels the Token and notify the Promise to stop its job.
  cancel(reason?: any): void;

  /**
   * INFO: linkWith<name> methods return an undo function: calling this function will undo the link.
   */

  /**
   * Links this Token with some others tokens
   *  If one of the provided 'tokens' is cancelled, cancel this Token with the cancelled token's reason
   * @Example:
   *  function run(token: CancelToken) {
   *    const _token = new CancelToken();
   *    _token.linkWithToken(token);
   *    document.querySelector(`.close-button`).addEventListener('click', () => _token.cancel(new Reason('clicked on close')));
   *    return _token.wrapPromise(fetch(..._token.wrapFetchArguments('http://domain.com/request1')));
   *  }
   */
  linkWithToken(...tokens: ICancelToken[]): () => void;


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
   *    if/when the token is cancelled, apply the cancel strategy (ex: the returned Promise will never resolve by default)
   *    else the returned Promise is resolved with the received value from 'promise'
   *
   *  INFO: the cancelled state doesnt wait on the resolved state of the promise, meaning this function's returned Promise may resolve even if promise didn't resolve
   *
   * @Example:
   *  token.wrapPromise(new Promise(resolve => setTimeout(resolve, 100)))
   *    .then(() => {
   *      console.log('never called');
   *    });
   *  token.cancel();
   *
   */
  wrapPromise<T, TStrategy extends TCancelStrategy, TCancelled>(
    promiseOrCallback: Promise<T> | TCancelTokenWrapPromiseCallback<T>,
    options?: ICancelTokenWrapPromiseOptions<TStrategy, TCancelled>,
  ): TCancelStrategyReturnedPromise<T, TStrategy, TCancelled>;

  /**
   * Wraps a function with this Token:
   *  Returns a function similar to 'callback':
   *    Has the same parameters than 'callback'
   *    If/when the token is cancelled, apply the cancel strategy (ex: the Promise will never resolve by default)
   *    Else, returns a Promise resolved with the callback's return
   *
   *  INFO: the cancelled state doesnt wait on the resolved state of the promise/value returned by 'callback', meaning this function's returned Promise may resolve even if the callback's promise/value didn't resolve
   *  INFO: is token is already cancelled when calling the returned function, 'callback' is never called
   *
   *  @Example:
   *   fetch('abc')
   *    .then(token.wrapFunction(() => {
   *      console.log('never called');
   *    })
   *    .then(() => {
   *      console.log('never called');
   *    });
   *   token.cancel();
   *
   *  @Example:
   *   fetch('abc')
   *    .then(token.wrapFunction((response) => {
   *      token.cancel();
   *      return response.json()
   *    }));
   *    .then(() => {
   *      console.log('never called');
   *    });
   */
  wrapFunction<CB extends (...args: any[]) => any, TStrategy extends TCancelStrategy, TCancelled>(
    callback: CB,
    options?: ICancelTokenWrapPromiseOptions<TStrategy, TCancelled>,
  ): (...args: Parameters<CB>) => TCancelStrategyReturnedPromise<TPromiseType<ReturnType<CB>>, TStrategy, TCancelled>;

  /**
   * Wraps the fetch arguments with this Token:
   *  If the token is cancelled, the fetch will be aborted
   *
   *  INFO: an aborted fetch will throw an error, you may catch it by wrapping it with 'wrapPromise'
   *
   * @Example:
   *  fetch(...token.wrapFetchArguments('http://domain.com'));
   */
  wrapFetchArguments(requestInfo: RequestInfo, requestInit?: RequestInit): [RequestInfo, RequestInit | undefined];

}


/*
// Full example:

export function cancelTokenExample(): Promise<void> {
  const token: ICancelToken = new CancelToken();
  // 1) wrapFetchArguments => ensures fetch will be aborted when token is cancelled
  // 2) wrapPromise => ensures fetch won't resolve if token is cancelled
  return token.wrapPromise(fetch(...token.wrapFetchArguments('http://domain.com/request1')))
    .then(token.wrapFunction(function toJSON(response: Response) { // 3) ensures 'toJSON' is called only if token is not cancelled
      return response.json(); // 'wrapPromise' not required because we immediately return a promise inside 'wrapFunction'
    }))
    .then(token.wrapFunction(function next(json: any) { // 4) ensures 'next' is called only if token is not cancelled
      console.log(json);
      // continue...
    }));
}
*/



