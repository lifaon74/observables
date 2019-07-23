import { IPromiseCancelToken } from '../notifications/observables/finite-state/promise/promise-cancel-token/interfaces';


export type TPromiseOrValue<T> = T | PromiseLike<T>;
export type TPromiseOrValueFactory<T> = (...args: any[]) => TPromiseOrValue<T>;


export type TPromiseType<P> = P extends PromiseLike<infer T>
  ? T extends PromiseLike<any>
    ? never
    : T
  : P;

export type TPromiseOrValueFactoryType<F extends TPromiseOrValueFactory<any>> = F extends TPromiseOrValueFactory<infer P>
  ? TPromiseType<P>
  : never;


export type TPromiseOrValueTupleToValueTuple<TTuple extends TPromiseOrValue<any>[]> = {
  [K in keyof TTuple]: TPromiseType<TTuple[K]>;
};

export type TPromiseOrValueFactoryTupleToValueTuple<TTuple extends TPromiseOrValueFactory<any>[]> = {
  [K in keyof TTuple]: TTuple[K] extends TPromiseOrValueFactory<infer P>
    ? TPromiseType<P>
    : TTuple[K];
};

export type TPromiseOrValueTupleToValueUnion<TTuple extends TPromiseOrValue<any>[]> = TPromiseOrValueTupleToValueTuple<TTuple>[Extract<keyof TTuple, number>];
export type TPromiseOrValueFactoryTupleToValueUnion<TTuple extends TPromiseOrValueFactory<any>[]> = TPromiseOrValueFactoryTupleToValueTuple<TTuple>[Extract<keyof TTuple, number>];



export type TPromiseCreateCallback<T> = (resolve: (value?: TPromiseOrValue<T>) => void, reject: (reason?: any) => void) => void;
export type TPromiseConstructorLike<P extends PromiseLike<any> = PromiseLike<any>> = new(executor: TPromiseCreateCallback<TPromiseType<P>>) => P;


// export type TCancellablePromiseTuple<T> = [Promise<T>, IPromiseCancelToken];
export type ICancellablePromiseTuple<T> = {
  promise: Promise<T>,
  token: IPromiseCancelToken,
};
