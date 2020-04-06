import {
  IFiniteStateObservableExposedOptions, TFiniteStateObservableFinalState, TFiniteStateObservableKeyValueMapGeneric,
  TFiniteStateObservableMode
} from '../../../types';
import { IProgress } from '../../../../../../misc/progress/interfaces';
import { KeyValueMapToNotifications } from '../../../../../core/notifications-observable/types';

/** TYPES **/

export type TXHRObservableFinalState = TFiniteStateObservableFinalState;
export type TXHRObservableMode = TFiniteStateObservableMode/* | 'every'*/;

export interface IXHRObservableKeyValueMap extends TFiniteStateObservableKeyValueMapGeneric<Response, TXHRObservableFinalState> {
  'progress': IProgress;
  'upload-complete': void;
}

export type TXHRObservableNotifications = KeyValueMapToNotifications<IXHRObservableKeyValueMap>;

export interface IXHRObservableRequestInit extends Omit<RequestInit, 'signal'> {
}

export interface IXHRObservableOptions extends IFiniteStateObservableExposedOptions<TXHRObservableMode> {
}
