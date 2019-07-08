import {
  IPromiseCancelToken, TCancelStrategy
} from '../../notifications/observables/promise-observable/promise-cancel-token/interfaces';
import {
  TPromiseOrValue, TPromiseOrValueFactoryTupleToValueUnion, TPromiseOrValueTupleToValueTuple,
  TPromiseOrValueTupleToValueUnion
} from '../interfaces';


export type TCancellablePromiseRaceFactory<T> = (token: IPromiseCancelToken) => TPromiseOrValue<T>;

export type TCancellablePromiseCreateCallback<T> = (this: ICancellablePromise<T>, resolve: (value?: TPromiseOrValue<T>) => void, reject: (reason?: any) => void, token: IPromiseCancelToken) => void;

/** INTERFACES **/

export interface ICancellablePromiseConstructor {

  // Equivalent of Promise.resolve
  resolve(): ICancellablePromise<void>;
  resolve<T>(value: TPromiseOrValue<T>, token?: IPromiseCancelToken, strategy?: TCancelStrategy): ICancellablePromise<T>;

  // Equivalent of Promise.reject
  reject<T = never>(reason?: any, token?: IPromiseCancelToken, strategy?: TCancelStrategy): ICancellablePromise<T>;

  /**
   * Creates a CancellablePromise from the result of 'callback':
   *  - kind of new Promise(_ => _(callback()))
   * @param callback
   * @param token
   * @param strategy
   */
  try<T>(callback: (this: ICancellablePromise<T>, token: IPromiseCancelToken) => TPromiseOrValue<T>, token?: IPromiseCancelToken, strategy?: TCancelStrategy): ICancellablePromise<T>;

  // Equivalent of Promise.race
  race<TTuple extends TPromiseOrValue<any>[]>(values: TTuple, token?: IPromiseCancelToken, strategy?: TCancelStrategy): ICancellablePromise<TPromiseOrValueTupleToValueUnion<TTuple>>;

  /**
   * Equivalent of Promise.race but gets the values though a callback instead.
   * Useful to race without providing a token to the CancellablePromise
   * @param callback
   * @param token
   * @param strategy
   */
  raceCallback<TTuple extends TPromiseOrValue<any>[]>(callback: (this: ICancellablePromise<TPromiseOrValueTupleToValueUnion<TTuple>>, token: IPromiseCancelToken) => TTuple, token?: IPromiseCancelToken, strategy?: TCancelStrategy): ICancellablePromise<TPromiseOrValueTupleToValueUnion<TTuple>>;

  /**
   * Equivalent of Promise.race but get the values though a list of factories instead.
   * As soon one of the factories resolves, the tokens provided for all the others are cancelled.
   * Useful to race and cancel unused promises.
   * @param factories
   * @param token
   * @param strategy
   * @example: run 4 parallel delay promises, as soon as one resolves, cancel all the others
   *  CancellablePromise.raceCancellable(Array.from({ length: 4 }, (value: void, index: number) => {
   *    return (token: IPromiseCancelToken) => {
   *      return $delay(index * 1000, token)
   *        .cancelled((token: IPromiseCancelToken) => {
   *          console.log(`index: ${ index } cancelled: ${ token.reason.message }`);
   *        });
   *    };
   *  }));
   *  // 0 will resolve first and 1, 2, 3 will be cancelled
   *
   */
  raceCancellable<TTuple extends TCancellablePromiseRaceFactory<any>[]>(factories: TTuple, token?: IPromiseCancelToken, strategy?: TCancelStrategy): ICancellablePromise<TPromiseOrValueFactoryTupleToValueUnion<TTuple>>;

  // Equivalent of Promise.all
  all<TTuple extends TPromiseOrValue<any>[]>(values: TTuple, token?: IPromiseCancelToken, strategy?: TCancelStrategy): ICancellablePromise<TPromiseOrValueTupleToValueTuple<TTuple>>;

  // Equivalent of Promise.all with the same behaviour of 'raceCallback'
  allCallback<TTuple extends TPromiseOrValue<any>[]>(callback: (this: ICancellablePromise<TPromiseOrValueTupleToValueTuple<TTuple>>, token: IPromiseCancelToken) => TTuple, token?: IPromiseCancelToken, strategy?: TCancelStrategy): ICancellablePromise<TPromiseOrValueTupleToValueTuple<TTuple>>;

  /**
   * Equivalent of window.fetch:
   *  - aborts the fetch request if the token is cancelled
   *  - returns a CancellablePromise instead of a Promise
   * @param requestInfo
   * @param requestInit
   * @param token
   * @param strategy
   */
  fetch(requestInfo: RequestInfo, requestInit?: RequestInit, token?: IPromiseCancelToken, strategy?: TCancelStrategy): ICancellablePromise<Response>;

  /**
   * Just like `new CancellablePromise(...args)`,
   * but if 'promiseOrCallback' is a CancellablePromise with the same token returns it (promiseOrCallback) instead of creating a new one
   * @param promiseOrCallback
   * @param token
   * @param strategy
   */
  of<T>(promiseOrCallback: Promise<T> | TCancellablePromiseCreateCallback<T>, token?: IPromiseCancelToken, strategy?: TCancelStrategy): ICancellablePromise<T>;


  /**
   * Creates a new CancellablePromise from an exiting promise or the same function you may provide to a Promise.
   * @param promiseOrCallback
   * @param token
   * @param strategy
   */
  new<T>(promiseOrCallback: Promise<T> | TCancellablePromiseCreateCallback<T>, token?: IPromiseCancelToken, strategy?: TCancelStrategy): ICancellablePromise<T>;
}


/**
 * A CancellablePromise is a Promise we may cancel at any time.
 * If the CancellablePromise is cancelled:
 *  - 'then', 'catch', and 'finally' won't be called and 'promise' will never resolve (depends on strategy)
 *  - 'cancelled' is called whatever its place in the promise chain (won't wait on provided promise to resolve)
 */
export interface ICancellablePromise<T> extends Promise<T> {
  readonly promise: Promise<T>; // a promised wrapped by the CancellablePromise's token. May never resolve if token is cancelled (depends on strategy).
  readonly token: IPromiseCancelToken; // the PromiseCancelToken associated with this CancellablePromise

  /**
   * Equivalent of the 'then' of a Promise:
   *  - provides the token in both callbacks
   *  - wraps 'onFulfilled' and 'onRejected' with the token (may never be called if token is cancelled)
   * @param onFulfilled
   * @param onRejected
   */
  then<TResult1 = T, TResult2 = never>(
    onFulfilled?: ((this: this, value: T, token: IPromiseCancelToken) => TPromiseOrValue<TResult1>) | undefined | null,
    onRejected?: ((this: this, reason: any, token: IPromiseCancelToken) => TPromiseOrValue<TResult2>) | undefined | null
  ): ICancellablePromise<TResult1 | TResult2>;

  /**
   * Equivalent of the 'catch' of a Promise:
   *  - same behaviour as previously mentioned (may never be called)
   * @param onRejected
   */
  catch<TResult = never>(
    onRejected?: ((this: this, reason: any, token: IPromiseCancelToken) => TPromiseOrValue<TResult>) | undefined | null
  ): ICancellablePromise<T | TResult>;

  /**
   * Equivalent of the 'catch' of a Promise:
   *   - same behaviour as previously mentioned (may never be called)
   * @param onFinally
   */
  finally(onFinally?: ((this: this, token: IPromiseCancelToken) => void) | undefined | null): ICancellablePromise<T>;


  /**
   * Kind of 'finally' but handles the cancelled state:
   *  - if/when the token is cancelled, every following 'cancelled' handlers (including this one) in the promise chain will be called immediately.
   *  - promise remains cancelled
   * @param onCancelled
   */
  cancelled(onCancelled: ((this: this, token: IPromiseCancelToken) => void) | undefined | null): ICancellablePromise<T>;

}

/*
// Example

export function cancellablePromiseExample(): ICancellablePromise<void> {
  return CancellablePromise.fetch('http://domain.com/request1')
    .then((response: Response) => {
      return response.json();
    })
    .then((json: any) => {
      console.log(json);
      // continue...
    });
}
*/

