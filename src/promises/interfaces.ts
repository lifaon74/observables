import { IPromiseCancelToken } from '../notifications/observables/promise-observable/promise-cancel-token/interfaces';

export type TPromiseType<P> = P extends PromiseLike<infer T>
  ? T extends PromiseLike<any>
    ? never
    : T
  : P;

export type TPromiseOrValue<T> = T | PromiseLike<T>;

export type TPromiseCreateCallback<T> = (resolve: (value?: TPromiseOrValue<T>) => void, reject: (reason?: any) => void) => void;
export type TPromiseConstructorLike<P extends PromiseLike<any> = PromiseLike<any>> = new(executor: TPromiseCreateCallback<TPromiseType<P>>) => P;

export type TPromiseOrValueTupleToValueTuple<TTuple extends TPromiseOrValue<any>[]> = {
  [K in keyof TTuple]: TPromiseType<TTuple[K]>;
};

export type TPromiseOrValueTupleToValueUnion<TTuple extends TPromiseOrValue<any>[]> = TPromiseOrValueTupleToValueTuple<TTuple>[Extract<keyof TTuple, number>];

// export type TCancellablePromiseTuple<T> = [Promise<T>, IPromiseCancelToken];
export type ICancellablePromiseTuple<T> = {
  promise: Promise<T>,
  token: IPromiseCancelToken,
};
