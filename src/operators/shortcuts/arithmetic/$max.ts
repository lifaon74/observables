import { TObservableOrValue } from '../types';
import { IFunctionObservable } from '../../../observables/distinct/function-observable/sync/interfaces';
import { FunctionObservable } from '../../../observables/distinct/function-observable/sync/implementation';
import { $observables } from '../primitives/$observables';

/**
 * Returns a FunctionObservable which changes when "Math.max(...values)" changes
 */
export function $max(...values: TObservableOrValue<number>[]): IFunctionObservable<typeof max> {
  return new FunctionObservable(max, $observables(...values));
}

function max(...values: number[]): number {
  return Math.max(...values);
}
