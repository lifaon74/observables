import { TObservableOrValue } from '../types';
import { IFunctionObservable } from '../../../observables/distinct/function-observable/interfaces';
import { FunctionObservable } from '../../../observables/distinct/function-observable/implementation';
import { $observable } from '../primitives/$observable';

/**
 * Returns a FunctionObservable which changes when "value1 !== value2" changes
 */
export function $notEqual(value1: TObservableOrValue<any>, value2: TObservableOrValue<any>): IFunctionObservable<typeof notEqual> {
  return new FunctionObservable(notEqual, [$observable(value1), $observable(value2)]);
}

function notEqual(a: any, b: any): boolean {
  return a !== b;
}
