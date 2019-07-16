import {
  FileReaderObservableKeyValueMap, IFileReaderObservable, IFileReaderObservableOptions, IFormatsToTypeMap,
  TFileReaderObservableNotifications,
  TFileReaderReadType
} from './interfaces';
import { ConstructClassWithPrivateMembers } from '../../../../misc/helpers/ClassWithPrivateMembers';
import { IsObject } from '../../../../helpers';
import { ICompleteStateObservableContext } from '../interfaces';
import { CompleteStateObservable } from '../implementation';
import { EventsObservable } from '../../events/events-observable/implementation';
import { Progress } from '../../../../misc/progress/implementation';
import { Notification } from '../../../core/notification/implementation';
import { IProgress } from '../../../../misc/progress/interfaces';
import { IObserver } from '../../../../core/observer/interfaces';
import { IEventsObservable } from '../../events/events-observable/interfaces';

export const FILE_READER_OBSERVABLE_PRIVATE = Symbol('file-reader-observable-private');

export interface IFileReaderObservablePrivate<T extends TFileReaderReadType> {
  context: ICompleteStateObservableContext<IFormatsToTypeMap[T], FileReaderObservableKeyValueMap<T>>,
  type: T;
  blob: Blob;
  readerObservable: IEventsObservable<FileReaderEventMap, FileReader> | null;
}

export interface IFileReaderObservableInternal<T extends TFileReaderReadType> extends IFileReaderObservable<T> {
  [FILE_READER_OBSERVABLE_PRIVATE]: IFileReaderObservablePrivate<T>;
}


export function ConstructFileReaderObservable<T extends TFileReaderReadType>(
  instance: IFileReaderObservable<T>,
  context: ICompleteStateObservableContext<IFormatsToTypeMap[T], FileReaderObservableKeyValueMap<T>>,
  blob: Blob,
  options: IFileReaderObservableOptions<T> = {}
): void {
  ConstructClassWithPrivateMembers(instance, FILE_READER_OBSERVABLE_PRIVATE);
  const privates: IFileReaderObservablePrivate<T> = (instance as IFileReaderObservableInternal<T>)[FILE_READER_OBSERVABLE_PRIVATE];
  privates.context = context;

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

    privates.readerObservable = null;
  } else {
    throw new TypeError(`Expected object as FileReaderObservable.options`);
  }
}

export function IsFileReaderObservable(value: any): value is IFileReaderObservable<any> {
  return IsObject(value)
    && value.hasOwnProperty(FILE_READER_OBSERVABLE_PRIVATE as symbol);
}


/**
 * Properly clear resources when Observable is complete or it has no more Observers
 * @param instance
 */
function FileReaderObservableClear<T extends TFileReaderReadType>(instance: IFileReaderObservable<T>): void {
  const privates: IFileReaderObservablePrivate<T> = (instance as IFileReaderObservableInternal<T>)[FILE_READER_OBSERVABLE_PRIVATE];
  if (privates.readerObservable !== null) {
    if (privates.readerObservable.target.readyState === privates.readerObservable.target.LOADING) {
      privates.readerObservable.target.abort();
      privates.context.clearCache();
    }
    privates.readerObservable.clearObservers();
    privates.readerObservable = null;
  }
}

function FileReaderRead<T extends TFileReaderReadType>(
  instance: IFileReaderObservable<T>,
  emit: (value: TFileReaderObservableNotifications<T>) => void
): () => void {
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

export function FileReaderObservableOnObserved<T extends TFileReaderReadType>(instance: IFileReaderObservable<T>): void {
  const privates: IFileReaderObservablePrivate<T> = (instance as IFileReaderObservableInternal<T>)[FILE_READER_OBSERVABLE_PRIVATE];

  const reader: FileReader = new FileReader();
  privates.readerObservable = new EventsObservable<FileReaderEventMap, FileReader>(reader)
    .on('load', () => {
      FileReaderObservableClear<T>(instance);
      privates.context.next(reader.result as IFormatsToTypeMap[T]);
      privates.context.complete();
    })
    .on('error', () => {
      FileReaderObservableClear<T>(instance);
      privates.context.error(reader.error);
    })
    .on('progress', (event: ProgressEvent) => {
      privates.context.dispatch('progress', Progress.fromEvent(event));
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
}

export function FileReaderObservableOnUnobserved<T extends TFileReaderReadType>(instance: IFileReaderObservable<T>,): void {
  if (!instance.observed) {
    FileReaderObservableClear<T>(instance);
  }
}

export function FileReaderObservableType<T extends TFileReaderReadType>(instance: IFileReaderObservable<T>): T {
  return (instance as IFileReaderObservableInternal<T>)[FILE_READER_OBSERVABLE_PRIVATE].type;
}

export function FileReaderObservableBlob<T extends TFileReaderReadType>(instance: IFileReaderObservable<T>): Blob {
  return (instance as IFileReaderObservableInternal<T>)[FILE_READER_OBSERVABLE_PRIVATE].blob;
}



export class FileReaderObservable<T extends TFileReaderReadType> extends CompleteStateObservable<IFormatsToTypeMap[T], FileReaderObservableKeyValueMap<T>> implements IFileReaderObservable<T> {

  constructor(blob: Blob, options?: IFileReaderObservableOptions<T>) {
    let context: ICompleteStateObservableContext<IFormatsToTypeMap[T], FileReaderObservableKeyValueMap<T>>;
    super((_context: ICompleteStateObservableContext<IFormatsToTypeMap[T], FileReaderObservableKeyValueMap<T>>) => {
      context = _context;
      return {
        onObserved: () => {
          FileReaderObservableOnObserved<T>(this);
        },
        onUnobserved: () => {
          FileReaderObservableOnUnobserved<T>(this);
        }
      };
    }, options);
    // @ts-ignore
    ConstructFileReaderObservable(this, context, blob, options);
  }

  get type(): T {
    return FileReaderObservableType<T>(this);
  }

  get blob(): Blob {
    return FileReaderObservableBlob<T>(this);
  }
}
