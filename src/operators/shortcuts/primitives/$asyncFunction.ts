import {
  IAsyncFunctionObservable,
  TAsyncFunctionObservableFactory, TAsyncFunctionObservableFactoryParameters
} from '../../../observables/distinct/async-function-observable/interfaces';
import { TObservableOrValue } from '../types';
import { AsyncFunctionObservable } from '../../../observables/distinct/async-function-observable/implementation';
import { $observables } from './$observables';

export function $asyncFunction<T extends TAsyncFunctionObservableFactory>(factory: T, args: TObservableOrValue<TAsyncFunctionObservableFactoryParameters<T>>): IAsyncFunctionObservable<T> {
  return new AsyncFunctionObservable(factory, $observables(...args as any) as any);
}