import {
  IFiniteStateObservableExposedOptions, TFiniteStateObservableCreateCallback, TFiniteStateObservableFinalState,
  TFiniteStateObservableKeyValueMapGeneric, TFiniteStateObservableMode
} from '../../../types';
import { KeyValueMapToNotifications } from '../../../../../core/notifications-observable/types';
import { IFiniteStateObservableContext } from '../../../context/interfaces';


/** TYPES **/

export type TSyncOrAsyncIterable<T = any> = Iterable<T> | AsyncIterable<T>;

export type TGetSyncOrAsyncIterableValueType<TIterable extends TSyncOrAsyncIterable<any>> = TIterable extends Iterable<infer TValue>
  ? TValue
  : (
    TIterable extends AsyncIterable<infer TValue>
      ? TValue
      : never
    );

export type TGetSyncOrAsyncIterableIterator<TIterable extends (Iterable<any> | AsyncIterable<any>)> = TIterable extends Iterable<infer TValue>
  ? Iterator<TValue>
  : TIterable extends AsyncIterable<infer TValue>
    ? AsyncIterator<TValue>
    : never;

export type TGetSyncOrAsyncIterableGenerator<TIterable extends (Iterable<any> | AsyncIterable<any>)> = () => TGetSyncOrAsyncIterableIterator<TIterable>;


export type TFromIterableObservableFinalState = TFiniteStateObservableFinalState;
export type TFromIterableObservableMode = TFiniteStateObservableMode;

export type IFromIterableObservableKeyValueMap<TIterable extends TSyncOrAsyncIterable<any>> = TFiniteStateObservableKeyValueMapGeneric<TGetSyncOrAsyncIterableValueType<TIterable>, TFromIterableObservableFinalState>;

export type TFromIterableObservableNotifications<TIterable extends TSyncOrAsyncIterable<any>> = KeyValueMapToNotifications<IFromIterableObservableKeyValueMap<TIterable>>;


export interface IFromIterableObservableOptions extends IFiniteStateObservableExposedOptions<TFromIterableObservableMode> {
  isAsync?: boolean;
}

export type TFromIterableObservableConstructorArgs<TIterable extends TSyncOrAsyncIterable<any>> = [TIterable, IFromIterableObservableOptions?];

export type TFromIterableObservableCreateCallback<TIterable extends (Iterable<any> | AsyncIterable<any>)> = TFiniteStateObservableCreateCallback<TGetSyncOrAsyncIterableValueType<TIterable>,
  TFromIterableObservableFinalState,
  TFiniteStateObservableMode,
  IFromIterableObservableKeyValueMap<TIterable>>;

export type TFromIterableObservableCreateCallbackContext<TIterable extends (Iterable<any> | AsyncIterable<any>)> = IFiniteStateObservableContext<TGetSyncOrAsyncIterableValueType<TIterable>, TFromIterableObservableFinalState, TFiniteStateObservableMode, IFromIterableObservableKeyValueMap<TIterable>>;


