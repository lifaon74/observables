import {
  ICancelToken, TCancelStrategy
} from '../../misc/cancel-token/interfaces';
import {
  TPromiseOrValue, TPromiseOrValueFactoryTupleToValueUnion, TPromiseOrValueTupleToValueTuple,
  TPromiseOrValueTupleToValueUnion
} from '../interfaces';
import { TCastableToIteratorStrict } from '../../helpers';


export type TCancellablePromiseFactory<T> = (token: ICancelToken) => TPromiseOrValue<T>;

export type TCancellablePromiseCreateCallback<T> = (this: ICancellablePromise<T>, resolve: (value?: TPromiseOrValue<T>) => void, reject: (reason?: any) => void, token: ICancelToken) => void;

/** INTERFACES **/

export interface ICancellablePromiseConstructor {

  // Equivalent of Promise.resolve
  resolve(): ICancellablePromise<void>;
  resolve<T>(value: TPromiseOrValue<T>, token?: ICancelToken, strategy?: TCancelStrategy): ICancellablePromise<T>;

  // Equivalent of Promise.reject
  reject<T = never>(reason?: any, token?: ICancelToken, strategy?: TCancelStrategy): ICancellablePromise<T>;

  /**
   * Creates a CancellablePromise from the result of 'callback':
   *  - kind of new Promise(_ => _(callback()))
   * @param callback
   * @param token
   * @param strategy
   */
  try<T>(
    callback: (this: ICancellablePromise<T>, token: ICancelToken) => TPromiseOrValue<T>,
    token?: ICancelToken,
    strategy?: TCancelStrategy
  ): ICancellablePromise<T>;

  // Equivalent of Promise.race
  race<TTuple extends TPromiseOrValue<any>[]>(
    values: TTuple,
    token?: ICancelToken,
    strategy?: TCancelStrategy
  ): ICancellablePromise<TPromiseOrValueTupleToValueUnion<TTuple>>;

  /**
   * Equivalent of Promise.race but gets the values though a callback instead.
   * Useful to race without providing a token to the CancellablePromise
   * @param callback
   * @param token
   * @param strategy
   */
  raceCallback<TTuple extends TPromiseOrValue<any>[]>(
    callback: (this: ICancellablePromise<TPromiseOrValueTupleToValueUnion<TTuple>>, token: ICancelToken) => TTuple,
    token?: ICancelToken,
    strategy?: TCancelStrategy
  ): ICancellablePromise<TPromiseOrValueTupleToValueUnion<TTuple>>;

  /**
   * Equivalent of Promise.race but get the values though a list of factories instead.
   * As soon one of the factories resolves, the tokens provided for all the others are cancelled.
   * Useful to race and cancel unused promises.
   * @param factories
   * @param token
   * @param strategy
   * @example: run 4 parallel delay promises, as soon as one resolves, cancel all the others
   *  CancellablePromise.raceCancellable(Array.from({ length: 4 }, (value: void, index: number) => {
   *    return (token: ICancelToken) => {
   *      return $delay(index * 1000, token)
   *        .cancelled((token: ICancelToken) => {
   *          console.log(`index: ${ index } cancelled: ${ token.reason.message }`);
   *        });
   *    };
   *  }));
   *  // 0 will resolve first and 1, 2, 3 will be cancelled
   *
   */
  raceCancellable<TTuple extends TCancellablePromiseFactory<any>[]>(
    factories: TTuple,
    token?: ICancelToken,
    strategy?: TCancelStrategy
  ): ICancellablePromise<TPromiseOrValueFactoryTupleToValueUnion<TTuple>>;

  // Equivalent of Promise.all
  all<TTuple extends TPromiseOrValue<any>[]>(
    values: TTuple,
    token?: ICancelToken,
    strategy?: TCancelStrategy
  ): ICancellablePromise<TPromiseOrValueTupleToValueTuple<TTuple>>;

  // Equivalent of Promise.all with the same behaviour of 'raceCallback'
  allCallback<TTuple extends TPromiseOrValue<any>[]>(
    callback: (this: ICancellablePromise<TPromiseOrValueTupleToValueTuple<TTuple>>, token: ICancelToken) => TTuple,
    token?: ICancelToken,
    strategy?: TCancelStrategy
  ): ICancellablePromise<TPromiseOrValueTupleToValueTuple<TTuple>>;

  /**
   * Runs 'concurrent' promises in parallel until iterator is done.
   * If one the promises fails, cancels the token (meaning no more iterator.next()), and re-throws the error
   * @param iterator
   * @param concurrent
   * @param token
   * @param strategy
   */
  concurrent<T>(
    iterator: TCastableToIteratorStrict<TPromiseOrValue<T>>,
    concurrent?: number,
    token?: ICancelToken,
    strategy?: TCancelStrategy
  ): ICancellablePromise<void>;

  /**
   * Runs 'concurrent' promise factories in parallel until iterator is done
   * @param iterator
   * @param concurrent
   * @param token
   * @param strategy
   * @example: fetches 100 resources with a maximum of 4 parallel fetch
   *  CancellablePromise.concurrentFactories(Array.from({ length: 100 }, (value: void, index: number) => {
   *    return (token: ICancelToken) => {
   *      return CancellablePromise.fetch(`./resource/${ index }`, void 0, token);
   *    };
   *  }), 4);
   */
  concurrentFactories<T>(
    iterator: TCastableToIteratorStrict<TCancellablePromiseFactory<T>> ,
    concurrent?: number,
    token?: ICancelToken,
    strategy?: TCancelStrategy
  ): ICancellablePromise<void>;


  /**
   * Equivalent of window.fetch:
   *  - aborts the fetch request if the token is cancelled
   *  - returns a CancellablePromise instead of a Promise
   * @param requestInfo
   * @param requestInit
   * @param token
   * @param strategy
   */
  fetch(
    requestInfo: RequestInfo,
    requestInit?: RequestInit,
    token?: ICancelToken,
    strategy?: TCancelStrategy
  ): ICancellablePromise<Response>;

  /**
   * Just like `new CancellablePromise(...args)`,
   * but if 'promiseOrCallback' is a CancellablePromise with the same token returns it (promiseOrCallback) instead of creating a new one
   * @param promiseOrCallback
   * @param token
   * @param strategy
   */
  of<T>(
    promiseOrCallback: Promise<T> | TCancellablePromiseCreateCallback<T>,
    token?: ICancelToken,
    strategy?: TCancelStrategy
  ): ICancellablePromise<T>;


  /**
   * Creates a new CancellablePromise from an exiting promise or the same function you may provide to a Promise.
   * @param promiseOrCallback
   * @param token
   * @param strategy
   */
  new<T>(promiseOrCallback: Promise<T> | TCancellablePromiseCreateCallback<T>, token?: ICancelToken, strategy?: TCancelStrategy): ICancellablePromise<T>;
}


/**
 * A CancellablePromise is a Promise we may cancel at any time.
 * If the CancellablePromise is cancelled:
 *  - 'then', 'catch', and 'finally' won't be called and 'promise' will never resolve (depends on strategy)
 *  - 'cancelled' is called whatever its place in the promise chain (won't wait on provided promise to resolve)
 */
export interface ICancellablePromise<T> extends Promise<T> {
  readonly promise: Promise<T>; // a promised wrapped by the CancellablePromise's token. May never resolve if token is cancelled (depends on strategy).
  readonly token: ICancelToken; // the CancelToken associated with this CancellablePromise

  /**
   * Equivalent of the 'then' of a Promise:
   *  - provides the token in both callbacks
   *  - wraps 'onFulfilled' and 'onRejected' with the token (may never be called if token is cancelled)
   * @param onFulfilled
   * @param onRejected
   */
  then<TResult1 = T, TResult2 = never>(
    onFulfilled?: ((this: this, value: T, token: ICancelToken) => TPromiseOrValue<TResult1>) | undefined | null,
    onRejected?: ((this: this, reason: any, token: ICancelToken) => TPromiseOrValue<TResult2>) | undefined | null
  ): ICancellablePromise<TResult1 | TResult2>;

  /**
   * Equivalent of the 'catch' of a Promise:
   *  - same behaviour as previously mentioned (may never be called)
   * @param onRejected
   */
  catch<TResult = never>(
    onRejected?: ((this: this, reason: any, token: ICancelToken) => TPromiseOrValue<TResult>) | undefined | null
  ): ICancellablePromise<T | TResult>;

  /**
   * Equivalent of the 'catch' of a Promise:
   *   - same behaviour as previously mentioned (may never be called)
   * @param onFinally
   */
  finally(onFinally?: ((this: this, token: ICancelToken) => void) | undefined | null): ICancellablePromise<T>;


  /**
   * Kind of 'finally' but handles the cancelled state:
   *  - if/when the token is cancelled, every following 'cancelled' handlers (including this one) in the promise chain will be called immediately.
   *  - promise remains cancelled
   * @param onCancelled
   */
  cancelled(onCancelled: ((this: this, token: ICancelToken) => void) | undefined | null): ICancellablePromise<T>;

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

