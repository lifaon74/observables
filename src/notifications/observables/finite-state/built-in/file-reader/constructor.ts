import { IFileReaderObservable } from './interfaces';
import { IsObject } from '../../../../../helpers';
import {
  FILE_READER_OBSERVABLE_PRIVATE, IFileReaderObservableInternal, IFileReaderObservablePrivate
} from './privates';
import { TFileReaderReadType } from './types';
import { IFileReaderObservableOptionsStrict } from './functions';
import { ConstructClassWithPrivateMembers } from '@lifaon/class-factory';

/** CONSTRUCTOR **/

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
