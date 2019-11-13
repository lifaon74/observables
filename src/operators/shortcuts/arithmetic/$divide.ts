import { TObservableOrValue } from '../types';
import { IFunctionObservable } from '../../../observables/distinct/function-observable/interfaces';
import { FunctionObservable } from '../../../observables/distinct/function-observable/implementation';
import { $observable } from '../primitives/$observable';

/**
 * Returns a FunctionObservable which changes when "value1 / value2" changes
 */
export function $divide(value1: TObservableOrValue<number>, value2: TObservableOrValue<number>): IFunctionObservable<typeof divide> {
  return new FunctionObservable(divide, [$observable(value1), $observable(value2)]);
}

function divide(value1: number, value2: number): number {
  return value1 / value2;
}
