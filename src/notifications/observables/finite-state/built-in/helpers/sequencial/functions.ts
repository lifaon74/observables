import {
  IFiniteStateObservableOptions, TFiniteStateObservableFinalState, TFiniteStateObservableGeneric,
  TFiniteStateObservableKeyValueMapGeneric, TFiniteStateObservableMode
} from '../../../types';
import { FiniteStateObservable } from '../../../implementation';
import { GenerateFiniteStateObservableHookFromFileFiniteStateObservablesInSequence } from './hook-generators';
import { TRunSequentialFiniteStateObservablesObservables } from './types';

export function RunSequentialFiniteStateObservables<TValue>(
  observables: TRunSequentialFiniteStateObservablesObservables<TValue>,
  options?: IFiniteStateObservableOptions<TFiniteStateObservableFinalState, TFiniteStateObservableMode>,
): TFiniteStateObservableGeneric<TValue> {
  return new FiniteStateObservable<TValue, TFiniteStateObservableFinalState, TFiniteStateObservableMode, TFiniteStateObservableKeyValueMapGeneric<TValue, TFiniteStateObservableFinalState>>(
    GenerateFiniteStateObservableHookFromFileFiniteStateObservablesInSequence<TValue>(observables),
    options
  );
}
