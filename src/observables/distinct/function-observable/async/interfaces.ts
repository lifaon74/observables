import {
  IAsyncDistinctValueObservable, IAsyncDistinctValueObservableConstructor
} from '../../distinct-value-observable/async/interfaces';
import {
  TAsyncFunctionObservableFactory, TAsyncFunctionObservableParameters, TAsyncFunctionObservableRunCallback,
  TAsyncFunctionObservableValue
} from './types';
import { IReadonlyTuple } from '../../../../misc/readonly-tuple/interfaces';

/** INTERFACES **/

export interface IAsyncFunctionObservableStatic extends Omit<IAsyncDistinctValueObservableConstructor, 'new'> {
  create<TFactory extends TAsyncFunctionObservableFactory>(factory: TFactory): (...args: TAsyncFunctionObservableParameters<TFactory>) => IAsyncFunctionObservable<TFactory>;
}

export interface IAsyncFunctionObservableConstructor extends IAsyncFunctionObservableStatic {
  new<TFactory extends TAsyncFunctionObservableFactory>(factory: TFactory, args: TAsyncFunctionObservableParameters<TFactory>): IAsyncFunctionObservable<TFactory>;
}

export interface IAsyncFunctionObservableTypedConstructor<TFactory extends TAsyncFunctionObservableFactory> extends IAsyncFunctionObservableStatic {
  new(factory: TFactory, args: TAsyncFunctionObservableParameters<TFactory>): IAsyncFunctionObservable<TFactory>;
}

export interface IAsyncFunctionObservable<TFactory extends TAsyncFunctionObservableFactory> extends IAsyncDistinctValueObservable<TAsyncFunctionObservableValue<TFactory>> {
  readonly factory: TFactory;
  readonly args: IReadonlyTuple<TAsyncFunctionObservableParameters<TFactory>>;

  pause(): void;

  resume(): Promise<void>;

  run(callback: TAsyncFunctionObservableRunCallback<TFactory>): Promise<this>;
}

