import { IObservable, IObservableContext, IObservableHook } from '../../core/observable/interfaces';


/**
 * What to do when a FromObservable is 'complete' (has nothing more to emits) and new Observers start to observer it
 *  - never: any observers observing this observable after it has been completed won't receive any value
 *  - cache: keeps in cache all emitted values and re-emits them each time an Observer observes this Observable => all observers will receives all values
 *  - throw (default): throws an error if a future Observer observes it.
 */
export type TFromObservableCompleteNextObserversAction = 'never' | 'cache' | 'throw';

export interface IFromObservableCompleteOptions {
  nextObservers?: TFromObservableCompleteNextObserversAction;  // default: throw
  clear?: boolean; // default: false, if true, removes all its observers after completed
}

export type TFromObservableConstructorArgs<T> =
  [(context: IFromObservableContext<T>) => (IObservableHook<T> | void), IFromObservableCompleteOptions]
  | [(context: IFromObservableContext<T>) => (IObservableHook<T> | void)]
  | [];


export interface IFromObservableConstructor {
  new<T>(create?: (context: IFromObservableContext<T>) => (IObservableHook<T> | void), onCompleteOptions?: IFromObservableCompleteOptions): IFromObservable<T>;
}

export interface IFromObservableBase {
  readonly complete: boolean;
  readonly onComplete: IObservable<void>;
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
