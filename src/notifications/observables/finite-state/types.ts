import { IsSuperSet } from '../../../classes/types';
import {
  KeyValueMapToNotificationsSoft, TNotificationsObservableHook
} from '../../core/notifications-observable/types';
import { KeyValueMapConstraint } from '../../core/interfaces';
import { IFiniteStateObservable } from './interfaces';
import { IFiniteStateObservableContext } from './context/interfaces';

/** TYPES **/

// a FiniteStateObservable must implement this two final states (when observable won't send any more values):
export type TFiniteStateObservableFinalState =
  'complete' // every values properly sent
  | 'error'; // an error occurred

// constraints TFinalState to be a superset of TFiniteStateObservableFinalState and not include 'next' (because 'next' is used to transmit values)
export type TFinalStateConstraint<TFinalState> = IsSuperSet<TFinalState, TFiniteStateObservableFinalState> extends true
  ? ['next'] extends [TFinalState]
    ? 'superset must not contain next'
    : string
  : 'not a superset of TFiniteStateObservableFinalState';


/**
 * What to do when the FiniteStateObservable emits a value:
 *  INFO: except for 'cache-all', the FiniteStateObservable doesn't care of notifications different than 'next', 'complete' or 'error'
 */
export type TFiniteStateObservableMode =
  'once' // (default) does not cache any values => after the final state (TFinalState), no observers will ever receive a value ('next')
  | 'uniq' // does not cache any values => after the final state, throws an error if a new observer observes 'next' or TFinalState.
  | 'cache' // caches own notifications ('next' and TFinalState). Every observer will receive the whole list of own emitted notifications
  | 'cache-final-state' // caches TFinalState notification. Every observer will receive this final state notification
  | 'cache-all' // caches all notifications (including ones with a different name than 'next', and TFinalState). Every observer will receive the whole list of all emitted notifications
  ;

// constraints TMode to be a superset of TFiniteStateObservableMode
export type TFiniteStateObservableModeConstraint<TMode> = IsSuperSet<TMode, TFiniteStateObservableMode> extends true
  ? string
  : 'not a superset of TFiniteStateObservableMode';

// the list of all the states that the FiniteStateObservable may have
export type TFiniteStateObservableState<TFinalState extends TFinalStateConstraint<TFinalState>> =
  'next' // may emit data though 'next'
  | TFinalState
  ;


// default KVMap of a FiniteStateObservable
export type TFiniteStateObservableKeyValueMapGeneric<TValue, TFinalState extends TFinalStateConstraint<TFinalState>> = {
  [K in TFinalState]: any;
} & {
  'next': TValue; // incoming values
  'complete': void; // when the Observable has no more data to emit
  'error': any; // when the Observable errored
};

// constraints TKVMap to implement TFiniteStateObservableKeyValueMapGeneric
export type TFiniteStateKeyValueMapConstraint<TValue, TFinalState extends TFinalStateConstraint<TFinalState>, TKVMap extends object> = KeyValueMapConstraint<TKVMap, TFiniteStateObservableKeyValueMapGeneric<TValue, TFinalState>>;

// what should emit an Observable with a similar behaviour of a FiniteStateObservable
export type TFiniteStateObservableLikeNotifications<TValue, TFinalState extends TFinalStateConstraint<TFinalState>> = KeyValueMapToNotificationsSoft<TFiniteStateObservableKeyValueMapGeneric<TValue, TFinalState>>;


// callback with context provided to the FiniteStateObservable constructor
export type TFiniteStateObservableCreateCallback<TValue, TFinalState extends TFinalStateConstraint<TFinalState>, TMode extends TFiniteStateObservableModeConstraint<TMode>, TKVMap extends TFiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>> =
  ((context: IFiniteStateObservableContext<TValue, TFinalState, TMode, TKVMap>) => (IFiniteStateObservableHook<TValue, TFinalState, TKVMap> | void));

// returned value of the previous defined callback
export interface IFiniteStateObservableHook<TValue, TFinalState extends TFinalStateConstraint<TFinalState>, TKVMap extends TFiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>> extends TNotificationsObservableHook<TKVMap> {
}

// options provided to the FiniteStateObservable constructor
export interface IFiniteStateObservableOptions<TFinalState extends TFinalStateConstraint<TFinalState>, TMode extends TFiniteStateObservableModeConstraint<TMode>> {
  finalStates?: Iterable<TFinalState>; // the list of the final states. MUST contain at least TFiniteStateObservableFinalState
  modes?: Iterable<TMode>; // the list of the supported modes. MUST contain at least TFiniteStateObservableMode
  mode?: TMode; // (default: 'once') => the mode used for this FiniteStateObservable
}

// options provided to the constructor of a class extending a FiniteStateObservable
export interface IFiniteStateObservableExposedOptions<TMode extends TFiniteStateObservableModeConstraint<TMode>> extends Omit<IFiniteStateObservableOptions<TFiniteStateObservableFinalState, TMode>, 'finalStates' | 'modes'> {
}

// list of arguments provided to the FiniteStateObservable constructor
export type TFiniteStateObservableConstructorArgs<TValue, TFinalState extends TFinalStateConstraint<TFinalState>, TMode extends TFiniteStateObservableModeConstraint<TMode>, TKVMap extends TFiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>> =
  [TFiniteStateObservableCreateCallback<TValue, TFinalState, TMode, TKVMap>?, IFiniteStateObservableOptions<TFinalState, TMode>?];

// alias for a generic FiniteStateObservable
export type TFiniteStateObservableGeneric<T = any> = IFiniteStateObservable<T, TFiniteStateObservableFinalState, TFiniteStateObservableMode, TFiniteStateObservableKeyValueMapGeneric<T, TFiniteStateObservableFinalState>>;











