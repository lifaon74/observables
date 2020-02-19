import {
  IPromiseLike, TInferPromiseLikeReturnedByThen, TInferPromiseLikeType, TPromiseLikeConstraint,
  TPromiseLikeFulfilledArgument, TPromiseLikeOrValue, TPromiseLikeRejectedArgument
} from './promise-like';


/** INTERFACE **/

// better definition of a Promise
export interface IPromise<T extends TPromiseLikeConstraint<T>> extends IPromiseLike<T>, Promise<T> {
  then(): TInferPromiseReturnedByThen<T, undefined, undefined>;

  then<TFulfilled extends TPromiseLikeFulfilledArgument<T>,
    >(fulfilled: TFulfilled): TInferPromiseReturnedByThen<T, TFulfilled, undefined>;

  then<TFulfilled extends TPromiseLikeFulfilledArgument<T>,
    TRejected extends TPromiseLikeRejectedArgument>(fulfilled: TFulfilled, rejected: TRejected): TInferPromiseReturnedByThen<T, TFulfilled, TRejected>;

  catch(): TInferPromiseReturnedByCatch<T, undefined>;

  catch<TRejected extends TPromiseLikeRejectedArgument>(onRejected: TRejected): TInferPromiseReturnedByCatch<T, TRejected>;


  finally(): IPromise<T>;

  finally(onFinally: TPromiseFinallyArgument): IPromise<T>;
}

// returns an IPromiseLike<T> if T fulfills the constraint, else returns never
export type IPromiseNonConstrained<T> = [T] extends [TPromiseLikeConstraint<T>] ? IPromise<T> : never;

export type TPromiseFinallyCallback = () => TPromiseLikeOrValue<unknown>;

export type TPromiseFinallyArgument =
  TPromiseFinallyCallback
  | undefined
  | null;

export type TInferPromiseReturnedByThen<Tin extends TPromiseLikeConstraint<Tin>,
  TFulfilled extends TPromiseLikeFulfilledArgument<Tin>,
  TRejected extends TPromiseLikeRejectedArgument> =
  IPromiseNonConstrained<TInferPromiseLikeType<TInferPromiseLikeReturnedByThen<Tin, TFulfilled, TRejected>>>;

export type TInferPromiseReturnedByCatch<Tin extends TPromiseLikeConstraint<Tin>,
  TRejected extends TPromiseLikeRejectedArgument> =
  TInferPromiseReturnedByThen<Tin, undefined, TRejected>;


/** CONSTRUCTOR **/

export type TPromiseCreateCallback<T extends TPromiseLikeConstraint<T>> = (resolve: (value?: TPromiseLikeOrValue<T>) => void, reject: (reason?: any) => void) => void;
export type TPromiseCreateCallbackNonConstrained<T> = [T] extends [TPromiseLikeConstraint<T>] ? TPromiseCreateCallback<T> : never;

export interface IPromiseConstructorNew {
  new<T extends TPromiseLikeConstraint<T>>(create: TPromiseCreateCallback<T>): IPromise<T>;
}

export interface IPromiseConstructorResolve {
  resolve(): IPromise<void>;
  resolve<T extends TPromiseLikeConstraint<T>>(value: TPromiseLikeOrValue<T>): IPromise<T>;
}

export interface IPromiseConstructorReject {
  reject<T extends TPromiseLikeConstraint<T> = never>(reason?: any): IPromise<T>;
}

export interface IPromiseConstructor extends IPromiseConstructorNew, IPromiseConstructorResolve, IPromiseConstructorReject, Omit<PromiseConstructor, 'resolve' | 'reject'> {
}

// INFO debug
// const a: IPromise<'a'> = null as any;
// const b = a.then((): 'b' => 'b');
