import { Observable as RXObservable } from 'rxjs';
import { IFiniteStateObservable } from '../../../interfaces';
import { KeyValueMapToNotifications } from '../../../../../core/notifications-observable/types';
import {
  IFiniteStateObservableExposedOptions, TFiniteStateObservableFinalState, TFiniteStateObservableKeyValueMapGeneric,
  TFiniteStateObservableMode
} from '../../../types';

/** TYPES **/

export type TFromRXJSObservableFinalState = TFiniteStateObservableFinalState;
export type TFromRXJSObservableMode = TFiniteStateObservableMode;

export type FromRXJSObservableKeyValueMap<T> = TFiniteStateObservableKeyValueMapGeneric<T, TFromRXJSObservableFinalState>;
export type TFromRXJSObservableNotifications<T> = KeyValueMapToNotifications<FromRXJSObservableKeyValueMap<T>>;

export interface IFromRXJSObservableOptions extends IFiniteStateObservableExposedOptions<TFromRXJSObservableMode> {
}

export type TFromRXJSObservableConstructorArgs<T> = [RXObservable<T>, IFromRXJSObservableOptions?];

/** INTERFACES **/

export interface IFromRXJSObservableConstructor {
  new<T>(rxObservable: RXObservable<T>, options?: IFromRXJSObservableOptions): IFromRXJSObservable<T>;
}

export interface IFromRXJSObservable<T> extends IFiniteStateObservable<T, TFromRXJSObservableFinalState, TFromRXJSObservableMode, FromRXJSObservableKeyValueMap<T>> {
}
