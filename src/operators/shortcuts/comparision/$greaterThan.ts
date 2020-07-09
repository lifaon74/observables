import { TObservableOrValue } from '../types';
import { IFunctionObservable } from '../../../observables/distinct/function-observable/sync/interfaces';
import { FunctionObservable } from '../../../observables/distinct/function-observable/sync/implementation';
import { $observable } from '../primitives/$observable';

/**
 * Returns a FunctionObservable which changes when "value1 > value2" changes
 */
export function $greaterThan(value1: TObservableOrValue<any>, value2: TObservableOrValue<any>): IFunctionObservable<typeof greaterThan> {
  return new FunctionObservable(greaterThan, [$observable(value1), $observable(value2)]);
}

function greaterThan(a: any, b: any): boolean {
  return a > b;
}
