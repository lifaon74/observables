import {
  IAsyncFunctionObservable
} from '../../../observables/distinct/function-observable/async/interfaces';
import { TObservableOrValue } from '../types';
import { AsyncFunctionObservable } from '../../../observables/distinct/function-observable/async/implementation';
import { $observables } from './$observables';
import {
  TAsyncFunctionObservableFactory, TAsyncFunctionObservableFactoryParameters
} from '../../../observables/distinct/function-observable/async/types';

export function $asyncFunction<T extends TAsyncFunctionObservableFactory>(factory: T, args: TObservableOrValue<TAsyncFunctionObservableFactoryParameters<T>>): IAsyncFunctionObservable<T> {
  return new AsyncFunctionObservable(factory, $observables(...args as any) as any);
}
