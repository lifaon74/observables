import { TObservableOrValue } from '../types';
import { IFunctionObservable } from '../../../observables/distinct/function-observable/sync/interfaces';
import { FunctionObservable } from '../../../observables/distinct/function-observable/sync/implementation';
import { $observables } from '../primitives/$observables';

/**
 * Returns a FunctionObservable which changes when "sum of values" changes
 */
export function $add(...values: TObservableOrValue<number>[]): IFunctionObservable<typeof add> {
  if (values.length > 1) {
    return new FunctionObservable(add, $observables(...values));
  } else {
    throw new TypeError(`Expected at least 2 arguments for $add`);
  }
}

function add(...values: number[]): number {
  let sum: number = 0;
  for (let i = 0, l = values.length; i < l; i++) {
    sum += values[i];
  }
  return sum;
}
