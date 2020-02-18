import { IAdvancedAbortSignal } from '../../misc/advanced-abort-controller/advanced-abort-signal/interfaces';
import { PromiseFulfilledObject, PromiseRejectedObject, TPromiseOrValue } from '../type-helpers';
import { ICancellablePromise } from './interfaces';
import { IAdvancedAbortController } from '../../misc/advanced-abort-controller/interfaces';

/** TYPES **/

export type TCancellablePromiseCreateCallback<T> = (
  this: ICancellablePromise<T>,
  resolve: (value?: TPromiseOrValue<T>) => void,
  reject: (reason?: any) => void,
  instance: ICancellablePromise<T>
) => void;

export type TCancellablePromisePromiseOrCallback<T> =
  PromiseLike<T>
  | TCancellablePromiseCreateCallback<T>;

export interface ICancellablePromiseOptions {
  signal?: IAdvancedAbortSignal;
}

export interface ICancellablePromiseNormalizedOptions {
  signal: IAdvancedAbortSignal;
}

export type TCancellablePromiseTryCallback<T> = (
  this: ICancellablePromise<T>,
  instance: ICancellablePromise<T>
) => TPromiseOrValue<T>;

export type TCancellablePromiseFactory<T> = (instance: ICancellablePromise<T>) => TPromiseOrValue<T>;

export interface ICancellablePromiseFinallyOptions {
  includeCancelled?: boolean; // (default: true)
}

export interface ICancellablePromiseNormalizedFinallyOptions {
  includeCancelled: boolean;
}

/*---*/

export type TCancellablePromiseOnFulfilled<T, TFulfilled> = (
  this: ICancellablePromise<T>,
  value: T,
  instance: ICancellablePromise<T>
) => TPromiseOrValue<TFulfilled>;

export type TCancellablePromiseOnFulfilledArgument<T, TFulfilled> =
  TCancellablePromiseOnFulfilled<T, TFulfilled>
  | undefined
  | null;


export type TCancellablePromiseOnRejected<T, TRejected> = (
  this: ICancellablePromise<T>,
  reason: any,
  instance: ICancellablePromise<T>
) => TPromiseOrValue<TRejected>;

export type TCancellablePromiseOnRejectedArgument<T, TRejected> =
  TCancellablePromiseOnRejected<T, TRejected>
  | undefined
  | null;


export type TCancellablePromiseOnCancelled<T, TCancelled> = (
  this: ICancellablePromise<T>,
  reason: any,
  newController: IAdvancedAbortController,
  instance: ICancellablePromise<T>
) => TPromiseOrValue<TCancelled>;

export type TCancellablePromiseOnCancelledArgument<T, TCancelled> =
  TCancellablePromiseOnCancelled<T, TCancelled>
  | undefined
  | null;


export type TCancellablePromiseOnFinally<T> = (
  this: ICancellablePromise<T>,
  state: OnFinallyResult<T>,
  instance: ICancellablePromise<T>
) => TPromiseOrValue<void>;

export type TCancellablePromiseOnFinallyArgument<T> =
  TCancellablePromiseOnFinally<T>
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

export type TCancellablePromiseThenReturnedValue<T, TFulfilled extends TCancellablePromiseOnFulfilledArgument<T, any>, TRejected extends TCancellablePromiseOnRejectedArgument<T, any>, TCancelled extends TCancellablePromiseOnCancelledArgument<T, any>> =
  TCancellablePromiseFulfilledReturnedValue<T, TFulfilled>
  | TCancellablePromiseRejectedReturnedValue<T, TRejected>
  | TCancellablePromiseCancelledReturnedValue<T, TCancelled>
  ;

export type TCancellablePromiseFulfilledReturnedValue<T, TFulfilled extends TCancellablePromiseOnFulfilledArgument<T, any>> =
  TFulfilled extends (value: T, instance: ICancellablePromise<T>) => TPromiseOrValue<infer TFulfilledValue>
    ? TFulfilledValue
    : T;

export type TCancellablePromiseRejectedReturnedValue<T, TRejected extends TCancellablePromiseOnRejectedArgument<T, any>> =
  TRejected extends (reason: any, instance: ICancellablePromise<T>) => TPromiseOrValue<infer TRejectedValue>
    ? TRejectedValue
    : never;

export type TCancellablePromiseCancelledReturnedValue<T, TCancelled extends TCancellablePromiseOnCancelledArgument<T, any>> =
  TCancelled extends (reason: any, newController: IAdvancedAbortController, instance: ICancellablePromise<T>) => TPromiseOrValue<infer TCancelledValue>
    ? TCancelledValue
    : never;

export type TCancellablePromiseThenReturn<T, TFulfilled extends TCancellablePromiseOnFulfilledArgument<T, any>, TRejected extends TCancellablePromiseOnRejectedArgument<T, any>, TCancelled extends TCancellablePromiseOnCancelledArgument<T, any>> =
  ICancellablePromise<TCancellablePromiseThenReturnedValue<T, TFulfilled, TRejected, TCancelled>/* | TAbortStrategyReturn<TStrategy>*/>;

export type TCancellablePromiseCatchReturn<T, TRejected extends TCancellablePromiseOnRejectedArgument<T, any>> =
  TCancellablePromiseThenReturn<T, undefined, TRejected, undefined>;

export type TCancellablePromiseCancelledReturn<T, TCancelled extends TCancellablePromiseOnCancelledArgument<T, any>> =
  TCancellablePromiseThenReturn<T, undefined, undefined, TCancelled>;
