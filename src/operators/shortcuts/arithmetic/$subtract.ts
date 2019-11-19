import { TObservableOrValue } from '../types';
import { IFunctionObservable } from '../../../observables/distinct/function-observable/sync/interfaces';
import { FunctionObservable } from '../../../observables/distinct/function-observable/sync/implementation';
import { $observables } from '../primitives/$observables';

/**
 * Returns a FunctionObservable which changes when "values[0] - values[1] - ..." changes
 */
export function $subtract(...values: TObservableOrValue<number>[]): IFunctionObservable<typeof subtract> {
  if (values.length > 1) {
    return new FunctionObservable(subtract, $observables(...values));
  } else {
    throw new TypeError(`Expected at least 2 arguments for $subtract`);
  }
}

function subtract(...values: number[]): number {
  let value: number = values[0];
  for (let i = 1, l = values.length; i < l; i++) {
    value -= values[i];
  }
  return value;
}
