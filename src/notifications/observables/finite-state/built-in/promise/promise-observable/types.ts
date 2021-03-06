import {
  IFiniteStateObservableExposedOptions, TFiniteStateObservableFinalState, TFiniteStateObservableKeyValueMapGeneric,
  TFiniteStateObservableMode
} from '../../../types';
import { IAdvancedAbortSignal } from '../../../../../../misc/advanced-abort-controller/advanced-abort-signal/interfaces';
import { KeyValueMapToNotifications } from '../../../../../core/notifications-observable/types';
import { IPromiseObservable } from './interfaces';
import { TNativePromiseLikeOrValue } from '../../../../../../promises/types/native';

/** TYPES **/

export type TPromiseObservableFinalState = TFiniteStateObservableFinalState;
export type TPromiseObservableMode = TFiniteStateObservableMode | 'every';

export interface IPromiseObservableKeyValueMap<T> extends TFiniteStateObservableKeyValueMapGeneric<T, TPromiseObservableFinalState> {
}

export type TPromiseObservableNotifications<T> = KeyValueMapToNotifications<IPromiseObservableKeyValueMap<T>>;

export interface IPromiseObservableOptions extends IFiniteStateObservableExposedOptions<TPromiseObservableMode> {
}

export interface IPromiseObservableFromPromiseOptions extends IPromiseObservableOptions {
  // signal?: IAdvancedAbortSignal;
}

export type TPromiseObservableFactory<T> = (this: IPromiseObservable<T>, signal: IAdvancedAbortSignal) => TNativePromiseLikeOrValue<T>;
