import { IFunctionObservable } from '../../../observables/distinct/function-observable/sync/interfaces';
import { TObservableOrValues } from '../types';
import { FunctionObservable } from '../../../observables/distinct/function-observable/sync/implementation';
import { $observables } from './$observables';
import {
  TFunctionObservableFactory, TFunctionObservableFactoryParameters
} from '../../../observables/distinct/function-observable/sync/types';

/**
 * Creates a FunctionObservable from a factory function and some inputs
 */
export function $function<T extends TFunctionObservableFactory>(factory: T, args: TObservableOrValues<TFunctionObservableFactoryParameters<T>>): IFunctionObservable<T> {
  return new FunctionObservable(factory, $observables(...args as any) as any);
}
