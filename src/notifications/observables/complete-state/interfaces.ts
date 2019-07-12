import { KeyValueMapConstraint } from '../../core/interfaces';
import { IObservableHook } from '../../../core/observable/interfaces';
import {
  INotificationsObservable, INotificationsObservableContext
} from '../../core/notifications-observable/interfaces';

/**
 * What to do when the CompleteStateObservable emits a value:
 *  - once (default): doesnt cache any values => after the final state ('complete' or 'error'), no observers will ever receive a value ('next')
 *  - cache: caches own notifications ('next', 'complete' and 'error'). Every observer will receive the whole list of own emitted notifications
 *  - cache-final-state: caches  'complete' or 'error' notification. Every observer will receive this final state notification
 *  - cache-all: caches all notifications (including with a different name than 'next', 'complete' and 'error'). Every observer will receive the whole list of all emitted notifications
 *  - throw-after-complete-observers: doesnt cache any values => after the final state, throws an error if a new observer observing 'next', 'complete' or 'error' starts to observe this CompleteStateObservable.
 *
 *  INFO: except for 'cache-all', the CompleteStateObservable doesn't care of notifications different than 'next', 'complete' or 'error'
 */

export type TCompleteStateObservableMode = 'once' | 'cache' | 'cache-final-state' | 'cache-all' | 'throw-after-complete-observers';
export type TCompleteStateObservableState = 'emitting' | 'complete' | 'error' | 'cached';

export interface ICompleteStateObservableOptions {
  mode?: TCompleteStateObservableMode; // default: 'once'
}



export type CompleteStateObservableKeyValueMapGeneric<T> = {
  'next': T;
  'complete': void;
  'error': any;
  // [key: string]: any;
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
    create: (context: ICompleteStateObservableContext<T, TKVMap>) => (IObservableHook<T> | void),
    options: ICompleteStateObservableOptions,
  ): ICompleteStateObservable<T, TKVMap>;
}

// INFO double it due to an inference bug
export interface ICompleteStateObservableConstructor {
  new<T, TKVMap extends CompleteStateKeyValueMapConstraint<T, TKVMap> = CompleteStateObservableKeyValueMapGeneric<T>>(
    create?: (context: ICompleteStateObservableContext<T, TKVMap>) => (IObservableHook<T> | void),
    options?: ICompleteStateObservableOptions,
  ): ICompleteStateObservable<T, TKVMap>;
}

// const a: ConstructorParameters<ICompleteStateObservableConstructor>;

export interface ICompleteStateObservable<T, TKVMap extends CompleteStateKeyValueMapConstraint<T, TKVMap> = CompleteStateObservableKeyValueMapGeneric<T>> extends INotificationsObservable<TKVMap> {
  readonly state: TCompleteStateObservableState;
}


/*---------------------------*/

export interface ICompleteStateObservableContextConstructor {
  new<T, TKVMap extends CompleteStateKeyValueMapConstraint<T, TKVMap>>(observable: ICompleteStateObservable<T, TKVMap>): ICompleteStateObservableContext<T, TKVMap>;
}

export interface ICompleteStateObservableContext<T, TKVMap extends CompleteStateKeyValueMapConstraint<T, TKVMap> = CompleteStateObservableKeyValueMapGeneric<T>> extends INotificationsObservableContext<TKVMap> {
  readonly observable: ICompleteStateObservable<T, TKVMap>;

  next(value: T): void;
  complete(): void;
  error(error?: any): void;
}


