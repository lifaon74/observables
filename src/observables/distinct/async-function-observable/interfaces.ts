import { IReadonlyTuple, TupleTypes } from '../../../misc/readonly-list/interfaces';
import { IAsyncDistinctValueObservable } from '../distinct-async-value-observable/interfaces';
import { ObservableCastTupleArray } from '../function-observable/interfaces';
import { ICancelToken } from '../../../misc/cancel-token/interfaces';


export interface IAsyncFunctionObservableConstructor {
  create<T extends TAsyncFunctionObservableFactory>(factory: T): (...args: TAsyncFunctionObservableParameters<T>) => IAsyncFunctionObservable<T>;

  new<T extends TAsyncFunctionObservableFactory>(factory: T, args: TAsyncFunctionObservableParameters<T>): IAsyncFunctionObservable<T>;
}


export interface IAsyncFunctionObservable<T extends TAsyncFunctionObservableFactory> extends IAsyncDistinctValueObservable<TAsyncFunctionObservableValue<T>> {
  readonly factory: T;
  readonly args: IReadonlyTuple<TAsyncFunctionObservableParameters<T>>;

  pause(): void;

  resume(): Promise<void>;

  run(callback: (this: this) => void): Promise<this>;
}

export type TAsyncFunctionObservableFactory = (token: ICancelToken, ...args: any[]) => Promise<any>;

export type TAsyncFunctionObservableFactoryParameters<T extends TAsyncFunctionObservableFactory> = T extends (token: ICancelToken, ...args: infer P) => any ? P : never;
export type TAsyncFunctionObservableFactoryReturnType<T extends TAsyncFunctionObservableFactory> = ReturnType<T>;

export type TAsyncFunctionObservableParameters<T extends TAsyncFunctionObservableFactory> = ObservableCastTupleArray<TAsyncFunctionObservableFactoryParameters<T>>;
export type TAsyncFunctionObservableValue<T extends TAsyncFunctionObservableFactory> = TAsyncFunctionObservableFactoryReturnType<T> extends Promise<infer R> ? R : never;
export type TAsyncFunctionObservableParametersUnion<T extends TAsyncFunctionObservableFactory> = TupleTypes<TAsyncFunctionObservableParameters<T>>;
