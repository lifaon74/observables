import { IAdvancedAbortSignal } from '../../misc/advanced-abort-controller/advanced-abort-signal/interfaces';
import { ICancellablePromise } from './interfaces';
import { IAdvancedAbortController } from '../../misc/advanced-abort-controller/interfaces';
import {
  INativePromiseFulfilledObject, INativePromiseRejectedObject, TInferNativePromiseLikeOrValue,
  TInferNativePromiseOrValueFactoryTupleToUnionOfValues, TInferNativePromiseLikeOrValueFactoryTupleToValueTuple,
  TNativePromiseLikeOrValue, TNativePromiseLikeOrValueFactory
} from '../types/native';
import {
  IAdvancedAbortSignalWrapPromiseOptions, TAbortStrategy, TInferAbortStrategyReturn
} from '../../misc/advanced-abort-controller/advanced-abort-signal/types';

/** TYPES **/

export type TCancellablePromiseCreateCallback<T> = (
  this: ICancellablePromise<T>,
  resolve: (value?: TNativePromiseLikeOrValue<T>) => void,
  reject: (reason?: any) => void,
  signal: IAdvancedAbortSignal,
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
  signal: IAdvancedAbortSignal,
) => TNativePromiseLikeOrValue<T>;

export type TCancellablePromiseFactory<T> = (signal: IAdvancedAbortSignal) => TNativePromiseLikeOrValue<T>;

export interface ICancellablePromiseFinallyOptions {
  includeCancelled?: boolean; // (default: true)
}

export interface ICancellablePromiseNormalizedFinallyOptions {
  includeCancelled: boolean;
}

export interface ICancellablePromiseToPromiseOptions<TStrategy extends TAbortStrategy> extends Pick<IAdvancedAbortSignalWrapPromiseOptions<TStrategy, never>, 'strategy'> {
  strategy?: TStrategy;
}

export type TInferCancellablePromiseToPromiseReturn<T, TStrategy extends TAbortStrategy> = Promise<T | TInferAbortStrategyReturn<TStrategy>>;

export type TInferCancellablePromiseStaticRaceReturn<TTuple extends TCancellablePromiseFactory<any>[]> = ICancellablePromise<TInferNativePromiseOrValueFactoryTupleToUnionOfValues<TTuple>>
export type TInferCancellablePromiseStaticAllReturn<TTuple extends TCancellablePromiseFactory<any>[]> = ICancellablePromise<TInferNativePromiseLikeOrValueFactoryTupleToValueTuple<TTuple>>

/*---*/

export type TCancellablePromiseOnFulfilled<T, TFulfilled> = (
  this: ICancellablePromise<T>,
  value: T,
  signal: IAdvancedAbortSignal,
) => TNativePromiseLikeOrValue<TFulfilled>;

export type TCancellablePromiseOnFulfilledArgument<T, TFulfilled> =
  TCancellablePromiseOnFulfilled<T, TFulfilled>
  | undefined
  | null;


export type TCancellablePromiseOnRejected<T, TRejected> = (
  this: ICancellablePromise<T>,
  reason: any,
  signal: IAdvancedAbortSignal,
) => TNativePromiseLikeOrValue<TRejected>;

export type TCancellablePromiseOnRejectedArgument<T, TRejected> =
  TCancellablePromiseOnRejected<T, TRejected>
  | undefined
  | null;


export type TCancellablePromiseOnCancelled<T, TCancelled> = (
  this: ICancellablePromise<T>,
  reason: any,
  newController: IAdvancedAbortController,
  signal: IAdvancedAbortSignal,
) => TNativePromiseLikeOrValue<TCancelled>;

export type TCancellablePromiseOnCancelledArgument<T, TCancelled> =
  TCancellablePromiseOnCancelled<T, TCancelled>
  | undefined
  | null;


export type TCancellablePromiseOnFinally<T> = (
  this: ICancellablePromise<T>,
  state: TOnFinallyResult<T>,
  signal: IAdvancedAbortSignal,
) => TNativePromiseLikeOrValue<void>;

export type TCancellablePromiseOnFinallyArgument<T> =
  TCancellablePromiseOnFinally<T>
  | undefined
  | null;


export type TCancellablePromiseEndStatus =
  'fulfilled' // promise is fulfilled
  | 'rejected' // promise is rejected
  | 'cancelled' // promise is cancelled
  ;

export interface IPromiseCancelledObject {
  status: 'cancelled';
  reason: any;
}

export type TOnFinallyResult<T> =
  INativePromiseFulfilledObject<T>
  | INativePromiseRejectedObject
  | IPromiseCancelledObject;

/*---*/

export type TCancellablePromiseThenReturnedValue<T,
  TFulfilled extends TCancellablePromiseOnFulfilledArgument<T, any>,
  TRejected extends TCancellablePromiseOnRejectedArgument<T, any>,
  TCancelled extends TCancellablePromiseOnCancelledArgument<T, any>> =
  TCancellablePromiseFulfilledReturnedValue<T, TFulfilled>
  | TCancellablePromiseRejectedReturnedValue<T, TRejected>
  | TCancellablePromiseCancelledReturnedValue<T, TCancelled>
  ;

export type TCancellablePromiseFulfilledReturnedValue<T, TFulfilled extends TCancellablePromiseOnFulfilledArgument<T, any>> =
  TFulfilled extends (...args: any[]) => TNativePromiseLikeOrValue<infer TFulfilledValue>
    ? TFulfilledValue
    : T;

export type TCancellablePromiseRejectedReturnedValue<T, TRejected extends TCancellablePromiseOnRejectedArgument<T, any>> =
  TRejected extends (...args: any[]) => TNativePromiseLikeOrValue<infer TRejectedValue>
    ? TRejectedValue
    : never;

export type TCancellablePromiseCancelledReturnedValue<T, TCancelled extends TCancellablePromiseOnCancelledArgument<T, any>> =
  TCancelled extends (...args: any[]) => TNativePromiseLikeOrValue<infer TCancelledValue>
    ? TCancelledValue
    : never;

export type TCancellablePromiseThenReturn<T, TFulfilled extends TCancellablePromiseOnFulfilledArgument<T, any>, TRejected extends TCancellablePromiseOnRejectedArgument<T, any>, TCancelled extends TCancellablePromiseOnCancelledArgument<T, any>> =
  ICancellablePromise<TCancellablePromiseThenReturnedValue<T, TFulfilled, TRejected, TCancelled>/* | TAbortStrategyReturn<TStrategy>*/>;

export type TCancellablePromiseCatchReturn<T, TRejected extends TCancellablePromiseOnRejectedArgument<T, any>> =
  TCancellablePromiseThenReturn<T, undefined, TRejected, undefined>;

export type TCancellablePromiseCancelledReturn<T, TCancelled extends TCancellablePromiseOnCancelledArgument<T, any>> =
  TCancellablePromiseThenReturn<T, undefined, undefined, TCancelled>;

/*---*/

export type TNativePromiseLikeOrValueTupleToCancellablePromiseTuple<TTuple extends TNativePromiseLikeOrValue<any>[]> = {
  [K in keyof TTuple]: ICancellablePromise<TTuple[K] extends TNativePromiseLikeOrValueFactory<infer P>
    ? TInferNativePromiseLikeOrValue<P>
    : TTuple[K]>;
};

/*---*/
