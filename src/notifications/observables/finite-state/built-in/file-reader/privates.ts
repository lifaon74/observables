import {
  FileReaderObservableKeyValueMap, IFormatsToTypeMap, TFileReaderObservableFinalState, TFileReaderObservableMode,
  TFileReaderReadType
} from './types';
import { IFileReaderObservable } from './interfaces';
import { IFiniteStateObservablePrivatesInternal } from '../../privates';

/** PRIVATES **/

export const FILE_READER_OBSERVABLE_PRIVATE = Symbol('file-reader-observable-private');

export interface IFileReaderObservablePrivate<T extends TFileReaderReadType> {
  type: T;
  blob: Blob;
}

export interface IFileReaderObservablePrivatesInternal<T extends TFileReaderReadType> extends IFiniteStateObservablePrivatesInternal<IFormatsToTypeMap[T], TFileReaderObservableFinalState, TFileReaderObservableMode, FileReaderObservableKeyValueMap<T>> {
  [FILE_READER_OBSERVABLE_PRIVATE]: IFileReaderObservablePrivate<T>;
}

export interface IFileReaderObservableInternal<T extends TFileReaderReadType> extends IFileReaderObservablePrivatesInternal<T>, IFileReaderObservable<T> {
}
