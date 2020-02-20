import {
  IPromiseLike, TInferPromiseLikeOrValue, TInferPromiseLikeReturnedByThen, TInferPromiseLikeType,
  TPromiseLikeConstraint, TPromiseLikeFulfilledArgument, TPromiseLikeOrValue, TPromiseLikeRejectedArgument
} from './promise-like';


/** INSTANCE **/

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

  readonly [Symbol.toStringTag]: string;
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

/* NEW */
export interface IPromiseConstructorNew {
  new<T extends TPromiseLikeConstraint<T>>(create: TPromiseCreateCallback<T>): IPromise<T>;
}

/* PROTOTYPE */
export interface IPromiseConstructorPrototype {
  readonly prototype: IPromise<unknown>;
}

/* RESOLVE */
export interface IPromiseConstructorResolve {
  resolve(): IPromise<void>;

  resolve<T extends TPromiseLikeConstraint<T>>(value: TPromiseLikeOrValue<T>): IPromise<T>;
}

/* REJECT */
export interface IPromiseConstructorReject {
  reject<T extends TPromiseLikeConstraint<T> = never>(reason?: any): IPromise<T>;
}

/* ALL */
export interface IPromiseConstructorAll {
  all<TTuple extends TPromiseLikeOrValue<unknown>[]>(values: TTuple): TInferPromiseConstructorAllTupleReturn<TTuple>;

  all<TIterable extends Iterable<TPromiseLikeOrValue<unknown>>>(values: TIterable): TInferPromiseConstructorAllIterableReturn<TIterable>;
}

// INFO doesnt guaranty than returned values will fulfills the constraint
export type TMapPromiseLikeOrValueTupleToValueTuple<TTuple extends TPromiseLikeOrValue<unknown>[]> = {
  [TKey in keyof TTuple]: TInferPromiseLikeOrValue<TTuple[TKey]>;
};

export type TInferPromiseConstructorAllTupleReturn<TTuple extends TPromiseLikeOrValue<unknown>[]> = IPromiseNonConstrained<TMapPromiseLikeOrValueTupleToValueTuple<TTuple>>;
export type TInferPromiseConstructorAllIterableReturn<TIterable extends Iterable<TPromiseLikeOrValue<unknown>>> = TIterable extends Iterable<infer TIterableValue>
  ? IPromiseNonConstrained<TInferPromiseLikeOrValue<TIterableValue>>
  : never;

// // INFO debug IPromiseConstructorAll
// const ctor: IPromiseConstructorAll = null as any;
// const a: IPromise<'a'> = null as any;
// const c = ctor.all([a, 'b'] as [IPromise<'a'>, 'b']);
// const d = ctor.all([a, 'b'] as Iterable<IPromise<'a'> | 'b'>);

/* RACE */
export interface IPromiseConstructorRace {
  race<TTuple extends TPromiseLikeOrValue<unknown>[]>(values: TTuple): TInferPromiseConstructorRaceTupleReturn<TTuple>;

  race<TIterable extends Iterable<TPromiseLikeOrValue<unknown>>>(values: TIterable): TInferPromiseConstructorRaceIterableReturn<TIterable>;
}

export type TInferPromiseConstructorRaceTupleReturn<TTuple extends TPromiseLikeOrValue<unknown>[]> = IPromiseNonConstrained<TMapPromiseLikeOrValueTupleToValueTuple<TTuple>[number]>;
export type TInferPromiseConstructorRaceIterableReturn<TIterable extends Iterable<TPromiseLikeOrValue<unknown>>> = TInferPromiseConstructorAllIterableReturn<TIterable>;

// // INFO debug IPromiseConstructorRace
// const ctor: IPromiseConstructorRace = null as any;
// const a: IPromise<'a'> = null as any;
// const c = ctor.race([a, 'b'] as [IPromise<'a'>, 'b']);
// const d = ctor.race([a, 'b'] as Iterable<IPromise<'a'> | 'b'>);

/* CONSTRUCTOR */
export interface IPromiseConstructor extends IPromiseConstructorNew,
  IPromiseConstructorPrototype,
  IPromiseConstructorResolve,
  IPromiseConstructorReject,
  IPromiseConstructorAll,
  IPromiseConstructorRace,
  Omit<PromiseConstructor, 'new' | 'prototype' | 'resolve' | 'reject' | 'all' | 'race'> {
}

// INFO debug
// const a: IPromise<'a'> = null as any;
// const b = a.then((): 'b' => 'b');
