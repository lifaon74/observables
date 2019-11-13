import { TObservableOrValueTupleToObservables } from '../types';
import { $observable } from './$observable';

/**
 * Converts a list of values or an Observable to an Observable
 */
export function $observables<TTuple extends any[]>(...inputs: TTuple): TObservableOrValueTupleToObservables<TTuple> {
  return inputs.map(input => $observable(input)) as any;
}
