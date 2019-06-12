import { IFromObservable, IFromObservableCompleteOptions } from '../interfaces';

/** TYPES **/

export type TFromIterableObservableConstructorArgs<T> = [Iterable<T>, IFromObservableCompleteOptions]
  | [Iterable<T>];

/** INTERFACES **/

export interface IFromIterableObservableConstructor {
  new<T>(iterable: Iterable<T>, onCompleteOptions?: IFromObservableCompleteOptions): IFromIterableObservable<T>;
}

export interface IFromIterableObservable<T> extends IFromObservable<T> {

}
