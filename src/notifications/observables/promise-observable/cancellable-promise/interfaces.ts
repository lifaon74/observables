import { IPromiseCancelToken, TPromiseType } from '../promise-cancel-token/interfaces';

/** TYPES **/

export type TPromiseOrValue<T> = T | PromiseLike<T>;
export type TPromiseCreateCallback<T> = (resolve: (value?: TPromiseOrValue<T>) => void, reject: (reason?: any) => void) => void;


export type TPromiseOrValueTupleToValueTuple<TTuple extends TPromiseOrValue<any>[]> = {
  [K in keyof TTuple]: TPromiseType<TTuple[K]>;
};

export type TPromiseOrValueTupleToValueUnion<TTuple extends TPromiseOrValue<any>[]> = TPromiseOrValueTupleToValueTuple<TTuple>[Extract<keyof TTuple, number>];


/** INTERFACES **/

export interface ICancellablePromiseConstructor {

  resolve(): ICancellablePromise<void>;
  resolve<T>(value: TPromiseOrValue<T>, token?: IPromiseCancelToken): ICancellablePromise<T>;

  reject<T = never>(reason?: any, token?: IPromiseCancelToken): ICancellablePromise<T>;

  try<T>(callback: () => TPromiseOrValue<T>, token?: IPromiseCancelToken): ICancellablePromise<T>;

  race<TTuple extends TPromiseOrValue<any>[]>(values: TTuple, token?: IPromiseCancelToken): ICancellablePromise<TPromiseOrValueTupleToValueUnion<TTuple>>;

  all<TTuple extends TPromiseOrValue<any>[]>(values: TTuple, token?: IPromiseCancelToken): Promise<TPromiseOrValueTupleToValueTuple<TTuple>>;


  new<T>(promiseOrCallback: Promise<T> | TPromiseCreateCallback<T>, token?: IPromiseCancelToken): ICancellablePromise<T>;
}

export interface ICancellablePromise<T> extends Promise<T> {

}

