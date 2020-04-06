import { ICancellablePromise } from './interfaces';
import { IAdvancedAbortSignal } from '../../misc/advanced-abort-controller/advanced-abort-signal/interfaces';
import {
  IAdvancedAbortSignalWrapPromiseOptions, TInferAbortStrategyReturn
} from '../../misc/advanced-abort-controller/advanced-abort-signal/types';

/** PRIVATES **/

export const CANCELLABLE_PROMISE_PRIVATE = Symbol('cancellable-promise-private');

export type TCancellablePromisePrivatePromiseType<T> = T | TInferAbortStrategyReturn<'never'>; // or T
export type TCancellablePromisePrivatePromise<T> = PromiseLike<TCancellablePromisePrivatePromiseType<T>>; // or  Promise<T>

export interface ICancellablePromisePrivate<T> {
  promise: TCancellablePromisePrivatePromise<T>;
  signal: IAdvancedAbortSignal;
  isCancellablePromiseWithSameSignal: boolean;
}

export interface ICancellablePromisePrivatesInternal<T> {
  [CANCELLABLE_PROMISE_PRIVATE]: ICancellablePromisePrivate<T>;
}

export interface ICancellablePromiseInternal<T> extends ICancellablePromisePrivatesInternal<T>, ICancellablePromise<T> {
}

export const CANCELLABLE_PROMISE_DEFAULT_ABORT_SIGNAL_WRAP_OPTIONS: IAdvancedAbortSignalWrapPromiseOptions<'never', never> = Object.freeze({
  strategy: 'never'
});
