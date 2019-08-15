import {
  FinalStateConstraint, FiniteStateKeyValueMapConstraint, FiniteStateObservableModeConstraint, IFiniteStateObservable,
  IFiniteStateObservableContext
} from './interfaces';
import { noop } from '../../../helpers';

export function FiniteStateObservableHookDefaultOnUnobserved<TValue, TFinalState extends FinalStateConstraint<TFinalState>, TMode extends FiniteStateObservableModeConstraint<TMode>, TKVMap extends FiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>>(
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
