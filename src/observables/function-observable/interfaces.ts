import { IValueObservable } from '../value-observable/interfaces';
import { IReadonlyTuple, TupleTypes } from '../../misc/readonly-list/interfaces';
import { IObservable } from '../../core/observable/interfaces';
import { ISource } from '../source/interfaces';


export interface IFunctionObservableConstructor {
  create<T extends TFunctionObservableFactory>(factory: T): (...args: TFunctionObservableParameters<T>) => IFunctionObservable<T>;

  new<T extends TFunctionObservableFactory>(factory: T, args: TFunctionObservableParameters<T>): IFunctionObservable<T>;
}


export interface IFunctionObservable<T extends TFunctionObservableFactory> extends IValueObservable<TFunctionObservableValue<T>> {
  readonly factory: T;
  readonly arguments: IReadonlyTuple<TFunctionObservableParameters<T>>;
}


export type ObservableCastTuple<T extends any[]> = Array<IObservable<any>> & {
  [K in keyof T]: IObservable<T[K]>;
};

export type TFunctionObservableFactory = (...args: any[]) => any;

export type TFunctionObservableFactoryParameters<T extends TFunctionObservableFactory> = Parameters<T>;
export type TFunctionObservableFactoryReturnType<T extends TFunctionObservableFactory> = ReturnType<T>;

export type TFunctionObservableParameters<T extends TFunctionObservableFactory> = ObservableCastTuple<TFunctionObservableFactoryParameters<T>>;
export type TFunctionObservableValue<T extends TFunctionObservableFactory> = TFunctionObservableFactoryReturnType<T>;
export type TFunctionObservableParametersUnion<T extends TFunctionObservableFactory> = TupleTypes<TFunctionObservableParameters<T>>;


/*------------------------------*/


export interface ISourceFunctionObservableConstructor {
  create<T extends TFunctionObservableFactory>(factory: T): (...args: TSourceFunctionObservableParameters<T>) => ISourceFunctionObservable<T>;

  new<T extends TFunctionObservableFactory>(factory: T, args: TSourceFunctionObservableParameters<T>): ISourceFunctionObservable<T>;
}

export interface ISourceFunctionObservable<T extends TFunctionObservableFactory> extends IFunctionObservable<T> {
  readonly arguments: IReadonlyTuple<TSourceFunctionObservableParameters<T>>;
  call(...args: TFunctionObservableFactoryParameters<T>): this;
}

export type SourceCastTuple<T extends any[]> = Array<ISource<any>> & {
  [K in keyof T]: ISource<T[K]>;
};

export type SourceOrValueCastTuple<T extends any[]> = Array<ISource<any>> & {
  [K in keyof T]: ISource<T[K]> | T[K];
};

export type TSourceFunctionObservableParameters<T extends TFunctionObservableFactory> = SourceCastTuple<TFunctionObservableFactoryParameters<T>>;
