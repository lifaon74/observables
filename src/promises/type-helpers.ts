import { ICancellablePromise } from './cancellable-promise/interfaces';

/** HELPERS **/

/* PROMISE */

export type TPromiseFactory<TValue> = (...args: any[]) => PromiseLike<TValue>;

// returns the type of a promise
export type TInferPromiseType<TPromise extends PromiseLike<any>> = TPromise extends PromiseLike<infer TValue>
  ? TValue
  : never;


/* PROMISE OR VALUE */

export type TPromiseOrValue<TValue> = TValue | PromiseLike<TValue>;
export type TPromiseOrValueFactory<TValue> = (...args: any[]) => TPromiseOrValue<TValue>;

// if T is a promise, returns its type, else return T
export type TInferPromiseOrValueType<TPromiseOrValue> = TPromiseOrValue extends PromiseLike<infer TPromiseValue>
  ? TPromiseValue
  : TPromiseOrValue;

// returns the value returned by a factory
export type TInferPromiseOrValueFactoryType<TFactory extends TPromiseOrValueFactory<any>> = TInferPromiseOrValueType<ReturnType<TFactory>>


// export type TPromiseOrValueTupleToValueTuple<TTuple extends TPromiseOrValue<any>[]> = {
//   [K in keyof TTuple]: InferPromiseType<TTuple[K]>;
// };
//
// export type TPromiseOrValueFactoryTupleToValueTuple<TTuple extends TPromiseOrValueFactory<any>[]> = {
//   [K in keyof TTuple]: TTuple[K] extends TPromiseOrValueFactory<infer P>
//     ? InferPromiseType<P>
//     : TTuple[K];
// };
//
// export type TPromiseOrValueTupleToValueUnion<TTuple extends TPromiseOrValue<any>[]> = TPromiseOrValueTupleToValueTuple<TTuple>[Extract<keyof TTuple, number>];
// export type TPromiseOrValueFactoryTupleToValueUnion<TTuple extends TPromiseOrValueFactory<any>[]> = TPromiseOrValueFactoryTupleToValueTuple<TTuple>[Extract<keyof TTuple, number>];
//
//
// export type TPromiseCreateCallback<T> = (resolve: (value?: TPromiseOrValue<T>) => void, reject: (reason?: any) => void) => void;
// export type TPromiseConstructorLike<P extends PromiseLike<any> = TPromiseLike<any>> = new(executor: TPromiseCreateCallback<InferPromiseType<P>>) => P;
//


export interface PromiseFulfilledObject<T> {
  status: 'fulfilled';
  value: T;
}

export interface PromiseRejectedObject {
  status: 'rejected';
  reason: any;
}

export type AllSettledResult<T> = PromiseFulfilledObject<T> | PromiseRejectedObject;

