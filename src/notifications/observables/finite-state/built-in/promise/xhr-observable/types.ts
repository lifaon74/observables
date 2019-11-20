import {
  IFiniteStateObservableExposedOptions, TFiniteStateObservableFinalState, TFiniteStateObservableKeyValueMapGeneric,
  TFiniteStateObservableMode
} from '../../../types';
import { IProgress } from '../../../../../../misc/progress/interfaces';
import { KeyValueMapToNotifications } from '../../../../../core/notifications-observable/types';

/** TYPES **/

export type TXHRObservableFinalState = TFiniteStateObservableFinalState | 'abort';
export type TXHRObservableMode = TFiniteStateObservableMode | 'every';

export interface IXHRObservableKeyValueMap extends TFiniteStateObservableKeyValueMapGeneric<Response, TXHRObservableFinalState> {
  'progress': IProgress;
  'abort': any;
  'upload-complete': void;
}

export type TXHRObservableNotifications = KeyValueMapToNotifications<IXHRObservableKeyValueMap>;

export interface IXHRObservableOptions extends IFiniteStateObservableExposedOptions<TXHRObservableMode> {
}
