import {
  IFiniteStateObservableKeyValueMapGeneric, IFiniteStateObservable,
  TFiniteStateObservableFinalState, TFiniteStateObservableMode, IFiniteStateObservableExposedOptions
} from '../../interfaces';
import { KeyValueMapToNotifications } from '../../../../core/notifications-observable/interfaces';

/** TYPES **/

export type TFromReadableStreamObservableFinalState = TFiniteStateObservableFinalState;
export type TFromReadableStreamObservableMode = TFiniteStateObservableMode;

export type IFromReadableStreamObservableKeyValueMap<T> = IFiniteStateObservableKeyValueMapGeneric<T, TFromReadableStreamObservableFinalState>;
export type TFromReadableStreamObservableNotifications<T> = KeyValueMapToNotifications<IFromReadableStreamObservableKeyValueMap<T>>;

export interface IFromReadableStreamObservableOptions extends IFiniteStateObservableExposedOptions<TFromReadableStreamObservableMode> {
}

export type TFromReadableStreamObservableConstructorArgs<T> = [ReadableStreamReader<T>, IFromReadableStreamObservableOptions?];


/** INTERFACES **/

export interface IFromReadableStreamObservableConstructor {
  new<T>(reader: ReadableStreamReader<T>, options?: IFromReadableStreamObservableOptions): IFromReadableStreamObservable<T>;
}

export interface IFromReadableStreamObservable<T> extends IFiniteStateObservable<T, TFromReadableStreamObservableFinalState, TFromReadableStreamObservableMode, IFromReadableStreamObservableKeyValueMap<T>> {
}
