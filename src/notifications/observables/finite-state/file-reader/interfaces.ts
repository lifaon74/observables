import {
  IFiniteStateObservableKeyValueMapGeneric, IFiniteStateObservable,
  TFiniteStateObservableFinalState, TFiniteStateObservableMode, IFiniteStateObservableExposedOptions
} from '../interfaces';
import { IProgress } from '../../../../misc/progress/interfaces';
import { KeyValueMapToNotifications } from '../../../core/notifications-observable/interfaces';

/** TYPES **/

export type TFileReaderObservableFinalState = TFiniteStateObservableFinalState;
export type TFileReaderObservableMode = TFiniteStateObservableMode;

export interface IFormatsToTypeMap {
  dataURL: string;
  text: string;
  arrayBuffer: ArrayBuffer;
}

export type TFileReaderReadType = keyof IFormatsToTypeMap;


export interface FileReaderObservableKeyValueMap<T extends TFileReaderReadType> extends IFiniteStateObservableKeyValueMapGeneric<IFormatsToTypeMap[T], TFileReaderObservableFinalState> {
  'error': DOMException;
  'progress': IProgress;
}

export type TFileReaderObservableNotifications<T extends TFileReaderReadType> = KeyValueMapToNotifications<FileReaderObservableKeyValueMap<T>>;
export type TFileReaderObservableConstructorArgs<T extends TFileReaderReadType> = [T, Blob, IFileReaderObservableOptions<T>?];

export interface IFileReaderObservableOptions<T extends TFileReaderReadType> extends IFiniteStateObservableExposedOptions<TFileReaderObservableMode> {
  type?: T;
}

/** INTERFACES **/

export interface IFileReaderObservableConstructor {
  new<T extends TFileReaderReadType = 'arrayBuffer'>(blob: Blob, options?: IFileReaderObservableOptions<T>): IFileReaderObservable<T>;
}

export interface IFileReaderObservable<T extends TFileReaderReadType = 'arrayBuffer'> extends IFiniteStateObservable<IFormatsToTypeMap[T], TFileReaderObservableFinalState, TFileReaderObservableMode, FileReaderObservableKeyValueMap<T>> {
  readonly type: T;
  readonly blob: Blob;
}

