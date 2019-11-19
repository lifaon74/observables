import { TObservableOrValue } from '../types';
import { IFunctionObservable } from '../../../observables/distinct/function-observable/sync/interfaces';
import { FunctionObservable } from '../../../observables/distinct/function-observable/sync/implementation';
import { $observables } from '../primitives/$observables';

/**
 * Returns a FunctionObservable which changes when "Math.min(...values)" changes
 */
export function $min(...values: TObservableOrValue<number>[]): IFunctionObservable<typeof min> {
  return new FunctionObservable(min, $observables(...values));
}

function min(...values: number[]): number {
  return Math.min(...values);
}
