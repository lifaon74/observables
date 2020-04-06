import {
  IFiniteStateObservableExposedOptions, TFiniteStateObservableCreateCallback, TFiniteStateObservableFinalState,
  TFiniteStateObservableKeyValueMapGeneric, TFiniteStateObservableMode
} from '../../../types';
import { KeyValueMapToNotifications } from '../../../../../core/notifications-observable/types';
import { IFiniteStateObservableContext } from '../../../context/interfaces';
import {
  TInferSyncOrAsyncIterableValueType, TSyncOrAsyncIterable
} from '../../../../../../misc/helpers/iterators/interfaces';

/** TYPES **/

export type TFromIterableObservableFinalState = TFiniteStateObservableFinalState;
export type TFromIterableObservableMode = TFiniteStateObservableMode;

export type IFromIterableObservableKeyValueMap<TIterable extends TSyncOrAsyncIterable<any>> = TFiniteStateObservableKeyValueMapGeneric<TInferSyncOrAsyncIterableValueType<TIterable>, TFromIterableObservableFinalState>;

export type TFromIterableObservableNotifications<TIterable extends TSyncOrAsyncIterable<any>> = KeyValueMapToNotifications<IFromIterableObservableKeyValueMap<TIterable>>;


export interface IFromIterableObservableOptions extends IFiniteStateObservableExposedOptions<TFromIterableObservableMode> {
  isAsync?: boolean;
}

export type TFromIterableObservableConstructorArgs<TIterable extends TSyncOrAsyncIterable<any>> = [TIterable, IFromIterableObservableOptions?];

export type TFromIterableObservableCreateCallback<TIterable extends (Iterable<any> | AsyncIterable<any>)> = TFiniteStateObservableCreateCallback<TInferSyncOrAsyncIterableValueType<TIterable>,
  TFromIterableObservableFinalState,
  TFiniteStateObservableMode,
  IFromIterableObservableKeyValueMap<TIterable>>;

export type TFromIterableObservableCreateCallbackContext<TIterable extends (Iterable<any> | AsyncIterable<any>)> = IFiniteStateObservableContext<TInferSyncOrAsyncIterableValueType<TIterable>, TFromIterableObservableFinalState, TFiniteStateObservableMode, IFromIterableObservableKeyValueMap<TIterable>>;


