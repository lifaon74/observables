import { IFiniteStateObservable, IFiniteStateObservableConstructor } from '../../interfaces';
import {
  FileReaderObservableKeyValueMap, IFileReaderObservableOptions, IFormatsToTypeMap, TFileReaderObservableFinalState,
  TFileReaderObservableMode, TFileReaderReadType
} from './types';


/** INTERFACES **/

export interface IFileReaderObservableConstructor extends Omit<IFiniteStateObservableConstructor, 'new'> {
  new<T extends TFileReaderReadType = 'arrayBuffer'>(blob: Blob, options?: IFileReaderObservableOptions<T>): IFileReaderObservable<T>;
}

export interface IFileReaderObservable<T extends TFileReaderReadType = 'arrayBuffer'> extends IFiniteStateObservable<IFormatsToTypeMap[T], TFileReaderObservableFinalState, TFileReaderObservableMode, FileReaderObservableKeyValueMap<T>> {
  readonly type: T;
  readonly blob: Blob;
}

