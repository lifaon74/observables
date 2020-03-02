import { GenerateFiniteStateObservableHookFromFileFiniteStateObservablesInParallel } from './hook-generators';
import {
  IFiniteStateObservableOptions, TFinalStateConstraint, TFiniteStateKeyValueMapConstraint,
  TFiniteStateObservableModeConstraint
} from '../../../types';
import { IFiniteStateObservable } from '../../../interfaces';
import { FiniteStateObservable } from '../../../implementation';


// todo replace by generic typing because TFinalState, TMode, etc... are not required
export function RunParallelFiniteStateObservables<TValue,
  TFinalState extends TFinalStateConstraint<TFinalState>,
  TMode extends TFiniteStateObservableModeConstraint<TMode>,
  TKVMap extends TFiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>>(
  observables: Iterable<IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>>,
  options?: IFiniteStateObservableOptions<TFinalState, TMode>,
): IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap> {
  return new FiniteStateObservable<TValue, TFinalState, TMode, TKVMap>(
    GenerateFiniteStateObservableHookFromFileFiniteStateObservablesInParallel(observables),
    options
  );
}
