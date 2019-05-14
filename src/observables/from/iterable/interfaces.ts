import { IFromObservable, TFromObservableCompleteAction } from '../interfaces';

/** TYPES **/

export type TFromIterableObservableConstructorArgs<T> = [Iterable<T>, TFromObservableCompleteAction]
| [Iterable<T>];

/** INTERFACES **/

export interface IFromIterableObservableConstructor {
  new<T>(iterable: Iterable<T>, onComplete?: TFromObservableCompleteAction): IFromIterableObservable<T>;
}

export interface IFromIterableObservable<T> extends IFromObservable<T> {

}
