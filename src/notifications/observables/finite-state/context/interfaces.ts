import {
  TFinalStateConstraint, TFiniteStateKeyValueMapConstraint, TFiniteStateObservableModeConstraint
} from '../types';
import { INotificationsObservableContext } from '../../../core/notifications-observable/context/interfaces';
import { IFiniteStateObservable } from '../interfaces';

/** INTERFACES **/

/* PRIVATE */

export interface IFiniteStateObservableContextConstructor {
  new<TValue, TFinalState extends TFinalStateConstraint<TFinalState>, TMode extends TFiniteStateObservableModeConstraint<TMode>, TKVMap extends TFiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>>(observable: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>): IFiniteStateObservableContext<TValue, TFinalState, TMode, TKVMap>;
}

export interface IFiniteStateObservableContext<TValue, TFinalState extends TFinalStateConstraint<TFinalState>, TMode extends TFiniteStateObservableModeConstraint<TMode>, TKVMap extends TFiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>> extends INotificationsObservableContext<TKVMap> {
  readonly observable: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>;

  next(value: TValue): void; // emits Notification('next', value)
  complete(): void; // emits Notification('complete', void)
  error(error?: any): void; // emits Notification('error', void)

  clearCache(): void;
}
