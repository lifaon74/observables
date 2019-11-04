import {
  IFiniteStateObservableKeyValueMapGeneric, IFiniteStateObservable,
  TFiniteStateObservableFinalState, TFiniteStateObservableMode, IFiniteStateObservableExposedOptions
} from '../../../interfaces';
import { KeyValueMapToNotifications } from '../../../../../core/notifications-observable/types';

/** TYPES **/

export type TFromAsyncIterableObservableFinalState = TFiniteStateObservableFinalState;
export type TFromAsyncIterableObservableMode = TFiniteStateObservableMode;

export type IFromAsyncIterableObservableKeyValueMap<T> = IFiniteStateObservableKeyValueMapGeneric<T, TFromAsyncIterableObservableFinalState>;
export type TFromAsyncIterableObservableNotifications<T> = KeyValueMapToNotifications<IFromAsyncIterableObservableKeyValueMap<T>>;

export interface IFromAsyncIterableObservableOptions extends IFiniteStateObservableExposedOptions<TFromAsyncIterableObservableMode> {
}

export type TFromAsyncIterableObservableConstructorArgs<T> = [AsyncIterable<T>, IFromAsyncIterableObservableOptions?];


/** INTERFACES **/

export interface IFromAsyncIterableObservableConstructor {
  new<T>(iterable: AsyncIterable<T>, options?: IFromAsyncIterableObservableOptions): IFromAsyncIterableObservable<T>;
}

export interface IFromAsyncIterableObservable<T> extends IFiniteStateObservable<T, TFromAsyncIterableObservableFinalState, TFromAsyncIterableObservableMode, IFromAsyncIterableObservableKeyValueMap<T>> {
}
