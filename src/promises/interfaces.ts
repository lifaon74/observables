import { TPromiseType } from '../notifications/observables/promise-observable/promise-cancel-token/interfaces';

export type TPromiseOrValue<T> = T | PromiseLike<T>;

export type TPromiseCreateCallback<T> = (resolve: (value?: TPromiseOrValue<T>) => void, reject: (reason?: any) => void) => void;

export type TPromiseOrValueTupleToValueTuple<TTuple extends TPromiseOrValue<any>[]> = {
  [K in keyof TTuple]: TPromiseType<TTuple[K]>;
};

export type TPromiseOrValueTupleToValueUnion<TTuple extends TPromiseOrValue<any>[]> = TPromiseOrValueTupleToValueTuple<TTuple>[Extract<keyof TTuple, number>];
