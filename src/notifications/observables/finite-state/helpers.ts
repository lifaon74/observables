import { IFiniteStateObservable } from './interfaces';
import { noop } from '../../../helpers';
import {
  TFinalStateConstraint, TFiniteStateKeyValueMapConstraint, TFiniteStateObservableModeConstraint
} from './types';
import { IFiniteStateObservableContext } from './context/interfaces';

export function FiniteStateObservableHookDefaultOnObserved<TValue, TFinalState extends TFinalStateConstraint<TFinalState>, TMode extends TFiniteStateObservableModeConstraint<TMode>, TKVMap extends TFiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>>(
  instance: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>,
  context: IFiniteStateObservableContext<TValue, TFinalState, TMode, TKVMap>,
  start: (instance: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>) => void,
): void {
  if (
    (instance.observers.length === 1)
    && (instance.state === 'next')
  ) {
    start(instance);
  }
}


export function FiniteStateObservableHookDefaultOnUnobserved<TValue, TFinalState extends TFinalStateConstraint<TFinalState>, TMode extends TFiniteStateObservableModeConstraint<TMode>, TKVMap extends TFiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>>(
  instance: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>,
  context: IFiniteStateObservableContext<TValue, TFinalState, TMode, TKVMap>,
  clear: (instance: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>) => void = noop,
): void {
  if (
    (!instance.observed)
    && (instance.state === 'next')
  ) {
    clear(instance);
    context.clearCache();
  }
}
