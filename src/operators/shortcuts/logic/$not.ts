import { TObservableOrValue } from '../types';
import { IFunctionObservable } from '../../../observables/distinct/function-observable/interfaces';
import { FunctionObservable } from '../../../observables/distinct/function-observable/implementation';
import { $observable } from '../primitives/$observable';

/**
 * Returns a FunctionObservable which changes when "!values" changes
 */
export function $not(value: TObservableOrValue<boolean>): IFunctionObservable<typeof not> {
  return new FunctionObservable(not, [$observable(value)]);
}

function not(value: boolean): boolean {
  return !value;
}
