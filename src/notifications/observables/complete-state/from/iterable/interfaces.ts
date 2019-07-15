import {
  CompleteStateObservableKeyValueMapGeneric, ICompleteStateObservable, ICompleteStateObservableOptions
} from '../../interfaces';

/** TYPES **/

export type FromIterableObservableEventsMap<T> = CompleteStateObservableKeyValueMapGeneric<T>;

export interface IFromIterableObservableOptions extends ICompleteStateObservableOptions {
}

export type TFromIterableObservableConstructorArgs<T> = [Iterable<T>, ICompleteStateObservableOptions?];


/** INTERFACES **/

export interface IFromIterableObservableConstructor {
  new<T>(iterable: Iterable<T>, options?: IFromIterableObservableOptions): IFromIterableObservable<T>;
}

export interface IFromIterableObservable<T> extends ICompleteStateObservable<T, FromIterableObservableEventsMap<T>> {
}
