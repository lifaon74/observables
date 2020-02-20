import { IFiniteStateObservable } from './interfaces';
import { IObservableHookPrivate } from '../../../core/observable/hook/privates';
import { KeyValueMapToNotifications } from '../../core/notifications-observable/types';
import { INotificationsObservableContext } from '../../core/notifications-observable/context/interfaces';
import { INotificationsObservablePrivatesInternal } from '../../core/notifications-observable/privates';
import {
  TFinalStateConstraint, TFiniteStateKeyValueMapConstraint, TFiniteStateObservableModeConstraint,
  TFiniteStateObservableState
} from './types';
import { IObserver } from '../../../core/observer/interfaces';


/** PRIVATES **/

export const FINITE_STATE_OBSERVABLE_PRIVATE = Symbol('finite-state-observable-private');

export interface IFiniteStateObservablePrivate<TValue,
  TFinalState extends TFinalStateConstraint<TFinalState>,
  TMode extends TFiniteStateObservableModeConstraint<TMode>,
  TKVMap extends TFiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>> extends IObservableHookPrivate<KeyValueMapToNotifications<TKVMap>> {
  context: INotificationsObservableContext<TKVMap>;
  values: KeyValueMapToNotifications<TKVMap>[];
  lastValueIndexPerObserver: WeakMap<IObserver<KeyValueMapToNotifications<TKVMap>>, number>;

  finalStates: Set<TFinalState>;
  modes: Set<TMode>;
  mode: TMode;
  state: TFiniteStateObservableState<TFinalState>;
}

export interface IFiniteStateObservablePrivatesInternal<TValue,
  TFinalState extends TFinalStateConstraint<TFinalState>,
  TMode extends TFiniteStateObservableModeConstraint<TMode>,
  TKVMap extends TFiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>> extends INotificationsObservablePrivatesInternal<TKVMap> {
  [FINITE_STATE_OBSERVABLE_PRIVATE]: IFiniteStateObservablePrivate<TValue, TFinalState, TMode, TKVMap>;
}

export interface IFiniteStateObservableInternal<TValue,
  TFinalState extends TFinalStateConstraint<TFinalState>,
  TMode extends TFiniteStateObservableModeConstraint<TMode>,
  TKVMap extends TFiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>> extends IFiniteStateObservablePrivatesInternal<TValue, TFinalState, TMode, TKVMap>, IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap> {
}
