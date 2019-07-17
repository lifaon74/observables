import {
  FileReaderObservableKeyValueMap, IFileReaderObservable, IFileReaderObservableOptions, IFormatsToTypeMap,
  TFileReaderObservableNotifications,
  TFileReaderReadType
} from './interfaces';
import { ConstructClassWithPrivateMembers } from '../../../../misc/helpers/ClassWithPrivateMembers';
import { IsObject } from '../../../../helpers';
import { CompleteStateObservable } from '../implementation';
import { EventsObservable } from '../../events/events-observable/implementation';
import { Progress } from '../../../../misc/progress/implementation';
import { Notification } from '../../../core/notification/implementation';
import { IProgress } from '../../../../misc/progress/interfaces';
import { IFromIterableObservable } from '../from/iterable/interfaces';
import { BuildCompleteStateObservableHookBasedOnSharedFactoryFunction } from '../factory';

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
  options: IFileReaderObservableOptions<T> = {}
): void {
  ConstructClassWithPrivateMembers(instance, FILE_READER_OBSERVABLE_PRIVATE);
  const privates: IFileReaderObservablePrivate<T> = (instance as IFileReaderObservableInternal<T>)[FILE_READER_OBSERVABLE_PRIVATE];

  if (IsObject(options)) {
    if (options.type === void 0) {
      privates.type = 'arrayBuffer' as T;
    } else if (['dataURL', 'text', 'arrayBuffer'].includes(options.type)) {
      privates.type = options.type;
    } else {
      throw new TypeError(`Expected 'dataURL', 'text', or 'arrayBuffer' as FileReaderObservable.options.type`);
    }

    if (blob instanceof Blob) {
      privates.blob = blob;
    } else {
      throw new TypeError(`Expected Blob as blob`);
    }
  } else {
    throw new TypeError(`Expected object as FileReaderObservable.options`);
  }
}

export function IsFileReaderObservable(value: any): value is IFileReaderObservable<any> {
  return IsObject(value)
    && value.hasOwnProperty(FILE_READER_OBSERVABLE_PRIVATE as symbol);
}

function FileReaderReadHookBasedOnSharedFactoryFunction<T extends TFileReaderReadType>(emit: (value: TFileReaderObservableNotifications<T>) => void): () => void {
  const instance: IFromIterableObservable<T> = this;
  const privates: IFileReaderObservablePrivate<T> = (instance as IFileReaderObservableInternal<T>)[FILE_READER_OBSERVABLE_PRIVATE];

  const reader: FileReader = new FileReader();

  const readerObservable = new EventsObservable<FileReaderEventMap, FileReader>(reader)
    .on('load', () => {
      readerObservable.clearObservers();
      emit(new Notification<'next', IFormatsToTypeMap[T]>('next', reader.result as IFormatsToTypeMap[T]));
      emit(new Notification<'complete', void>('complete', void 0));
    })
    .on('error', () => {
      readerObservable.clearObservers();
      emit(new Notification<'error', any>('error', reader.error));
    })
    .on('progress', (event: ProgressEvent) => {
      emit(new Notification<'progress', IProgress>('progress', Progress.fromEvent(event)));
    })
  ;

  switch (privates.type) {
    case 'dataURL':
      reader.readAsDataURL(privates.blob);
      break;
    case 'text':
      reader.readAsText(privates.blob);
      break;
    case 'arrayBuffer':
      reader.readAsArrayBuffer(privates.blob);
      break;
    default:
      throw new TypeError(`Expected 'dataURL', 'text', or 'arrayBuffer' as type`);
  }

  return () => {
    if (reader.readyState === reader.LOADING) {
      reader.abort();
    }
    readerObservable.clearObservers();
  };
}


export function FileReaderObservableType<T extends TFileReaderReadType>(instance: IFileReaderObservable<T>): T {
  return (instance as IFileReaderObservableInternal<T>)[FILE_READER_OBSERVABLE_PRIVATE].type;
}

export function FileReaderObservableBlob<T extends TFileReaderReadType>(instance: IFileReaderObservable<T>): Blob {
  return (instance as IFileReaderObservableInternal<T>)[FILE_READER_OBSERVABLE_PRIVATE].blob;
}



export class FileReaderObservable<T extends TFileReaderReadType> extends CompleteStateObservable<IFormatsToTypeMap[T], FileReaderObservableKeyValueMap<T>> implements IFileReaderObservable<T> {

  constructor(blob: Blob, options?: IFileReaderObservableOptions<T>) {
    super(
      BuildCompleteStateObservableHookBasedOnSharedFactoryFunction<IFormatsToTypeMap[T], FileReaderObservableKeyValueMap<T>>(FileReaderReadHookBasedOnSharedFactoryFunction),
      options
    );
    ConstructFileReaderObservable(this, blob, options);
  }

  get type(): T {
    return FileReaderObservableType<T>(this);
  }

  get blob(): Blob {
    return FileReaderObservableBlob<T>(this);
  }
}
