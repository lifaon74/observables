import {
  IFiniteStateObservable
} from '../../../../interfaces';
import { KeyValueMapToNotifications } from '../../../../../../core/notifications-observable/types';
import {
  IFiniteStateObservableExposedOptions, TFiniteStateObservableKeyValueMapGeneric, TFiniteStateObservableFinalState,
  TFiniteStateObservableMode
} from '../../../../types';

/** TYPES **/

export type TFromIterableObservableFinalState = TFiniteStateObservableFinalState;
export type TFromIterableObservableMode = TFiniteStateObservableMode;

export type IFromIterableObservableKeyValueMap<T> = TFiniteStateObservableKeyValueMapGeneric<T, TFromIterableObservableFinalState>;
export type TFromIterableObservableNotifications<T> = KeyValueMapToNotifications<IFromIterableObservableKeyValueMap<T>>;

export interface IFromIterableObservableOptions extends IFiniteStateObservableExposedOptions<TFromIterableObservableMode> {
}

export type TFromIterableObservableConstructorArgs<T> = [Iterable<T>, IFromIterableObservableOptions?];


/** INTERFACES **/

export interface IFromIterableObservableConstructor {
  new<T>(iterable: Iterable<T>, options?: IFromIterableObservableOptions): IFromIterableObservable<T>;
}

export interface IFromIterableObservable<T> extends IFiniteStateObservable<T, TFromIterableObservableFinalState, TFromIterableObservableMode, IFromIterableObservableKeyValueMap<T>> {
}
