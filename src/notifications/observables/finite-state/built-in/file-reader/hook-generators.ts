import { IFiniteStateObservable } from '../../interfaces';
import { EventsObservable } from '../../../events/events-observable/implementation';
import { Notification } from '../../../../core/notification/implementation';
import { IProgress } from '../../../../../misc/progress/interfaces';
import { Progress } from '../../../../../misc/progress/implementation';
import { IEventsObservable } from '../../../events/events-observable/interfaces';
import { FiniteStateObservableHookDefaultOnUnobserved } from '../../helpers';
import {
  TFiniteStateObservableCreateCallback, TFiniteStateObservableFinalState, TFiniteStateObservableMode
} from '../../types';
import { IFiniteStateObservableContext } from '../../context/interfaces';
import {
  FileReaderObservableKeyValueMap, IFormatsToTypeMap, TFileReaderObservableFinalState, TFileReaderReadType
} from './types';

/**
 /**
 * Generates an Hook for a FiniteStateObservable, reading the content of a Blob:
 *  - when the Observable is freshly observed, creates a FileReader from 'blob' and read it with 'type'
 *  - emits 'progress' to follow the progression
 *  - emits 'next' with the read content, 'complete' if done with success, else 'error'
 *  - if the FiniteStateObservable is no more observed, abort the FileReader
 */
export function GenerateFiniteStateObservableHookFromFileReader<T extends TFileReaderReadType = 'arrayBuffer'>(
  blob: Blob,
  type: T = 'arrayBuffer' as T,
): TFiniteStateObservableCreateCallback<IFormatsToTypeMap[T], TFileReaderObservableFinalState, TFiniteStateObservableMode, FileReaderObservableKeyValueMap<T>> {
  type TValue = IFormatsToTypeMap[T];
  type TFinalState = TFiniteStateObservableFinalState;
  type TMode = TFiniteStateObservableMode;
  type TKVMap = FileReaderObservableKeyValueMap<T>;
  return function (context: IFiniteStateObservableContext<TValue, TFinalState, TMode, TKVMap>) {
    let reader: FileReader | null = null;
    let readerObservable: IEventsObservable<FileReaderEventMap, FileReader>;

    function clear() {
      if (reader !== null) {
        if (reader.readyState === reader.LOADING) {
          reader.abort();
        }
        readerObservable.clearObservers();
        reader = null;
      }
    }

    return {
      onObserved(): void {
        const instance: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap> = this as IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>;
        if (
          (reader === null)
          && (instance.observers.length === 1) // optional check
          && (instance.state === 'next') // optional check
        ) {
          reader = new FileReader();

          readerObservable = new EventsObservable<FileReaderEventMap, FileReader>(reader)
            .on('load', () => {
              if (reader !== null) {  // optional check
                context.next(reader.result as IFormatsToTypeMap[T]);
              }
              if (reader !== null) { // may append if onUnobserved into the 'next'
                clear();
                context.complete();
              }
            })
            .on('error', () => {
              if (reader !== null) { // optional check
                clear();
                context.error(reader.error);
              }
            })
            .on('progress', (event: ProgressEvent) => {
              context.emit(new Notification<'progress', IProgress>('progress', Progress.fromEvent(event, 'file-reader')));
            })
          ;

          switch (type) {
            case 'dataURL':
              reader.readAsDataURL(blob);
              break;
            case 'text':
              reader.readAsText(blob);
              break;
            case 'arrayBuffer':
              reader.readAsArrayBuffer(blob);
              break;
            default:
              throw new TypeError(`Expected 'dataURL', 'text', or 'arrayBuffer' as type`);
          }
        }
      },
      onUnobserved(): void {
        FiniteStateObservableHookDefaultOnUnobserved<TValue, TFinalState, TMode, TKVMap>(this as IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>, context, clear);
      },
    };
  };
}
