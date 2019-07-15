import {
  CompleteStateObservableKeyValueMapGeneric, ICompleteStateObservable, ICompleteStateObservableOptions
} from '../interfaces';
import { IProgress } from '../../../../misc/progress/interfaces';

export interface IFormatsToTypeMap {
  dataURL: string;
  text: string;
  arrayBuffer: ArrayBuffer;
}

export type TFileReaderReadType = keyof IFormatsToTypeMap;


export interface FileReaderObservableEventsMap<T extends TFileReaderReadType> extends CompleteStateObservableKeyValueMapGeneric<IFormatsToTypeMap[T]> {
  'error': DOMException;
  'progress': IProgress;
}

export type TFileReaderObservableConstructorArgs<T extends TFileReaderReadType> =
  [T, Blob, ICompleteStateObservableOptions?];

export interface IFileReaderObservableOptions<T extends TFileReaderReadType> extends ICompleteStateObservableOptions {
  type?: T;
}

export interface IFileReaderObservableConstructor {
  new<T extends TFileReaderReadType = 'arrayBuffer'>(blob: Blob, options?: IFileReaderObservableOptions<T>): IFileReaderObservable<T>;
}

export interface IFileReaderObservable<T extends TFileReaderReadType = 'arrayBuffer'> extends ICompleteStateObservable<IFormatsToTypeMap[T], FileReaderObservableEventsMap<T>> {
  readonly type: T;
  readonly blob: Blob;
}

