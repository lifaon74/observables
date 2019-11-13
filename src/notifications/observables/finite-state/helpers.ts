import {
  IFiniteStateObservable
} from './interfaces';
import { noop } from '../../../helpers';
import { TFinalStateConstraint, TFiniteStateObservableModeConstraint, TFiniteStateKeyValueMapConstraint } from './types';
import { IFiniteStateObservableContext } from './context/interfaces';

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
