import {
  IFunctionObservable,
  TFunctionObservableFactory, TFunctionObservableFactoryParameters
} from '../../../observables/distinct/function-observable/interfaces';
import { TObservableOrValues } from '../types';
import { FunctionObservable } from '../../../observables/distinct/function-observable/implementation';
import { $observables } from './$observables';

/**
 * Creates a FunctionObservable from a factory function and some inputs
 */
export function $function<T extends TFunctionObservableFactory>(factory: T, args: TObservableOrValues<TFunctionObservableFactoryParameters<T>>): IFunctionObservable<T> {
  return new FunctionObservable(factory, $observables(...args as any) as any);
}
