import { TObservableOrValue } from '../types';
import { IFunctionObservable } from '../../../observables/distinct/function-observable/sync/interfaces';
import { FunctionObservable } from '../../../observables/distinct/function-observable/sync/implementation';
import { $observables } from '../primitives/$observables';

/**
 * Creates a FunctionObservable from a string template.
 * @Example:
 *  - $string`a${source1}b${source2}c`
 */
export function $string(parts: TemplateStringsArray | string[], ...args: TObservableOrValue<any>[]): IFunctionObservable<(...values: any[]) => string> {
  const lengthMinusOne: number = parts.length - 1;
  return new FunctionObservable((...values: any[]) => {
    let str: string = '';
    for (let i = 0; i < lengthMinusOne; i++) {
      str += parts[i] + values[i];
    }
    return str + parts[lengthMinusOne];
  }, $observables(...args));
}
