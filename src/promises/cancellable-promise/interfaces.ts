import { IPromiseCancelToken } from '../../notifications/observables/promise-observable/promise-cancel-token/interfaces';
import { TPromiseCreateCallback, TPromiseOrValue, TPromiseOrValueTupleToValueTuple, TPromiseOrValueTupleToValueUnion } from '../interfaces';

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
  readonly promise: Promise<T>;
  readonly token: IPromiseCancelToken;

  then<TResult1 = T, TResult2 = never>(
    onFulfilled?: ((value: T, token: IPromiseCancelToken) => TPromiseOrValue<TResult1>) | undefined | null,
    onRejected?: ((reason: any, token: IPromiseCancelToken) => TPromiseOrValue<TResult2>) | undefined | null
  ): ICancellablePromise<TResult1 | TResult2>;

  catch<TResult = never>(
    onRejected?: ((reason: any, token: IPromiseCancelToken) => TPromiseOrValue<TResult>) | undefined | null
  ): ICancellablePromise<T | TResult>;

  finally(onFinally?: ((token: IPromiseCancelToken) => void) | undefined | null): ICancellablePromise<T>;

  cancelled(onCancelled: ((token: IPromiseCancelToken) => void) | undefined | null): ICancellablePromise<T>;
}

