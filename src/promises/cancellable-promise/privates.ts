import { TPromise } from '../type-helpers';
import { ICancellablePromise } from './interfaces';
import { IAdvancedAbortSignal } from '../../misc/advanced-abort-controller/advanced-abort-signal/interfaces';
import { TAbortStrategy, TInferAbortStrategyReturn } from '../../misc/advanced-abort-controller/advanced-abort-signal/types';

/** PRIVATES **/

export const CANCELLABLE_PROMISE_PRIVATE = Symbol('cancellable-promise-private');

export interface ICancellablePromisePrivate<T> {
  // promise: TPromise<T>;
  promise: TPromise<T | TInferAbortStrategyReturn<'never'>>;
  signal: IAdvancedAbortSignal;
  isCancellablePromiseWithSameSignal: boolean;
}

export interface ICancellablePromisePrivatesInternal<T> {
  [CANCELLABLE_PROMISE_PRIVATE]: ICancellablePromisePrivate<T>;
}

export interface ICancellablePromiseInternal<T> extends ICancellablePromisePrivatesInternal<T>, ICancellablePromise<T> {
}
