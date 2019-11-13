import { TObservableOrValue } from '../types';
import { IFunctionObservable } from '../../../observables/distinct/function-observable/interfaces';
import { FunctionObservable } from '../../../observables/distinct/function-observable/implementation';
import { $observables } from '../primitives/$observables';

/**
 * Returns a FunctionObservable which changes when "values[0] && values[1] && ..." changes
 */
export function $and(...values: TObservableOrValue<boolean>[]): IFunctionObservable<typeof and> {
  if (values.length > 1) {
    return new FunctionObservable(and, $observables(...values));
  } else {
    throw new TypeError(`Expected at least 2 arguments for $and`);
  }
}

function and(...values: boolean[]): boolean {
  for (let i = 0, l = values.length; i < l; i++) {
    if (!values[i]) {
      return false;
    }
  }
  return true;
}
