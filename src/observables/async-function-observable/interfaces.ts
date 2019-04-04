import { IReadonlyTuple, TupleTypes } from '../../misc/readonly-list/interfaces';
import { IAsyncValueObservable } from '../async-value-observable/interfaces';
import { ObservableCastTuple, SourceCastTuple, TFunctionObservableFactory } from '../function-observable/interfaces';
import { IPromiseCancelToken } from '../../notifications/observables/promise-observable/promise-cancel-token/interfaces';


export interface IAsyncFunctionObservableConstructor {
  create<T extends TAsyncFunctionObservableFactory>(factory: T): (...args: TAsyncFunctionObservableParameters<T>) => IAsyncFunctionObservable<T>;

  new<T extends TAsyncFunctionObservableFactory>(factory: T, args: TAsyncFunctionObservableParameters<T>): IAsyncFunctionObservable<T>;
}


export interface IAsyncFunctionObservable<T extends TAsyncFunctionObservableFactory> extends IAsyncValueObservable<TAsyncFunctionObservableValue<T>> {
  readonly factory: T;
  readonly arguments: IReadonlyTuple<TAsyncFunctionObservableParameters<T>>;
}

export type TAsyncFunctionObservableFactory = (token: IPromiseCancelToken, ...args: any[]) => Promise<any>;

export type TAsyncFunctionObservableFactoryParameters<T extends TAsyncFunctionObservableFactory> = T extends (token: IPromiseCancelToken, ...args: infer P) => any ? P : never;
export type TAsyncFunctionObservableFactoryReturnType<T extends TAsyncFunctionObservableFactory> = ReturnType<T>;

export type TAsyncFunctionObservableParameters<T extends TAsyncFunctionObservableFactory> = ObservableCastTuple<TAsyncFunctionObservableFactoryParameters<T>>;
export type TAsyncFunctionObservableValue<T extends TAsyncFunctionObservableFactory> = TAsyncFunctionObservableFactoryReturnType<T> extends Promise<infer R> ? R : never;
export type TAsyncFunctionObservableParametersUnion<T extends TAsyncFunctionObservableFactory> = TupleTypes<TAsyncFunctionObservableParameters<T>>;

/*--------------------------------*/


export interface ISourceAsyncFunctionObservableConstructor {
  create<T extends TAsyncFunctionObservableFactory>(factory: T): (...args: TSourceAsyncFunctionObservableParameters<T>) => ISourceAsyncFunctionObservable<T>;

  new<T extends TAsyncFunctionObservableFactory>(factory: T, args: TSourceAsyncFunctionObservableParameters<T>): ISourceAsyncFunctionObservable<T>;
}

export interface ISourceAsyncFunctionObservable<T extends TAsyncFunctionObservableFactory> extends IAsyncFunctionObservable<T> {
  readonly arguments: IReadonlyTuple<TSourceAsyncFunctionObservableParameters<T>>;
  call(...args: TAsyncFunctionObservableFactoryParameters<T>): Promise<this>;
}


export type TSourceAsyncFunctionObservableParameters<T extends TFunctionObservableFactory> = SourceCastTuple<TAsyncFunctionObservableFactoryParameters<T>>;
