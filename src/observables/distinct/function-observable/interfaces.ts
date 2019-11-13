import { IDistinctValueObservable } from '../distinct-value-observable/interfaces';
import { IReadonlyTuple, TupleTypes } from '../../../misc/readonly-list/interfaces';
import { IObservable } from '../../../core/observable/interfaces';
import { TupleArray } from '../../../classes/types';


export interface IFunctionObservableConstructor {
  create<T extends TFunctionObservableFactory>(factory: T): (...args: TFunctionObservableParameters<T>) => IFunctionObservable<T>;

  new<T extends TFunctionObservableFactory>(factory: T, args: TFunctionObservableParameters<T>): IFunctionObservable<T>;
}


export interface IFunctionObservable<T extends TFunctionObservableFactory> extends IDistinctValueObservable<TFunctionObservableValue<T>> {
  readonly factory: T;
  readonly args: IReadonlyTuple<TFunctionObservableParameters<T>>;

  pause(): void;

  resume(): void;

  run(callback: (this: this) => void): this;
}

export type ObservableCastTuple<T extends any[]> = {
  [K in keyof T]: IObservable<T[K]>;
};


export type ObservableCastTupleArray<T extends any[]> = TupleArray<ObservableCastTuple<T>, IObservable<any>>;
// export type ObservableCastTupleArray<T extends any[]> = Array<IObservable<any>> & ObservableCastTuple<T>;

export type TFunctionObservableFactory = (...args: any[]) => any;

export type TFunctionObservableFactoryParameters<T extends TFunctionObservableFactory> = Parameters<T>;
export type TFunctionObservableFactoryReturnType<T extends TFunctionObservableFactory> = ReturnType<T>;

export type TFunctionObservableParameters<T extends TFunctionObservableFactory> = ObservableCastTupleArray<TFunctionObservableFactoryParameters<T>>;
export type TFunctionObservableValue<T extends TFunctionObservableFactory> = TFunctionObservableFactoryReturnType<T>;
export type TFunctionObservableParametersUnion<T extends TFunctionObservableFactory> = TupleTypes<TFunctionObservableParameters<T>>;
