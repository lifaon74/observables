import {
  IDistinctValueObservable, IDistinctValueObservableConstructor
} from '../../distinct-value-observable/sync/interfaces';
import { IReadonlyTuple } from '../../../../misc/readonly-list/interfaces';
import {
  TFunctionObservableFactory, TFunctionObservableParameters, TFunctionObservableRunCallback, TFunctionObservableValue
} from './types';

/** INTERFACES **/

export interface IFunctionObservableStatic extends Omit<IDistinctValueObservableConstructor, 'new'> {
  create<TFactory extends TFunctionObservableFactory>(factory: TFactory): (...args: TFunctionObservableParameters<TFactory>) => IFunctionObservable<TFactory>;
}

export interface IFunctionObservableConstructor extends IFunctionObservableStatic {
  new<TFactory extends TFunctionObservableFactory>(factory: TFactory, args: TFunctionObservableParameters<TFactory>): IFunctionObservable<TFactory>;
}

export interface IFunctionObservableTypedConstructor<TFactory extends TFunctionObservableFactory> extends IFunctionObservableStatic {
  new(factory: TFactory, args: TFunctionObservableParameters<TFactory>): IFunctionObservable<TFactory>;
}


export interface IFunctionObservable<TFactory extends TFunctionObservableFactory> extends IDistinctValueObservable<TFunctionObservableValue<TFactory>> {
  readonly factory: TFactory;
  readonly args: IReadonlyTuple<TFunctionObservableParameters<TFactory>>;

  pause(): void;

  resume(): void;

  run(callback: TFunctionObservableRunCallback<TFactory>): this;
}
