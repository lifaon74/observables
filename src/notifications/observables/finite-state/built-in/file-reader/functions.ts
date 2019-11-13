import { IFileReaderObservableOptions, TFileReaderReadType } from './types';
import { IsObject } from '../../../../../helpers';

/** FUNCTIONS **/

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
