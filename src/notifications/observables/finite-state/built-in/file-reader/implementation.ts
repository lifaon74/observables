import { IFileReaderObservable } from './interfaces';
import { FiniteStateObservable } from '../../implementation';
import { GenerateFiniteStateObservableHookFromFileReader } from './hook-generators';
import {
  FileReaderObservableKeyValueMap, IFileReaderObservableOptions, IFormatsToTypeMap, TFileReaderObservableFinalState,
  TFileReaderObservableMode, TFileReaderReadType
} from './types';
import { FILE_READER_OBSERVABLE_PRIVATE, IFileReaderObservableInternal } from './privates';
import { IFileReaderObservableOptionsStrict, NormalizeFileReaderObservableOptions } from './functions';
import { ConstructFileReaderObservable } from './constructor';


/** METHODS **/

/* GETTERS/SETTERS */

export function FileReaderObservableGetType<T extends TFileReaderReadType>(instance: IFileReaderObservable<T>): T {
  return (instance as IFileReaderObservableInternal<T>)[FILE_READER_OBSERVABLE_PRIVATE].type;
}

export function FileReaderObservableGetBlob<T extends TFileReaderReadType>(instance: IFileReaderObservable<T>): Blob {
  return (instance as IFileReaderObservableInternal<T>)[FILE_READER_OBSERVABLE_PRIVATE].blob;
}

/** CLASS */

export class FileReaderObservable<T extends TFileReaderReadType> extends FiniteStateObservable<IFormatsToTypeMap[T], TFileReaderObservableFinalState, TFileReaderObservableMode, FileReaderObservableKeyValueMap<T>> implements IFileReaderObservable<T> {

  constructor(blob: Blob, options?: IFileReaderObservableOptions<T>) {
    const _options: IFileReaderObservableOptionsStrict<T> = NormalizeFileReaderObservableOptions<T>(options);
    super(
      GenerateFiniteStateObservableHookFromFileReader<T>(blob, _options.type),
      options
    );
    ConstructFileReaderObservable(this, blob, _options);
  }

  get type(): T {
    return FileReaderObservableGetType<T>(this);
  }

  get blob(): Blob {
    return FileReaderObservableGetBlob<T>(this);
  }
}
