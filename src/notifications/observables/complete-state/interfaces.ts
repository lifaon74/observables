import { KeyValueMapConstraint } from '../../core/interfaces';
import { IObservableHook } from '../../../core/observable/interfaces';
import {
  INotificationsObservable, INotificationsObservableContext
} from '../../core/notifications-observable/interfaces';

/**
 * What to do when the CompleteStateObservable emits a value:
 *  INFO: except for 'cache-all', the CompleteStateObservable doesn't care of notifications different than 'next', 'complete' or 'error'
 */
export type TCompleteStateObservableMode =
  'once' // (default) doesnt cache any values => after the final state ('complete' or 'error'), no observers will ever receive a value ('next')
  | 'cache' // caches own notifications ('next', 'complete' and 'error'). Every observer will receive the whole list of own emitted notifications
  | 'cache-final-state' // caches 'complete' or 'error' notification. Every observer will receive this final state notification
  | 'cache-all' // caches all notifications (including ones with a different name than 'next', 'complete' and 'error'). Every observer will receive the whole list of all emitted notifications
  | 'throw-after-complete-observers' // doesnt cache any values => after the final state, throws an error if a new observer observes 'next', 'complete' or 'error'.
  ;
export type TCompleteStateObservableState =
  'emitting' // may emit data though 'next'
  | 'complete' // context.complete() called, cannot emit anymore data
  | 'error' // context.error(err) called, cannot emit anymore data
  ;

export interface ICompleteStateObservableOptions {
  mode?: TCompleteStateObservableMode; // default: 'once'
}



export type CompleteStateObservableKeyValueMapGeneric<T> = {
  'next': T;
  'complete': void;
  'error': any;
};

export type CompleteStateKeyValueMapConstraint<T, TKVMap extends object> = KeyValueMapConstraint<TKVMap, CompleteStateObservableKeyValueMapGeneric<T>>;


// export type TCompleteStateObservableConstructorArgs<T, TKVMap extends CompleteStateKeyValueMapConstraint<T, TKVMap>> =
//   [(context: ICompleteStateObservableContext<T, TKVMap>) => (IObservableHook<T> | void), ICompleteStateObservableOptions]
//   | [(context: ICompleteStateObservableContext<T, TKVMap>) => (IObservableHook<T> | void)]
//   | [];

export type TCompleteStateObservableConstructorArgs<T, TKVMap extends CompleteStateKeyValueMapConstraint<T, TKVMap>> =
  [((context: ICompleteStateObservableContext<T, TKVMap>) => (IObservableHook<T> | void))?, ICompleteStateObservableOptions?];

export interface ICompleteStateObservableConstructor {
  new<T, TKVMap extends CompleteStateKeyValueMapConstraint<T, TKVMap> = CompleteStateObservableKeyValueMapGeneric<T>>(
    create?: (context: ICompleteStateObservableContext<T, TKVMap>) => (IObservableHook<T> | void),
    options?: ICompleteStateObservableOptions,
  ): ICompleteStateObservable<T, TKVMap>;
}

// INFO double it due to an inference bug
export interface ICompleteStateObservableConstructor {
  new<T, TKVMap extends CompleteStateKeyValueMapConstraint<T, TKVMap> = CompleteStateObservableKeyValueMapGeneric<T>>(
    create?: (context: ICompleteStateObservableContext<T, TKVMap>) => (IObservableHook<T> | void),
    options?: ICompleteStateObservableOptions,
  ): ICompleteStateObservable<T, TKVMap>;
}

export interface ICompleteStateObservableTypedConstructor<T, TKVMap extends CompleteStateKeyValueMapConstraint<T, TKVMap>> {
  new(
    create?: (context: ICompleteStateObservableContext<T, TKVMap>) => (IObservableHook<T> | void),
    options?: ICompleteStateObservableOptions,
  ): ICompleteStateObservable<T, TKVMap>;
}

// const a: ConstructorParameters<ICompleteStateObservableConstructor>;

/**
 * A CompleteStateObservable represents an Observable with a final state (complete or errored).
 * This may be useful for streams with a non infinite list of values like iterables, promises, RXJS's Observables, etc...
 */
export interface ICompleteStateObservable<T, TKVMap extends CompleteStateKeyValueMapConstraint<T, TKVMap> = CompleteStateObservableKeyValueMapGeneric<T>> extends INotificationsObservable<TKVMap> {
  readonly state: TCompleteStateObservableState;
  readonly mode: TCompleteStateObservableMode;
}


/*---------------------------*/

export interface ICompleteStateObservableContextConstructor {
  new<T, TKVMap extends CompleteStateKeyValueMapConstraint<T, TKVMap>>(observable: ICompleteStateObservable<T, TKVMap>): ICompleteStateObservableContext<T, TKVMap>;
}

export interface ICompleteStateObservableContext<T, TKVMap extends CompleteStateKeyValueMapConstraint<T, TKVMap> = CompleteStateObservableKeyValueMapGeneric<T>> extends INotificationsObservableContext<TKVMap> {
  readonly observable: ICompleteStateObservable<T, TKVMap>;

  next(value: T): void; // emits Notification('next', value)
  complete(): void; // emits Notification('complete', void 0)
  error(error?: any): void; // emits Notification('error', error)

  clearCache(): void; // clears the cache
}


