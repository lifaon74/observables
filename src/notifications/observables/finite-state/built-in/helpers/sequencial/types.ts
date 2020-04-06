import { TFiniteStateObservableSuperGeneric } from '../../../types';

export type TRunSequentialFiniteStateObservablesObservables<TValue> = {
  [Symbol.iterator](): Iterator<TFiniteStateObservableSuperGeneric<TValue>, any, TValue>;
};

