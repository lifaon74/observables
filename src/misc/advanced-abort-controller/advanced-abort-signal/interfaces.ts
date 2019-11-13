import {
  INotificationsObservable, INotificationsObservableConstructor
} from '../../../notifications/core/notifications-observable/interfaces';
import {
  IAdvancedAbortSignalWrapPromiseOptions, TAbortStrategy, TAbortStrategyReturnedPromise,
  TAdvancedAbortSignalWrapPromiseCallback
} from './types';
import { TPromiseType } from '../../../promises/interfaces';


/** TYPES **/

export interface IAdvancedAbortSignalKeyValueMap {
  abort: any;
}

/** INSTANCE **/


/* PRIVATE */
export interface IAdvancedAbortSignalConstructor extends Omit<INotificationsObservableConstructor, 'new'> {
  new(): IAdvancedAbortSignal;
}

export interface IAdvancedAbortSignal extends INotificationsObservable<IAdvancedAbortSignalKeyValueMap> {
  readonly aborted: boolean;
  readonly reason: any;

  /**
   * Wraps a promise with a this AdvancedAbortSignal:
   *  Returns a Promise:
   *    - if/when the signal is aborted, apply the abort strategy (ex: the returned Promise will never resolve by default)
   *    - else the returned Promise is resolved with the received value from 'promise'
   *
   *  INFO: the abort state doesnt wait on the resolved state of the promise, meaning the returned Promise may resolve even if 'promise' didn't resolve
   *
   * @Example:
   *  controller.signal.wrapPromise(new Promise(resolve => setTimeout(resolve, 100)))
   *    .then(() => {
   *      console.log('never called');
   *    });
   *  controller.abort();
   *
   */
  wrapPromise<T>(
    promiseOrCallback: Promise<T> | TAdvancedAbortSignalWrapPromiseCallback<T>,
    options?: IAdvancedAbortSignalWrapPromiseOptions<'never', never>,
  ): TAbortStrategyReturnedPromise<T, 'never', never>;

  wrapPromise<T, TStrategy extends TAbortStrategy, TAborted>(
    promiseOrCallback: Promise<T> | TAdvancedAbortSignalWrapPromiseCallback<T>,
    options?: IAdvancedAbortSignalWrapPromiseOptions<TStrategy, TAborted>,
  ): TAbortStrategyReturnedPromise<T, TStrategy, TAborted>;

  /**
   * Wraps a function with this AdvancedAbortSignal:
   *  Returns a function similar to 'callback':
   *    - has the same parameters than 'callback'
   *    - if/when the signal is aborted, apply the abort strategy (ex: the Promise will never resolve by default)
   *    - else, returns a Promise resolved with the callback's return
   *
   *  INFO: the aborted state doesnt wait on the resolved state of the promise/value returned by 'callback', meaning this function's returned Promise may resolve even if the callback's promise/value didn't resolve
   *  INFO: if signal is already aborted when calling the returned function, 'callback' is never called
   *
   *  @Example:
   *   fetch('abc')
   *    .then(signal.wrapFunction(() => {
   *      console.log('never called');
   *    })
   *    .then(() => {
   *      console.log('never called');
   *    });
   *   controller.abort();
   *
   *  @Example:
   *   fetch('abc')
   *    .then(signal.wrapFunction((response) => {
   *      controller.abort();
   *      return response.json()
   *    }));
   *    .then(() => {
   *      console.log('never called');
   *    });
   */
  wrapFunction<CB extends (...args: any[]) => any>(
    callback: CB,
    options?: IAdvancedAbortSignalWrapPromiseOptions<'never', never>,
  ): (...args: Parameters<CB>) => TAbortStrategyReturnedPromise<TPromiseType<ReturnType<CB>>, 'never', never>;

  wrapFunction<CB extends (...args: any[]) => any, TStrategy extends TAbortStrategy, TAborted>(
    callback: CB,
    options?: IAdvancedAbortSignalWrapPromiseOptions<TStrategy, TAborted>,
  ): (...args: Parameters<CB>) => TAbortStrategyReturnedPromise<TPromiseType<ReturnType<CB>>, TStrategy, TAborted>;

  /**
   * Wraps the fetch arguments with this AdvancedAbortSignal:
   *  - if the signal is aborted, the fetch will be aborted
   *
   *  INFO: an aborted fetch will throw an error, you may catch it by wrapping it with 'wrapPromise'
   *
   * @Example:
   *  fetch(...signal.wrapFetchArguments('http://domain.com'));
   */
  wrapFetchArguments(requestInfo: RequestInfo, requestInit?: RequestInit): [RequestInfo, RequestInit | undefined];


  /**
   * Calls 'callback' as soon as this AdvancedAbortSignal is aborted.
   *  - callback is executed only on the next event loop (setImmediate like)
   *  - returns an undo function to cancel the listener
   *  - the undo function is called automatically when 'callback' is executed => you dont need to call it inside
   */
  whenAborted(callback: (this: IAdvancedAbortSignal, reason: any) => void): () => void;

  /**
   * Converts this AdvancedAbortSignal into an AbortController
   *  - if this signal is aborted, then aborts the AbortController
   */
  toAbortController(): AbortController;
}
