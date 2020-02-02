import {
  IFiniteStateObservableExposedOptions, TFiniteStateObservableFinalState, TFiniteStateObservableKeyValueMapGeneric,
  TFiniteStateObservableMode
} from '../../types';
import { KeyValueMapToNotifications } from '../../../../core/notifications-observable/types';
import { IProgress } from '../../../../../misc/progress/interfaces';

/** TYPES **/

export type TFileReaderObservableFinalState = TFiniteStateObservableFinalState;
export type TFileReaderObservableMode = TFiniteStateObservableMode;

export interface IFormatsToTypeMap {
  dataURL: string;
  text: string;
  arrayBuffer: ArrayBuffer;
}

export type TFileReaderReadType = keyof IFormatsToTypeMap;

export interface FileReaderObservableKeyValueMap<T extends TFileReaderReadType> extends TFiniteStateObservableKeyValueMapGeneric<IFormatsToTypeMap[T], TFileReaderObservableFinalState> {
  'error': DOMException;
  'progress': IProgress;
}

export type TFileReaderObservableNotifications<T extends TFileReaderReadType> = KeyValueMapToNotifications<FileReaderObservableKeyValueMap<T>>;
export type TFileReaderObservableConstructorArgs<T extends TFileReaderReadType> = [T, Blob, IFileReaderObservableOptions<T>?];

export interface IFileReaderObservableOptions<T extends TFileReaderReadType> extends IFiniteStateObservableExposedOptions<TFileReaderObservableMode> {
  type?: T;
}
