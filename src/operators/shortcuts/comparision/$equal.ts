import { TObservableOrValue } from '../types';
import { IFunctionObservable } from '../../../observables/distinct/function-observable/interfaces';
import { FunctionObservable } from '../../../observables/distinct/function-observable/implementation';
import { $observable } from '../primitives/$observable';

/**
 * Returns a FunctionObservable which changes when "value1 === value2" changes
 */
export function $equal(value1: TObservableOrValue<any>, value2: TObservableOrValue<any>): IFunctionObservable<typeof equal> {
  return new FunctionObservable(equal, [$observable(value1), $observable(value2)]);
}

function equal(a: any, b: any): boolean {
  return a === b;
}
