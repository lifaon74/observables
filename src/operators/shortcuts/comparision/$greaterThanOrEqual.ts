import { TObservableOrValue } from '../types';
import { IFunctionObservable } from '../../../observables/distinct/function-observable/sync/interfaces';
import { FunctionObservable } from '../../../observables/distinct/function-observable/sync/implementation';
import { $observable } from '../primitives/$observable';

/**
 * Returns a FunctionObservable which changes when "value1 < value2" changes
 */
export function $greaterThanOrEqual(value1: TObservableOrValue<any>, value2: TObservableOrValue<any>): IFunctionObservable<typeof greaterThanOrEqual> {
  return new FunctionObservable(greaterThanOrEqual, [$observable(value1), $observable(value2)]);
}

function greaterThanOrEqual(a: any, b: any): boolean {
  return a >= b;
}
