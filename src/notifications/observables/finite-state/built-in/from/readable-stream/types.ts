import {
  IFiniteStateObservableExposedOptions, TFiniteStateObservableFinalState, TFiniteStateObservableKeyValueMapGeneric,
  TFiniteStateObservableMode
} from '../../../types';
import { KeyValueMapToNotifications } from '../../../../../core/notifications-observable/types';

/** TYPES **/

export type TFromReadableStreamObservableFinalState = TFiniteStateObservableFinalState;
export type TFromReadableStreamObservableMode = TFiniteStateObservableMode;

export type IFromReadableStreamObservableKeyValueMap<T> = TFiniteStateObservableKeyValueMapGeneric<T, TFromReadableStreamObservableFinalState>;
export type TFromReadableStreamObservableNotifications<T> = KeyValueMapToNotifications<IFromReadableStreamObservableKeyValueMap<T>>;

export interface IFromReadableStreamObservableOptions extends IFiniteStateObservableExposedOptions<TFromReadableStreamObservableMode> {
}

export type TFromReadableStreamObservableConstructorArgs<T> = [ReadableStreamReader<T>, IFromReadableStreamObservableOptions?];
