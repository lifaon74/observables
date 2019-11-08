import { TPromise } from '../interfaces';
import { ICancellablePromise } from './interfaces';
import { IAdvancedAbortSignal } from '../../misc/advanced-abort-controller/advanced-abort-signal/interfaces';
import { TAbortStrategy, TAbortStrategyReturn } from '../../misc/advanced-abort-controller/advanced-abort-signal/types';

/** PRIVATES **/

export const CANCELLABLE_PROMISE_PRIVATE = Symbol('cancellable-promise-private');

export interface ICancellablePromisePrivate<T, TStrategy extends TAbortStrategy> {
  promise: TPromise<T | TAbortStrategyReturn<TStrategy>>;
  signal: IAdvancedAbortSignal;
  strategy: TStrategy;
  isCancellablePromiseWithSameSignal: boolean;
}

export interface ICancellablePromisePrivatesInternal<T, TStrategy extends TAbortStrategy> {
  [CANCELLABLE_PROMISE_PRIVATE]: ICancellablePromisePrivate<T, TStrategy>;
}

export interface ICancellablePromiseInternal<T, TStrategy extends TAbortStrategy> extends ICancellablePromisePrivatesInternal<T, TStrategy>, ICancellablePromise<T, TStrategy> {
}
