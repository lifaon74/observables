// import {
//   IPromiseLike, TInferLightPromiseLikeType, TInferPromiseLikeType, TPromiseLikeConstraint, TPromiseLikeOrValue
// } from './promise-like';
//
// export type TPromiseCreateCallback<T extends TPromiseLikeConstraint<T>> = (resolve: (value?: TPromiseLikeOrValue<T>) => void, reject: (reason?: any) => void) => void;
// export type TPromiseCreateCallbackNonConstrained<T> = [T] extends [TPromiseLikeConstraint<T>] ? TPromiseCreateCallback<T> : never;
//
// // export type TGenericPromiseConstructor<P extends IPromiseLike<unknown> = IPromiseLike<unknown>> = new(executor: TPromiseCreateCallbackNonConstrained<TInferPromiseLikeType<P>>) => P;
