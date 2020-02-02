import {
  INotificationsObservable, INotificationsObservableConstructor, INotificationsObservableTypedConstructor
} from '../../core/notifications-observable/interfaces';
import {
  IFiniteStateObservableOptions, TFinalStateConstraint, TFiniteStateKeyValueMapConstraint,
  TFiniteStateObservableCreateCallback, TFiniteStateObservableModeConstraint, TFiniteStateObservableState
} from './types';


/**
 * INTERFACES
 */

export interface IFiniteStateObservableConstructor extends Omit<INotificationsObservableConstructor, 'new'> {
  new<TValue, TFinalState extends TFinalStateConstraint<TFinalState>, TMode extends TFiniteStateObservableModeConstraint<TMode>, TKVMap extends TFiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>>(
    create?: TFiniteStateObservableCreateCallback<TValue, TFinalState, TMode, TKVMap>,
    options?: IFiniteStateObservableOptions<TFinalState, TMode>,
  ): IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>;
}

// // IFiniteStateObservableConstructor without constraints
// export interface IFiniteStateObservableSoftConstructor {
//   new<TValue>(
//     // create?: (context: IFiniteStateObservableKeyValueMapGeneric<TValue, TFiniteStateObservableFinalState>) => (IFiniteStateObservableHook<TValue, TFiniteStateObservableFinalState, IFiniteStateObservableKeyValueMapGeneric<TValue, TFiniteStateObservableFinalState>> | void),
//     create?: TFiniteStateObservableCreateCallback<TValue, TFiniteStateObservableFinalState, TFiniteStateObservableMode, TFiniteStateObservableKeyValueMapGeneric<TValue, TFiniteStateObservableFinalState>>,
//     options?: IFiniteStateObservableOptions<TFiniteStateObservableFinalState, TFiniteStateObservableMode>,
//   ): IFiniteStateObservable<TValue, TFiniteStateObservableFinalState, TFiniteStateObservableMode, TFiniteStateObservableKeyValueMapGeneric<TValue, TFiniteStateObservableFinalState>>;
// }

export interface IFiniteStateObservableTypedConstructor<TValue,
  TFinalState extends TFinalStateConstraint<TFinalState>,
  TMode extends TFiniteStateObservableModeConstraint<TMode>,
  TKVMap extends TFiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>> extends Omit<INotificationsObservableTypedConstructor<TKVMap>, 'new'> {
  new(
    create?: TFiniteStateObservableCreateCallback<TValue, TFinalState, TMode, TKVMap>,
    options?: IFiniteStateObservableOptions<TFinalState, TMode>,
  ): IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>;
}


/**
 * A FiniteStateObservable represents an Observable with a final state (complete or errored).
 * This may be useful for streams with a finite list of values like iterables, promises, RXJS's Observables, etc...
 */
export interface IFiniteStateObservable<TValue, TFinalState extends TFinalStateConstraint<TFinalState>, TMode extends TFiniteStateObservableModeConstraint<TMode>, TKVMap extends TFiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>> extends INotificationsObservable<TKVMap> {
  readonly state: TFiniteStateObservableState<TFinalState>;
  readonly mode: TMode;
}



