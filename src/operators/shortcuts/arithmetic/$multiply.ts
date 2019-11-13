import { TObservableOrValue } from '../types';
import { IFunctionObservable } from '../../../observables/distinct/function-observable/interfaces';
import { FunctionObservable } from '../../../observables/distinct/function-observable/implementation';
import { $observable } from '../primitives/$observable';

/**
 * Returns a FunctionObservable which changes when "value1 * value2" changes
 */
export function $multiply(value1: TObservableOrValue<number>, value2: TObservableOrValue<number>): IFunctionObservable<typeof multiply> {
  return new FunctionObservable(multiply, [$observable(value1), $observable(value2)]);
}

function multiply(value1: number, value2: number): number {
  return value1 * value2;
}
