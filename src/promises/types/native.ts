import { ILightPromiseLike, TInferLightPromiseLikeType, TInferPromiseLikeOrValue } from './promise-like';
import { IAdvancedAbortController } from '../../misc/advanced-abort-controller/interfaces';

export type TPromiseStatus =
  'fulfilled' // promise is fulfilled
  | 'rejected' // promise is rejected
  | 'pending' // promise is neither resolved nor resolving
  | 'resolving';

// definition of the callback used in the Promise constructor
export type TNativePromiseCreateCallback<T> = (resolve: (value?: TNativePromiseLikeOrValue<T>) => void, reject: (reason?: any) => void) => void;

// infers the type of a PromiseLike
export type TInferNativePromiseLikeType<T extends ILightPromiseLike<unknown>> = TInferLightPromiseLikeType<T>

// definition of a PromiseLike factory (a function which produces a PromiseLike)
export type TNativePromiseFactory<T> = (...args: any[]) => Promise<T>;

// definition of a value or a PromiseLike emitting this king of value
export type TNativePromiseLikeOrValue<T> = PromiseLike<T> | T;

// infers the type of a value or the PromiseLike's value
export type TInferNativePromiseLikeOrValue<T> = TInferPromiseLikeOrValue<T>;

// definition of a PromiseLike or value factory (a function which produces a PromiseLike or a value)
export type TNativePromiseLikeOrValueFactory<T> = (...args: any[]) => TNativePromiseLikeOrValue<T>;

export type TInferNativePromiseLikeOrValueTupleToValueTuple<TTuple extends TInferNativePromiseLikeOrValue<any>[]> = {
  [K in keyof TTuple]: TInferNativePromiseLikeOrValue<TTuple[K]>;
};

export type TInferNativePromiseLikeOrValueFactoryTupleToValueTuple<TTuple extends TNativePromiseLikeOrValueFactory<any>[]> = {
  [K in keyof TTuple]: TTuple[K] extends TNativePromiseFactory<infer P>
    ? TInferNativePromiseLikeOrValue<P>
    : never;
};
export type TInferNativePromiseOrValueTupleToValueUnion<TTuple extends TInferNativePromiseLikeOrValue<any>[]> = TInferNativePromiseLikeOrValueTupleToValueTuple<TTuple>[Extract<keyof TTuple, number>];
export type TInferNativePromiseOrValueFactoryTupleToUnionOfValues<TTuple extends TNativePromiseLikeOrValueFactory<any>[]> = TInferNativePromiseLikeOrValueFactoryTupleToValueTuple<TTuple>[Extract<keyof TTuple, number>];


export type INativeCancellablePromiseTuple<T> = {
  promise: Promise<T>,
  controller: IAdvancedAbortController,
};

export interface INativePromiseFulfilledObject<T> {
  status: 'fulfilled';
  value: T;
}

export interface INativePromiseRejectedObject {
  status: 'rejected';
  reason: any;
}

export type TNativeAllSettledResult<T> = INativePromiseFulfilledObject<T> | INativePromiseRejectedObject;

