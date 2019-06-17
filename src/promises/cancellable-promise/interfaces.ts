import {
  IPromiseCancelToken
} from '../../notifications/observables/promise-observable/promise-cancel-token/interfaces';
import {
  TPromiseOrValue, TPromiseOrValueTupleToValueTuple, TPromiseOrValueTupleToValueUnion
} from '../interfaces';


export type TCancellablePromiseCreateCallback<T> = (this: ICancellablePromise<T>, resolve: (value?: TPromiseOrValue<T>) => void, reject: (reason?: any) => void, token: IPromiseCancelToken) => void;

/** INTERFACES **/

export interface ICancellablePromiseConstructor {

  resolve(): ICancellablePromise<void>;
  resolve<T>(value: TPromiseOrValue<T>, token?: IPromiseCancelToken): ICancellablePromise<T>;

  reject<T = never>(reason?: any, token?: IPromiseCancelToken): ICancellablePromise<T>;

  try<T>(callback: (this: ICancellablePromise<T>, token: IPromiseCancelToken) => TPromiseOrValue<T>, token?: IPromiseCancelToken): ICancellablePromise<T>;

  race<TTuple extends TPromiseOrValue<any>[]>(values: TTuple, token?: IPromiseCancelToken): ICancellablePromise<TPromiseOrValueTupleToValueUnion<TTuple>>;
  raceCallback<TTuple extends TPromiseOrValue<any>[]>(callback: (this: ICancellablePromise<TPromiseOrValueTupleToValueUnion<TTuple>>, token: IPromiseCancelToken) => TTuple, token?: IPromiseCancelToken): ICancellablePromise<TPromiseOrValueTupleToValueUnion<TTuple>>;

  all<TTuple extends TPromiseOrValue<any>[]>(values: TTuple, token?: IPromiseCancelToken): ICancellablePromise<TPromiseOrValueTupleToValueTuple<TTuple>>;
  allCallback<TTuple extends TPromiseOrValue<any>[]>(callback: (this: ICancellablePromise<TPromiseOrValueTupleToValueTuple<TTuple>>, token: IPromiseCancelToken) => TTuple, token?: IPromiseCancelToken): ICancellablePromise<TPromiseOrValueTupleToValueTuple<TTuple>>;

  of<T>(promiseOrCallback: Promise<T> | TCancellablePromiseCreateCallback<T>, token?: IPromiseCancelToken): ICancellablePromise<T>;


  new<T>(promiseOrCallback: Promise<T> | TCancellablePromiseCreateCallback<T>, token?: IPromiseCancelToken): ICancellablePromise<T>;
}

export interface ICancellablePromise<T> extends Promise<T> {
  readonly promise: Promise<T>;
  readonly token: IPromiseCancelToken;

  then<TResult1 = T, TResult2 = never>(
    onFulfilled?: ((this: this, value: T, token: IPromiseCancelToken) => TPromiseOrValue<TResult1>) | undefined | null,
    onRejected?: ((this: this, reason: any, token: IPromiseCancelToken) => TPromiseOrValue<TResult2>) | undefined | null
  ): ICancellablePromise<TResult1 | TResult2>;

  catch<TResult = never>(
    onRejected?: ((this: this, reason: any, token: IPromiseCancelToken) => TPromiseOrValue<TResult>) | undefined | null
  ): ICancellablePromise<T | TResult>;

  finally(onFinally?: ((this: this, token: IPromiseCancelToken) => void) | undefined | null): ICancellablePromise<T>;

  cancelled(onCancelled: ((this: this, token: IPromiseCancelToken) => void) | undefined | null): ICancellablePromise<T>;

}

