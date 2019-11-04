import { KeyValueMapConstraint } from '../../core/interfaces';
import {
  INotificationsObservable
} from '../../core/notifications-observable/interfaces';
import { IsSuperSet } from '../../../classes/types';
import { INotificationsObservableContext } from '../../core/notifications-observable/context/interfaces';
import {
  KeyValueMapToNotificationsSoft, TNotificationsObservableHook
} from '../../core/notifications-observable/types';

/**
 * TYPES
 */
export type TFiniteStateObservableFinalState = 'complete' | 'error';

export type FinalStateConstraint<T> = IsSuperSet<T, TFiniteStateObservableFinalState> extends true
  ? ['next'] extends [T]
    ? 'superset must not contain next'
    : string
  : 'not a superset of TFiniteStateObservableFinalState';


// class A <T extends FinalStateConstraint<T>> {
// }
//
// const b: ['next'] extends ['complete' | 'error' | 'next'] ? true : false;
// const a = new A<'complete' | 'error'>();


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

export type FiniteStateObservableModeConstraint<T> = IsSuperSet<T, TFiniteStateObservableMode> extends true
  ? string
  : 'not a superset of TFiniteStateObservableMode';


export type TFiniteStateObservableState<TFinalState extends FinalStateConstraint<TFinalState>> =
  'next' // may emit data though 'next'
  | TFinalState
  ;



export interface IFiniteStateObservableOptions<TFinalState extends FinalStateConstraint<TFinalState>, TMode extends FiniteStateObservableModeConstraint<TMode>> {
  finalStates?: Iterable<TFinalState>;
  modes?: Iterable<TMode>;
  mode?: TMode; // default: 'once'
}

export interface IFiniteStateObservableExposedOptions<TMode extends FiniteStateObservableModeConstraint<TMode>> extends Omit<IFiniteStateObservableOptions<TFiniteStateObservableFinalState, TMode>, 'finalStates' | 'modes'>{
}

export type IFiniteStateObservableKeyValueMapGeneric<TValue, TFinalState extends FinalStateConstraint<TFinalState>> = {
  [K in TFinalState]: any;
} & {
  'next': TValue; // incoming values
  'complete': void; // when the Observable has no more data to emit
  'error': any; // when the Observable errored
};

export type FiniteStateKeyValueMapConstraint<TValue, TFinalState extends FinalStateConstraint<TFinalState>, TKVMap extends object> = KeyValueMapConstraint<TKVMap, IFiniteStateObservableKeyValueMapGeneric<TValue, TFinalState>>;

// what should emit an Observable with a similar behaviour of a FiniteStateObservable
export type TFiniteStateObservableLikeNotifications<TValue, TFinalState extends FinalStateConstraint<TFinalState>> = KeyValueMapToNotificationsSoft<IFiniteStateObservableKeyValueMapGeneric<TValue, TFinalState>>;

export interface IFiniteStateObservableHook<TValue, TFinalState extends FinalStateConstraint<TFinalState>, TKVMap extends FiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>> extends TNotificationsObservableHook<TKVMap> {
}


export type TFiniteStateObservableCreateCallback<TValue, TFinalState extends FinalStateConstraint<TFinalState>, TMode extends FiniteStateObservableModeConstraint<TMode>, TKVMap extends FiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>> =
  ((context: IFiniteStateObservableContext<TValue, TFinalState, TMode, TKVMap>) => (IFiniteStateObservableHook<TValue, TFinalState, TKVMap> | void));

export type TFiniteStateObservableConstructorArgs<TValue, TFinalState extends FinalStateConstraint<TFinalState>, TMode extends FiniteStateObservableModeConstraint<TMode>, TKVMap extends FiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>> =
  [TFiniteStateObservableCreateCallback<TValue, TFinalState, TMode, TKVMap>?, IFiniteStateObservableOptions<TFinalState, TMode>?];

export type TFiniteStateObservableGeneric<T = any> = IFiniteStateObservable<T, TFiniteStateObservableFinalState, TFiniteStateObservableMode, IFiniteStateObservableKeyValueMapGeneric<T, TFiniteStateObservableFinalState>>;

/**
 * INSTANCES
 */

export interface IFiniteStateObservableConstructor {
  new<TValue, TFinalState extends FinalStateConstraint<TFinalState>, TMode extends FiniteStateObservableModeConstraint<TMode>, TKVMap extends FiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>>(
    create?: TFiniteStateObservableCreateCallback<TValue, TFinalState, TMode, TKVMap>,
    options?: IFiniteStateObservableOptions<TFinalState, TMode>,
  ): IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>;
}

export interface IFiniteStateObservableSoftConstructor {
  new<TValue>(
    // create?: (context: IFiniteStateObservableKeyValueMapGeneric<TValue, TFiniteStateObservableFinalState>) => (IFiniteStateObservableHook<TValue, TFiniteStateObservableFinalState, IFiniteStateObservableKeyValueMapGeneric<TValue, TFiniteStateObservableFinalState>> | void),
    create?: TFiniteStateObservableCreateCallback<TValue, TFiniteStateObservableFinalState, TFiniteStateObservableMode, IFiniteStateObservableKeyValueMapGeneric<TValue, TFiniteStateObservableFinalState>>,
    options?: IFiniteStateObservableOptions<TFiniteStateObservableFinalState, TFiniteStateObservableMode>,
  ): IFiniteStateObservable<TValue, TFiniteStateObservableFinalState, TFiniteStateObservableMode, IFiniteStateObservableKeyValueMapGeneric<TValue, TFiniteStateObservableFinalState>>;
}

export interface IFiniteStateObservableTypedConstructor<TValue, TFinalState extends FinalStateConstraint<TFinalState>, TMode extends FiniteStateObservableModeConstraint<TMode>, TKVMap extends FiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>> {
  new(
    create?: TFiniteStateObservableCreateCallback<TValue, TFinalState, TMode, TKVMap>,
    options?: IFiniteStateObservableOptions<TFinalState, TMode>,
  ): IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>;
}

// const a: ConstructorParameters<IFiniteStateObservableConstructor>;
// const b: ConstructorParameters<IFiniteStateObservableSoftConstructor>;

/**
 * A FiniteStateObservable represents an Observable with a final state (complete or errored).
 * This may be useful for streams with a non infinite list of values like iterables, promises, RXJS's Observables, etc...
 */
export interface IFiniteStateObservable<TValue, TFinalState extends FinalStateConstraint<TFinalState>, TMode extends FiniteStateObservableModeConstraint<TMode>, TKVMap extends FiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>> extends INotificationsObservable<TKVMap> {
  readonly state: TFiniteStateObservableState<TFinalState>;
  readonly mode: TMode;
}


/*---------------------------*/

export interface IFiniteStateObservableContextConstructor {
  new<TValue, TFinalState extends FinalStateConstraint<TFinalState>, TMode extends FiniteStateObservableModeConstraint<TMode>, TKVMap extends FiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>>(observable: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>): IFiniteStateObservableContext<TValue, TFinalState, TMode, TKVMap>;
}

export interface IFiniteStateObservableContext<TValue, TFinalState extends FinalStateConstraint<TFinalState>, TMode extends FiniteStateObservableModeConstraint<TMode>, TKVMap extends FiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>> extends INotificationsObservableContext<TKVMap> {
  readonly observable: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>;

  next(value: TValue): void; // emits Notification('next', value)
  complete(): void; // emits Notification('complete', void)
  error(error?: any): void; // emits Notification('error', void)

  clearCache(): void;
}


