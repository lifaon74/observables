import {
  ICompleteStateObservableKeyValueMapGeneric, ICompleteStateObservable, ICompleteStateObservableOptions
} from '../../interfaces';
import { KeyValueMapToNotifications } from '../../../../core/notifications-observable/interfaces';

/** TYPES **/

export type IFromIterableObservableKeyValueMap<T> = ICompleteStateObservableKeyValueMapGeneric<T>;
export type TFromIterableObservableNotifications<T> = KeyValueMapToNotifications<IFromIterableObservableKeyValueMap<T>>;

export interface IFromIterableObservableOptions extends ICompleteStateObservableOptions {
}

export type TFromIterableObservableConstructorArgs<T> = [Iterable<T>, ICompleteStateObservableOptions?];


/** INTERFACES **/

export interface IFromIterableObservableConstructor {
  new<T>(iterable: Iterable<T>, options?: IFromIterableObservableOptions): IFromIterableObservable<T>;
}

export interface IFromIterableObservable<T> extends ICompleteStateObservable<T, IFromIterableObservableKeyValueMap<T>> {
}
