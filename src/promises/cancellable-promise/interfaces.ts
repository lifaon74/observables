import {
  ICancelToken, TCancelStrategy, TCancelStrategyReturn, TCatchCancelled
} from '../../misc/cancel-token/interfaces';
import {
  TPromiseOrValue, TPromiseOrValueFactoryTupleToValueUnion, TPromiseOrValueTupleToValueTuple,
  TPromiseOrValueTupleToValueUnion, TPromiseStatus
} from '../interfaces';
import { TCastableToIteratorStrict } from '../../helpers';


export type TCancellablePromiseFactory<T> = (token: ICancelToken) => TPromiseOrValue<T>;

export type TCancellablePromiseCreateCallback<T, TStrategy extends TCancelStrategy> = (this: ICancellablePromise<T, TStrategy>, resolve: (value?: TPromiseOrValue<T>) => void, reject: (reason?: any) => void, token: ICancelToken) => void;

export type TCancellablePromiseOnFulfilled<T, TStrategy extends TCancelStrategy, TRejected> = (this: ICancellablePromise<T, TStrategy>, value: T, token: ICancelToken) => TPromiseOrValue<TRejected>;
export type TCancellablePromiseOnRejected<T, TStrategy extends TCancelStrategy, TRejected> = (this: ICancellablePromise<T, TStrategy>, reason: any, token: ICancelToken) => TPromiseOrValue<TRejected>;
export type TCancellablePromiseOnFinally<T, TStrategy extends TCancelStrategy> = (this: ICancellablePromise<T, TStrategy>, status: TCancellablePromiseEndStatus, token: ICancelToken) => TPromiseOrValue<void>;
export type TCancellablePromiseOnCancelled<T, TStrategy extends TCancelStrategy, TCancelled> = (this: ICancellablePromise<T, TStrategy>, reason: any, rethrowCancelled: () => Promise<TCancelStrategyReturn<TStrategy>>, token: ICancelToken) => TPromiseOrValue<TCancelled>;

export type TCancellablePromiseEndStatus =
  'fulfilled' // promise is fulfilled
  | 'rejected' // promise is rejected
  | 'cancelled' // promise is cancelled
;


/** INTERFACES **/

export interface ICancellablePromiseConstructor {

  // Equivalent of Promise.resolve
  resolve<TStrategy extends TCancelStrategy>(): ICancellablePromise<void, TStrategy>;
  resolve<T, TStrategy extends TCancelStrategy>(value: TPromiseOrValue<T>, token?: ICancelToken, strategy?: TStrategy): ICancellablePromise<T, TStrategy>;

  // Equivalent of Promise.reject
  reject<TStrategy extends TCancelStrategy>(reason?: any, token?: ICancelToken, strategy?: TStrategy): ICancellablePromise<never, TStrategy>;

  /**
   * Creates a CancellablePromise from the result of 'callback':
   *  - kind of new Promise(_ => _(callback()))
   * @param callback
   * @param token
   * @param strategy
   */
  try<T, TStrategy extends TCancelStrategy>(
    callback: (this: ICancellablePromise<T, TStrategy>, token: ICancelToken) => TPromiseOrValue<T>,
    token?: ICancelToken,
    strategy?: TStrategy
  ): ICancellablePromise<T, TStrategy>;

  // Equivalent of Promise.race
  race<TTuple extends TPromiseOrValue<any>[], TStrategy extends TCancelStrategy>(
    values: TTuple,
    token?: ICancelToken,
    strategy?: TStrategy
  ): ICancellablePromise<TPromiseOrValueTupleToValueUnion<TTuple>, TStrategy>;

  /**
   * Equivalent of Promise.race but gets the values though a callback instead.
   * Useful to race without providing a token to the CancellablePromise
   * @param callback
   * @param token
   * @param strategy
   */
  raceCallback<TTuple extends TPromiseOrValue<any>[], TStrategy extends TCancelStrategy>(
    callback: (this: ICancellablePromise<TPromiseOrValueTupleToValueUnion<TTuple>, TStrategy>, token: ICancelToken) => TTuple,
    token?: ICancelToken,
    strategy?: TStrategy
  ): ICancellablePromise<TPromiseOrValueTupleToValueUnion<TTuple>, TStrategy>;

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
  raceCancellable<TTuple extends TCancellablePromiseFactory<any>[], TStrategy extends TCancelStrategy>(
    factories: TTuple,
    token?: ICancelToken,
    strategy?: TStrategy
  ): ICancellablePromise<TPromiseOrValueFactoryTupleToValueUnion<TTuple>, TStrategy>;

  // Equivalent of Promise.all
  all<TTuple extends TPromiseOrValue<any>[], TStrategy extends TCancelStrategy>(
    values: TTuple,
    token?: ICancelToken,
    strategy?: TStrategy
  ): ICancellablePromise<TPromiseOrValueTupleToValueTuple<TTuple>, TStrategy>;

  // Equivalent of Promise.all with the same behaviour of 'raceCallback'
  allCallback<TTuple extends TPromiseOrValue<any>[], TStrategy extends TCancelStrategy>(
    callback: (this: ICancellablePromise<TPromiseOrValueTupleToValueTuple<TTuple>, TStrategy>, token: ICancelToken) => TTuple,
    token?: ICancelToken,
    strategy?: TStrategy
  ): ICancellablePromise<TPromiseOrValueTupleToValueTuple<TTuple>, TStrategy>;

  /**
   * Runs 'concurrent' promises in parallel until iterator is done.
   * If one the promises fails, cancels the token (meaning no more iterator.next()), and re-throws the error
   * @param iterator
   * @param concurrent
   // * @param global
   * @param token
   * @param strategy
   */
  concurrent<T, TStrategy extends TCancelStrategy>(
    iterator: TCastableToIteratorStrict<TPromiseOrValue<T>>,
    concurrent?: number,
    // global?: boolean,
    token?: ICancelToken,
    strategy?: TStrategy
  ): ICancellablePromise<void, TStrategy>;

  /**
   * Runs 'concurrent' promise factories in parallel until iterator is done
   * @param iterator
   * @param concurrent
   * @param global
   * @param token
   * @param strategy
   * @example: fetches 100 resources with a maximum of 4 parallel fetch
   *  CancellablePromise.concurrentFactories(Array.from({ length: 100 }, (value: void, index: number) => {
   *    return (token: ICancelToken) => {
   *      return CancellablePromise.fetch(`./resource/${ index }`, void 0, token);
   *    };
   *  }), 4);
   */
  concurrentFactories<T, TStrategy extends TCancelStrategy>(
    iterator: TCastableToIteratorStrict<TCancellablePromiseFactory<T>> ,
    concurrent?: number,
    global?: boolean,
    token?: ICancelToken,
    strategy?: TStrategy
  ): ICancellablePromise<void, TStrategy>;


  /**
   * Equivalent of window.fetch:
   *  - aborts the fetch request if the token is cancelled
   *  - returns a CancellablePromise instead of a Promise
   * @param requestInfo
   * @param requestInit
   * @param token
   * @param strategy
   */
  fetch<TStrategy extends TCancelStrategy>(
    requestInfo: RequestInfo,
    requestInit?: RequestInit,
    token?: ICancelToken,
    strategy?: TStrategy
  ): ICancellablePromise<Response, TStrategy>;

  /**
   * Just like `new CancellablePromise(...args)`,
   * but if 'promiseOrCallback' is a CancellablePromise with the same token returns it (promiseOrCallback) instead of creating a new one
   * @param promiseOrCallback
   * @param token
   * @param strategy
   */
  of<T, TStrategy extends TCancelStrategy>(
    promiseOrCallback: Promise<T> | TCancellablePromiseCreateCallback<T, TStrategy>,
    token?: ICancelToken,
    strategy?: TStrategy
  ): ICancellablePromise<T, TStrategy>;


  /**
   * Creates a new CancellablePromise from an exiting promise or the same function you may provide to a Promise.
   * @param promiseOrCallback
   * @param token
   * @param strategy
   */
  new<T, TStrategy extends TCancelStrategy>(promiseOrCallback: Promise<T> | TCancellablePromiseCreateCallback<T, TStrategy>, token?: ICancelToken, strategy?: TStrategy): ICancellablePromise<T, TStrategy>;
}


/**
 * A CancellablePromise is a Promise we may cancel at any time.
 * If the CancellablePromise is cancelled:
 *  - 'then', 'catch', and 'finally' won't be called and 'promise' will never resolve (depends on strategy)
 *  - 'cancelled' is called whatever its place in the promise chain (won't wait on provided promise to resolve)
 */
export interface ICancellablePromise<T, TStrategy extends TCancelStrategy> extends Promise<T> {
  readonly promise: Promise<T>; // a promised wrapped by the CancellablePromise's token. May never resolve if token is cancelled (depends on strategy).
  readonly token: ICancelToken; // the CancelToken associated with this CancellablePromise

  /**
   * Equivalent of the 'then' of a Promise:
   *  - provides the token in both callbacks
   *  - wraps 'onFulfilled' and 'onRejected' with the token (may never be called if token is cancelled)
   * @param onFulfilled
   * @param onRejected
   * @param onCancelled
   */
  then<TFulfilled = T, TRejected = never, TCancelled = never>(
    onFulfilled?: TCancellablePromiseOnFulfilled<T, TStrategy, TFulfilled> | undefined | null,
    onRejected?: TCancellablePromiseOnRejected<T, TStrategy, TRejected> | undefined | null,
    onCancelled?: TCancellablePromiseOnCancelled<T, TStrategy, TCancelled>  | undefined | null,
  ): ICancellablePromise<TFulfilled | TRejected | TCancelled, TStrategy>;

  /**
   * Equivalent of the 'catch' of a Promise:
   *  - same behaviour as previously mentioned (may never be called)
   * @param onRejected
   */
  catch<TRejected = never>(
    onRejected?: TCancellablePromiseOnRejected<T, TStrategy, TRejected> | undefined | null
  ): ICancellablePromise<T | TRejected, TStrategy>;

  /**
   * Kind of 'catch' but handles the cancelled state:
   *  - if the token is cancelled before this promise resolves, 'onCancelled' is called
   *  - returned value is transmit to the chain
   * @param onCancelled
   */
  cancelled<TCancelled>(onCancelled: TCancellablePromiseOnCancelled<T, TStrategy, TCancelled> | undefined | null): ICancellablePromise<T | TCancelled, TStrategy>;
  
  /**
   * Equivalent of the 'finally' of a Promise:
   *   - same behaviour as previously mentioned (may never be called)
   * @param onFinally
   * @param includeCancelled
   */
  finally(onFinally?: TCancellablePromiseOnFinally<T, TStrategy> | undefined | null, includeCancelled?: boolean): ICancellablePromise<T, TStrategy>;


 

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

