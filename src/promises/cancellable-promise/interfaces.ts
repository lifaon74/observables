import { TPromise } from '../interfaces';
import { IAdvancedAbortSignal } from '../../misc/advanced-abort-controller/advanced-abort-signal/interfaces';
import { TAbortStrategy, TAbortStrategyReturn } from '../../misc/advanced-abort-controller/advanced-abort-signal/types';
import {
  ICancellablePromiseFinallyOptions, ICancellablePromiseOptions, TCancellablePromiseCancelledReturn,
  TCancellablePromiseCatchReturn, TCancellablePromiseOnCancelledArgument, TCancellablePromiseOnFinallyArgument,
  TCancellablePromiseOnFulfilledArgument, TCancellablePromiseOnRejectedArgument, TCancellablePromisePromiseOrCallback,
  TCancellablePromiseThenReturn
} from './types';


/** INTERFACES **/

export interface ICancellablePromiseConstructor {

  // // Equivalent of Promise.resolve
  // resolve(): ICancellablePromise<void, 'never'>;
  // resolve<TStrategy extends TAbortStrategy>(): ICancellablePromise<void, TStrategy>;
  // resolve<T>(value: TPromiseOrValue<T>, signal?: IAdvancedAbortSignal): ICancellablePromise<T, 'never'>;
  // resolve<T, TStrategy extends TAbortStrategy>(value: TPromiseOrValue<T>, signal: IAdvancedAbortSignal | undefined, strategy: TStrategy): ICancellablePromise<T, TStrategy>;
  //
  // // Equivalent of Promise.reject
  // reject(): ICancellablePromise<never, 'never'>;
  // reject(reason: any, signal?: IAdvancedAbortSignal): ICancellablePromise<never, 'never'>;
  // reject<TStrategy extends TAbortStrategy>(reason: any, signal: IAdvancedAbortSignal | undefined, strategy: TStrategy): ICancellablePromise<never, TStrategy>;
  //
  // /**
  //  * Creates a CancellablePromise from the result of 'callback':
  //  *  - kind of new Promise(_ => _(callback()))
  //  */
  // try<T, TStrategy extends TAbortStrategy>(callback: TCancellablePromiseTryCallback<T, TStrategy>, signal?: IAdvancedAbortSignal, strategy?: TStrategy): ICancellablePromise<T, TStrategy>;
  //
  // // Equivalent of Promise.race
  // race<TTuple extends TPromiseOrValue<any>[], TStrategy extends TAbortStrategy>(
  //   values: TTuple,
  //   signal?: IAdvancedAbortSignal,
  //   strategy?: TStrategy
  // ): ICancellablePromise<TPromiseOrValueTupleToValueUnion<TTuple>, TStrategy>;
  //
  // /**
  //  * Equivalent of Promise.race but gets the values though a callback instead.
  //  * Useful to race without providing a signal to the CancellablePromise
  //  */
  // raceCallback<TTuple extends TPromiseOrValue<any>[], TStrategy extends TAbortStrategy>(
  //   callback: (this: ICancellablePromise<TPromiseOrValueTupleToValueUnion<TTuple>, TStrategy>, signal: IAdvancedAbortSignal) => TTuple,
  //   signal?: IAdvancedAbortSignal,
  //   strategy?: TStrategy
  // ): ICancellablePromise<TPromiseOrValueTupleToValueUnion<TTuple>, TStrategy>;
  //
  // /**
  //  * Equivalent of Promise.race but get the values though a list of factories instead.
  //  * As soon one of the factories resolves, the signals provided for all the others are cancelled.
  //  * Useful to race and cancel unused promises.
  //  * @example: run 4 parallel delay promises, as soon as one resolves, cancel all the others
  //  *  CancellablePromise.raceCancellable(Array.from({ length: 4 }, (value: void, index: number) => {
  //  *    return (signal: IAdvancedAbortSignal) => {
  //  *      return $delay(index * 1000, signal)
  //  *        .cancelled((signal: IAdvancedAbortSignal) => {
  //  *          console.log(`index: ${ index } cancelled: ${ signal.reason.message }`);
  //  *        });
  //  *    };
  //  *  }));
  //  *  // 0 will resolve first and 1, 2, 3 will be cancelled
  //  *
  //  */
  // raceCancellable<TTuple extends TCancellablePromiseFactory<any>[], TStrategy extends TAbortStrategy>(
  //   factories: TTuple,
  //   signal?: IAdvancedAbortSignal,
  //   strategy?: TStrategy
  // ): ICancellablePromise<TPromiseOrValueFactoryTupleToValueUnion<TTuple>, TStrategy>;
  //
  // // Equivalent of Promise.all
  // all<TTuple extends TPromiseOrValue<any>[], TStrategy extends TAbortStrategy>(
  //   values: TTuple,
  //   signal?: IAdvancedAbortSignal,
  //   strategy?: TStrategy
  // ): ICancellablePromise<TPromiseOrValueTupleToValueTuple<TTuple>, TStrategy>;
  //
  // // Equivalent of Promise.all with the same behaviour of 'raceCallback'
  // allCallback<TTuple extends TPromiseOrValue<any>[], TStrategy extends TAbortStrategy>(
  //   callback: (this: ICancellablePromise<TPromiseOrValueTupleToValueTuple<TTuple>, TStrategy>, signal: IAdvancedAbortSignal) => TTuple,
  //   signal?: IAdvancedAbortSignal,
  //   strategy?: TStrategy
  // ): ICancellablePromise<TPromiseOrValueTupleToValueTuple<TTuple>, TStrategy>;
  //
  // /**
  //  * Runs 'concurrent' promises in parallel until iterator is done.
  //  * If one the promises fails, cancels the signal (meaning no more iterator.next()), and re-throws the error
  //  */
  // concurrent<T, TStrategy extends TAbortStrategy>(
  //   iterator: TCastableToIteratorStrict<TPromiseOrValue<T>>,
  //   concurrent?: number,
  //   global?: boolean,
  //   signal?: IAdvancedAbortSignal,
  //   strategy?: TStrategy
  // ): ICancellablePromise<void, TStrategy>;
  //
  // /**
  //  * Runs 'concurrent' promise factories in parallel until iterator is done
  //  * @example: fetches 100 resources with a maximum of 4 parallel fetch
  //  *  CancellablePromise.concurrentFactories(Array.from({ length: 100 }, (value: void, index: number) => {
  //  *    return (signal: IAdvancedAbortSignal) => {
  //  *      return CancellablePromise.fetch(`./resource/${ index }`, void 0, signal);
  //  *    };
  //  *  }), 4);
  //  */
  // concurrentFactories<T, TStrategy extends TAbortStrategy>(
  //   iterator: TCastableToIteratorStrict<TCancellablePromiseFactory<T>> ,
  //   concurrent?: number,
  //   global?: boolean,
  //   signal?: IAdvancedAbortSignal,
  //   strategy?: TStrategy
  // ): ICancellablePromise<void, TStrategy>;
  //
  //
  // /**
  //  * Equivalent of window.fetch:
  //  *  - aborts the fetch request if the signal is cancelled
  //  *  - returns a CancellablePromise instead of a Promise
  //  */
  // fetch<TStrategy extends TAbortStrategy>(
  //   requestInfo: RequestInfo,
  //   requestInit?: RequestInit,
  //   signal?: IAdvancedAbortSignal,
  //   strategy?: TStrategy
  // ): ICancellablePromise<Response, TStrategy>;
  //
  // /**
  //  * Just like `new CancellablePromise(...args)`,
  //  * but if 'promiseOrCallback' is a CancellablePromise with the same signal returns it (promiseOrCallback) instead of creating a new one
  //  */
  // of<T, TStrategy extends TAbortStrategy>(
  //   promiseOrCallback: TPromise<T> | TCancellablePromiseCreateCallback<T, TStrategy>,
  //   signal?: IAdvancedAbortSignal,
  //   strategy?: TStrategy
  // ): ICancellablePromise<T, TStrategy>;
  //

  /**
   * Creates a new CancellablePromise from an exiting promise or the same function you may provide to a Promise.
   */
  new<T, TStrategy extends TAbortStrategy>(promiseOrCallback: TCancellablePromisePromiseOrCallback<T, TStrategy>, options?: ICancellablePromiseOptions<TStrategy>): ICancellablePromise<T, TStrategy>;
}


/**
 * A CancellablePromise is a Promise we may cancel at any time.
 * If the CancellablePromise is cancelled:
 *  - 'then', 'catch', and 'finally' won't be called and 'promise' will never resolve (depends on strategy)
 *  - 'cancelled' is called whatever its place in the promise chain (won't wait on provided promise to resolve)
 */
export interface ICancellablePromise<T, TStrategy extends TAbortStrategy = 'never'> extends TPromise<T> {
  readonly promise: Promise<T | TAbortStrategyReturn<TStrategy>>; // a promised wrapped by the CancellablePromise's signal. May never resolve if signal is cancelled (depends on strategy).
  readonly signal: IAdvancedAbortSignal; // the AdvancedAbortSignal associated with this CancellablePromise
  readonly strategy: TStrategy;

  /**
   * Equivalent of the 'then' of a Promise:
   *  - provides the signal in all callbacks
   *  - wraps 'onFulfilled' and 'onRejected' with the signal (may never be called if signal is cancelled)
   *  - handles 'onCancelled'
   */
  then(): TCancellablePromiseThenReturn<T, TStrategy, undefined, undefined, undefined>;

  then<TFulfilled extends TCancellablePromiseOnFulfilledArgument<T, TStrategy, any>>(
    onFulfilled: TFulfilled,
  ): TCancellablePromiseThenReturn<T, TStrategy, TFulfilled, undefined, undefined>;

  then<TFulfilled extends TCancellablePromiseOnFulfilledArgument<T, TStrategy, any>, TRejected extends TCancellablePromiseOnRejectedArgument<T, TStrategy, any>>(
    onFulfilled: TFulfilled,
    onRejected: TRejected,
  ): TCancellablePromiseThenReturn<T, TStrategy, TFulfilled, TRejected, undefined>;

  then<TFulfilled extends TCancellablePromiseOnFulfilledArgument<T, TStrategy, any>, TRejected extends TCancellablePromiseOnRejectedArgument<T, TStrategy, any>, TCancelled extends TCancellablePromiseOnCancelledArgument<T, TStrategy, any>>(
    onFulfilled: TFulfilled,
    onRejected: TRejected,
    onCancelled: TCancelled,
  ): TCancellablePromiseThenReturn<T, TStrategy, TFulfilled, TRejected, TCancelled>;

  /**
   * Equivalent of the 'catch' of a Promise:
   *  - same behaviour as previously mentioned (may never be called)
   */
  catch(): TCancellablePromiseCatchReturn<T, TStrategy, undefined>;

  catch<TRejected extends TCancellablePromiseOnRejectedArgument<T, TStrategy, any>>(onRejected: TRejected): TCancellablePromiseCatchReturn<T, TStrategy, TRejected>;

  /**
   * Kind of 'catch' but handles the cancelled state:
   *  - if the signal is cancelled before this promise resolves, 'onCancelled' is called
   *  - returned value is transmit to the chain
   */
  cancelled(): TCancellablePromiseCancelledReturn<T, TStrategy, undefined>;

  cancelled<TCancelled extends TCancellablePromiseOnCancelledArgument<T, TStrategy, any>>(onCancelled: TCancelled): TCancellablePromiseCancelledReturn<T, TStrategy, TCancelled>;

  /**
   * Equivalent of the 'finally' of a Promise:
   *   - same behaviour as previously mentioned (may never be called)
   */
  finally(onFinally?: TCancellablePromiseOnFinallyArgument<T, TStrategy>, options?: ICancellablePromiseFinallyOptions): ICancellablePromise<T, TStrategy>;

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

