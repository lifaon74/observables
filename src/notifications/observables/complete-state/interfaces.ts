import { KeyValueMapConstraint, KeyValueMapGenericConstraint } from '../../core/interfaces';
import { IObservableHook } from '../../../core/observable/interfaces';
import {
  INotificationsObservable, INotificationsObservableContext, KeyValueMapToNotifications, TNotificationsObservableHook
} from '../../core/notifications-observable/interfaces';

/**
 * What to do when the CompleteStateObservable emits a value:
 *  INFO: except for 'cache-all', the CompleteStateObservable doesn't care of notifications different than 'next', 'complete' or 'error'
 */
export type TCompleteStateObservableMode =
  'once' // (default) does not cache any values => after the final state ('complete' or 'error'), no observers will ever receive a value ('next')
  | 'uniq' // does not cache any values => after the final state, throws an error if a new observer observes 'next', 'complete' or 'error'.
  // | 'every' // when a new observer starts observing this observable, send every values until the final state. Every observer will receive the whole list of own emitted notifications.
    // kind of 'cache' but forces the regeneration of the values
  | 'cache' // caches own notifications ('next', 'complete' and 'error'). Every observer will receive the whole list of own emitted notifications
  | 'cache-final-state' // caches 'complete' or 'error' notification. Every observer will receive this final state notification
  | 'cache-all' // caches all notifications (including ones with a different name than 'next', 'complete' and 'error'). Every observer will receive the whole list of all emitted notifications
  ;
export type TCompleteStateObservableState =
  'emitting' // may emit data though 'next'
  | 'complete' // context.complete() called, cannot emit anymore data
  | 'error' // context.error(err) called, cannot emit anymore data
  ;

export interface ICompleteStateObservableOptions {
  mode?: TCompleteStateObservableMode; // default: 'once'
}

export type ICompleteStateObservableKeyValueMapGeneric<T> = {
  'next': T;
  'complete': void;
  'error': any;
};


export type CompleteStateKeyValueMapConstraint<T, TKVMap extends object> = KeyValueMapConstraint<TKVMap, ICompleteStateObservableKeyValueMapGeneric<T>>;

// what should emit an Observable with a similar behaviour of a CompleteStateObservable
export type TCompleteStateObservableLikeNotifications<T> = KeyValueMapToNotifications<ICompleteStateObservableKeyValueMapGeneric<T>>;

export interface ICompleteStateObservableHook<T, TKVMap extends CompleteStateKeyValueMapConstraint<T, TKVMap>> extends TNotificationsObservableHook<TKVMap> {
}


export type TCompleteStateObservableCreateCallback<T, TKVMap extends CompleteStateKeyValueMapConstraint<T, TKVMap>> = ((context: ICompleteStateObservableContext<T, TKVMap>) => (ICompleteStateObservableHook<T, TKVMap> | void));

export type TCompleteStateObservableConstructorArgs<T, TKVMap extends CompleteStateKeyValueMapConstraint<T, TKVMap>> =
  [TCompleteStateObservableCreateCallback<T, TKVMap>?, ICompleteStateObservableOptions?];



export interface ICompleteStateObservableConstructor {
  new<T, TKVMap extends CompleteStateKeyValueMapConstraint<T, TKVMap> = ICompleteStateObservableKeyValueMapGeneric<T>>(
    create?: TCompleteStateObservableCreateCallback<T, TKVMap>,
    options?: ICompleteStateObservableOptions,
  ): ICompleteStateObservable<T, TKVMap>;
}

export interface ICompleteStateObservableSoftConstructor {
  new<T>(
    create?: (context: ICompleteStateObservableKeyValueMapGeneric<T>) => (ICompleteStateObservableHook<T, ICompleteStateObservableKeyValueMapGeneric<T>> | void),
    options?: ICompleteStateObservableOptions,
  ): ICompleteStateObservable<T, ICompleteStateObservableKeyValueMapGeneric<T>>;
}

export interface ICompleteStateObservableTypedConstructor<T, TKVMap extends CompleteStateKeyValueMapConstraint<T, TKVMap>> {
  new(
    create?: TCompleteStateObservableCreateCallback<T, TKVMap>,
    options?: ICompleteStateObservableOptions,
  ): ICompleteStateObservable<T, TKVMap>;
}

// const a: ConstructorParameters<ICompleteStateObservableConstructor>;
// const b: ConstructorParameters<ICompleteStateObservableSoftConstructor>;

/**
 * A CompleteStateObservable represents an Observable with a final state (complete or errored).
 * This may be useful for streams with a non infinite list of values like iterables, promises, RXJS's Observables, etc...
 */
export interface ICompleteStateObservable<T, TKVMap extends CompleteStateKeyValueMapConstraint<T, TKVMap> = ICompleteStateObservableKeyValueMapGeneric<T>> extends INotificationsObservable<TKVMap> {
  readonly state: TCompleteStateObservableState;
  readonly mode: TCompleteStateObservableMode;
}


/*---------------------------*/

export interface ICompleteStateObservableContextConstructor {
  new<T, TKVMap extends CompleteStateKeyValueMapConstraint<T, TKVMap>>(observable: ICompleteStateObservable<T, TKVMap>): ICompleteStateObservableContext<T, TKVMap>;
}

export interface ICompleteStateObservableContext<T, TKVMap extends CompleteStateKeyValueMapConstraint<T, TKVMap> = ICompleteStateObservableKeyValueMapGeneric<T>> extends INotificationsObservableContext<TKVMap> {
  readonly observable: ICompleteStateObservable<T, TKVMap>;

  next(value: T): void; // emits Notification('next', value)
  complete(): void; // emits Notification('complete', void 0)
  error(error?: any): void; // emits Notification('error', error)

  clearCache(): void; // clears the cache
}


