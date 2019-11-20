import { TupleArray } from '../../../../classes/types';
import { IObservable } from '../../../../core/observable/interfaces';
import { TupleTypes } from '../../../../misc/readonly-list/interfaces';
import { IFunctionObservable } from './interfaces';

/** TYPES **/

export type TValueTupleToObservableTuple<TTuple extends any[]> = {
  [K in keyof TTuple]: IObservable<TTuple[K]>;
};

export type TValueTupleToObservableArray<TTuple extends any[]> = TupleArray<TValueTupleToObservableTuple<TTuple>, IObservable<any>>;

export type TFunctionObservableFactory = (...args: any[]) => any;

export type TFunctionObservableFactoryParameters<TFactory extends TFunctionObservableFactory> = Parameters<TFactory>;

export type TFunctionObservableFactoryReturnType<TFactory extends TFunctionObservableFactory> = ReturnType<TFactory>;

export type TFunctionObservableParameters<TFactory extends TFunctionObservableFactory> = TValueTupleToObservableArray<TFunctionObservableFactoryParameters<TFactory>>;

export type TFunctionObservableValue<TFactory extends TFunctionObservableFactory> = TFunctionObservableFactoryReturnType<TFactory>;

export type TFunctionObservableParametersUnion<TFactory extends TFunctionObservableFactory> = TupleTypes<TFunctionObservableParameters<TFactory>>;

export type TFunctionObservableRunCallback<TFactory extends TFunctionObservableFactory> = (this: IFunctionObservable<TFactory>) => void;
