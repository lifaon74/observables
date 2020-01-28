import { TAbortStrategy, TAbortStrategyReturn } from '../../misc/advanced-abort-controller/advanced-abort-signal/types';
import { IAdvancedAbortSignal } from '../../misc/advanced-abort-controller/advanced-abort-signal/interfaces';
import { PromiseFulfilledObject, PromiseRejectedObject, TPromiseOrValue } from '../interfaces';
import { ICancellablePromise } from './interfaces';
import { IAdvancedAbortController } from '../../misc/advanced-abort-controller/interfaces';

/** TYPES **/

export type TCancellablePromiseCreateCallback<T, TStrategy extends TAbortStrategy> = (
  this: ICancellablePromise<T, TStrategy>,
  resolve: (value?: TPromiseOrValue<T>) => void,
  reject: (reason?: any) => void,
  signal: IAdvancedAbortSignal
) => void;


export interface ICancellablePromiseOptions<T, TStrategy extends TAbortStrategy> {
  strategy?: TStrategy;
  signal?: IAdvancedAbortSignal;
}

export interface ICancellablePromiseOptionsWithStrategy<T, TStrategy extends TAbortStrategy> {
  strategy: TStrategy;
  signal?: IAdvancedAbortSignal;
}

export interface ICancellablePromiseNormalizedOptions<T, TStrategy extends TAbortStrategy> {
  strategy: TStrategy;
  signal: IAdvancedAbortSignal;
}

export type TCancellablePromiseTryCallback<T, TStrategy extends TAbortStrategy> = (
  this: ICancellablePromise<T, TStrategy>,
  signal: IAdvancedAbortSignal
) => TPromiseOrValue<T>;

export type TCancellablePromiseFactory<T> = (signal: IAdvancedAbortSignal) => TPromiseOrValue<T>;

export interface ICancellablePromiseFinallyOptions {
  includeCancelled?: boolean; // (default: true)
}

export interface ICancellablePromiseNormalizedFinallyOptions {
  includeCancelled: boolean;
}

/*---*/

export type TCancellablePromiseOnFulfilled<T, TStrategy extends TAbortStrategy, TFulfilled> = (
  this: ICancellablePromise<T, TStrategy>,
  value: T,
  signal: IAdvancedAbortSignal
) => TPromiseOrValue<TFulfilled>;

export type TCancellablePromiseOnFulfilledArgument<T, TStrategy extends TAbortStrategy, TFulfilled> =
  TCancellablePromiseOnFulfilled<T, TStrategy, TFulfilled>
  | undefined
  | null;


export type TCancellablePromiseOnRejected<T, TStrategy extends TAbortStrategy, TRejected> = (
  this: ICancellablePromise<T, TStrategy>,
  reason: any,
  signal: IAdvancedAbortSignal
) => TPromiseOrValue<TRejected>;

export type TCancellablePromiseOnRejectedArgument<T, TStrategy extends TAbortStrategy, TRejected> =
  TCancellablePromiseOnRejected<T, TStrategy, TRejected>
  | undefined
  | null;


export type TCancellablePromiseOnCancelled<T, TStrategy extends TAbortStrategy, TCancelled> = (
  this: ICancellablePromise<T, TStrategy>,
  reason: any,
  newController: IAdvancedAbortController,
  signal: IAdvancedAbortSignal
) => TPromiseOrValue<TCancelled>;

export type TCancellablePromiseOnCancelledArgument<T, TStrategy extends TAbortStrategy, TCancelled> =
  TCancellablePromiseOnCancelled<T, TStrategy, TCancelled>
  | undefined
  | null;


export type TCancellablePromiseOnFinally<T, TStrategy extends TAbortStrategy> = (
  this: ICancellablePromise<T, TStrategy>,
  state: OnFinallyResult<T>,
  signal: IAdvancedAbortSignal
) => TPromiseOrValue<void>;

export type TCancellablePromiseOnFinallyArgument<T, TStrategy extends TAbortStrategy> =
  TCancellablePromiseOnFinally<T, TStrategy>
  | undefined
  | null;


export type TCancellablePromiseEndStatus =
  'fulfilled' // promise is fulfilled
  | 'rejected' // promise is rejected
  | 'cancelled' // promise is cancelled
  ;

export interface PromiseCancelledObject {
  status: 'cancelled';
  reason: any;
}

export type OnFinallyResult<T> = PromiseFulfilledObject<T> | PromiseRejectedObject | PromiseCancelledObject;

export type TCancellablePromiseThenReturnedValue<T, TStrategy extends TAbortStrategy, TFulfilled extends TCancellablePromiseOnFulfilledArgument<T, TStrategy, any>, TRejected extends TCancellablePromiseOnRejectedArgument<T, TStrategy, any>, TCancelled extends TCancellablePromiseOnCancelledArgument<T, TStrategy, any>> =
  TCancellablePromiseFulfilledReturnedValue<T, TStrategy, TFulfilled>
  | TCancellablePromiseRejectedReturnedValue<T, TStrategy, TRejected>
  | TCancellablePromiseCancelledReturnedValue<T, TStrategy, TCancelled>
  ;

export type TCancellablePromiseFulfilledReturnedValue<T, TStrategy extends TAbortStrategy, TFulfilled extends TCancellablePromiseOnFulfilledArgument<T, TStrategy, any>> =
  TFulfilled extends (value: T, signal: IAdvancedAbortSignal) => TPromiseOrValue<infer TFulfilledValue>
    ? TFulfilledValue
    : T;

export type TCancellablePromiseRejectedReturnedValue<T, TStrategy extends TAbortStrategy, TRejected extends TCancellablePromiseOnRejectedArgument<T, TStrategy, any>> =
  TRejected extends (reason: any, signal: IAdvancedAbortSignal) => TPromiseOrValue<infer TRejectedValue>
    ? TRejectedValue
    : never;

export type TCancellablePromiseCancelledReturnedValue<T, TStrategy extends TAbortStrategy, TCancelled extends TCancellablePromiseOnCancelledArgument<T, TStrategy, any>> =
  TCancelled extends (reason: any, newController: IAdvancedAbortController, signal: IAdvancedAbortSignal) => TPromiseOrValue<infer TCancelledValue>
    ? TCancelledValue
    : never;

export type TCancellablePromiseThenReturn<T, TStrategy extends TAbortStrategy, TFulfilled extends TCancellablePromiseOnFulfilledArgument<T, TStrategy, any>, TRejected extends TCancellablePromiseOnRejectedArgument<T, TStrategy, any>, TCancelled extends TCancellablePromiseOnCancelledArgument<T, TStrategy, any>> =
  ICancellablePromise<TCancellablePromiseThenReturnedValue<T, TStrategy, TFulfilled, TRejected, TCancelled>/* | TAbortStrategyReturn<TStrategy>*/, TStrategy>;

export type TCancellablePromiseCatchReturn<T, TStrategy extends TAbortStrategy, TRejected extends TCancellablePromiseOnRejectedArgument<T, TStrategy, any>> =
  TCancellablePromiseThenReturn<T, TStrategy, undefined, TRejected, undefined>;

export type TCancellablePromiseCancelledReturn<T, TStrategy extends TAbortStrategy, TCancelled extends TCancellablePromiseOnCancelledArgument<T, TStrategy, any>> =
  TCancellablePromiseThenReturn<T, TStrategy, undefined, undefined, TCancelled>;
