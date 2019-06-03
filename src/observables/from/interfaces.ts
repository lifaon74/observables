import { IObservable, IObservableContext, IObservableHook } from '../../core/observable/interfaces';


/**
 * What to do when a FromObservable is 'complete' (has nothing more to emits)
 *  - noop: do nothing
 *  - cache: keeps in cache all emitted values and re-emits them each time an Observer observes this Observable
 *  - clear: removes all its observers
 *  - clear-strict (default): removes all its observers and throws an error if a future Observer observes it.
 */
export type TFromObservableCompleteAction = 'noop' | 'cache' | 'clear' | 'clear-strict';

// export type TFromObservableState = 'awaiting' | 'emitting' | 'complete';


export type TFromObservableConstructorArgs<T> =
  [(context: IFromObservableContext<T>) => (IObservableHook<T> | void), TFromObservableCompleteAction]
  | [(context: IFromObservableContext<T>) => (IObservableHook<T> | void)]
  | [];


export interface IFromObservableConstructor {
  new<T>(create?: (context: IFromObservableContext<T>) => (IObservableHook<T> | void), onCompleteAction?: TFromObservableCompleteAction): IFromObservable<T>;
}

export interface IFromObservableBase {
  readonly complete: IObservable<void>;
}

export interface IFromObservable<T> extends IFromObservableBase, IObservable<T> {
}


/*---------------------------*/

export interface IFromObservableContextConstructor {
  new<T>(observable: IObservable<T>): IFromObservableContext<T>;
}

export interface IFromObservableContext<T> extends IObservableContext<T> {
  readonly observable: IFromObservable<T>;

  complete(): void;
}
