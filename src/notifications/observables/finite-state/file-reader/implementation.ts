import {
  FileReaderObservableKeyValueMap, IFileReaderObservable, IFileReaderObservableOptions, IFormatsToTypeMap,
  TFileReaderObservableFinalState, TFileReaderObservableMode, TFileReaderReadType
} from './interfaces';
import { ConstructClassWithPrivateMembers } from '../../../../misc/helpers/ClassWithPrivateMembers';
import { IsObject } from '../../../../helpers';
import { FiniteStateObservable } from '../implementation';
import { GenerateFiniteStateObservableHookFromFileReader } from './hook-generators';


export const FILE_READER_OBSERVABLE_PRIVATE = Symbol('file-reader-observable-private');

export interface IFileReaderObservablePrivate<T extends TFileReaderReadType> {
  type: T;
  blob: Blob;
}

export interface IFileReaderObservableInternal<T extends TFileReaderReadType> extends IFileReaderObservable<T> {
  [FILE_READER_OBSERVABLE_PRIVATE]: IFileReaderObservablePrivate<T>;
}


export function ConstructFileReaderObservable<T extends TFileReaderReadType>(
  instance: IFileReaderObservable<T>,
  blob: Blob,
  options: IFileReaderObservableOptionsStrict<T>
): void {
  ConstructClassWithPrivateMembers(instance, FILE_READER_OBSERVABLE_PRIVATE);
  const privates: IFileReaderObservablePrivate<T> = (instance as IFileReaderObservableInternal<T>)[FILE_READER_OBSERVABLE_PRIVATE];

  if (blob instanceof Blob) {
    privates.blob = blob;
  } else {
    throw new TypeError(`Expected Blob as blob`);
  }

  privates.type = options.type;
}

export function IsFileReaderObservable(value: any): value is IFileReaderObservable<any> {
  return IsObject(value)
    && value.hasOwnProperty(FILE_READER_OBSERVABLE_PRIVATE as symbol);
}


export interface IFileReaderObservableOptionsStrict<T extends TFileReaderReadType> extends IFileReaderObservableOptions<T> {
  type: T;
}

export function NormalizeFileReaderObservableOptions<T extends TFileReaderReadType>(options: IFileReaderObservableOptions<T> = {}): IFileReaderObservableOptionsStrict<T> {
  const _options: IFileReaderObservableOptionsStrict<T> = {} as any;

  if (IsObject(options)) {
    if (options.type === void 0) {
      _options.type = 'arrayBuffer' as T;
    } else if (['dataURL', 'text', 'arrayBuffer'].includes(options.type)) {
      _options.type = options.type;
    } else {
      throw new TypeError(`Expected 'dataURL', 'text', or 'arrayBuffer' as FileReaderObservable.options.type`);
    }
  } else {
    throw new TypeError(`Expected object as FileReaderObservable.options`);
  }

  return _options;
}


export function FileReaderObservableType<T extends TFileReaderReadType>(instance: IFileReaderObservable<T>): T {
  return (instance as IFileReaderObservableInternal<T>)[FILE_READER_OBSERVABLE_PRIVATE].type;
}

export function FileReaderObservableBlob<T extends TFileReaderReadType>(instance: IFileReaderObservable<T>): Blob {
  return (instance as IFileReaderObservableInternal<T>)[FILE_READER_OBSERVABLE_PRIVATE].blob;
}


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
    return FileReaderObservableType<T>(this);
  }

  get blob(): Blob {
    return FileReaderObservableBlob<T>(this);
  }
}
