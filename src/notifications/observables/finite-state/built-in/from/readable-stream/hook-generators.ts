

import { IFromReadableStreamObservableKeyValueMap, TFromReadableStreamObservableFinalState } from './interfaces';
import { GenerateFiniteStateObservableHookFromAsyncIterableWithPauseWorkflow } from '../iterable/hook-generators';
import { TFiniteStateObservableCreateCallback, TFiniteStateObservableMode } from '../../../types';


/**
 * Generates an Hook for a FiniteStateObservable, based on a ReadableStream:
 *  - when the Observable is freshly observed, starts reading the stream
 *  - when the ReadableStream emits a value, transfers it to the FiniteStateObservable using 'next'
 *  - while reading, if the observable is no more observed pause the reading
 *  - when all elements are read, emits a 'complete'
 *  - if the stream errors, emits an 'error'
 * @param stream
 */
export function GenerateFiniteStateObservableHookFromReadableStreamWithPauseWorkflow<TValue>(
  stream: ReadableStream<TValue>
): TFiniteStateObservableCreateCallback<TValue, TFromReadableStreamObservableFinalState, TFiniteStateObservableMode, IFromReadableStreamObservableKeyValueMap<TValue>> {
  return GenerateFiniteStateObservableHookFromReadableStreamReaderWithPauseWorkflow<TValue>(stream.getReader());
  // type TFinalState = TFromReadableStreamObservableFinalState;
  // type TMode = TFiniteStateObservableMode;
  // type TKVMap = IFromReadableStreamObservableKeyValueMap<TValue>;
  // return function (context: IFiniteStateObservableContext<TValue, TFinalState, TMode, TKVMap>) {
  //   let reader: ReadableStreamDefaultReader<TValue>;
  //   let state: 'paused' | 'iterating' | 'complete' = 'paused';
  //
  //   function pause() {
  //     if (state === 'iterating') {
  //       state = 'paused';
  //     }
  //   }
  //
  //   async function resume() {
  //     if (state === 'paused') {
  //       state = 'iterating';
  //       let result: IteratorResult<TValue>;
  //       try {
  //         while ((state === 'iterating') && !(result = await reader.read()).done) {
  //           context.next(result.value);
  //         }
  //         if (state === 'iterating') {
  //           context.complete();
  //         }
  //       } catch (error) {
  //         context.error(error);
  //       }
  //
  //       if (state === 'iterating') {
  //         state = 'complete';
  //       }
  //     }
  //   }
  //
  //   return {
  //     onObserved(): void {
  //       const instance: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap> = this;
  //       if (
  //         (reader === void 0)
  //         && (instance.observers.length === 1) // optional check
  //         && (instance.state === 'next') // optional check
  //       ) {
  //         reader = stream.getReader();
  //       }
  //
  //       if (instance.observers.length > 0) { // optional check
  //         resume();
  //       }
  //     },
  //     onUnobserved(): void {
  //       const instance: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap> = this;
  //       if (
  //         (!instance.observed)
  //         && (instance.state === 'next') // optional check
  //       ) {
  //         pause();
  //       }
  //     },
  //   };
  // };
}


export function GenerateFiniteStateObservableHookFromReadableStreamReaderWithPauseWorkflow<TValue>(
  reader: ReadableStreamReader<TValue>
): TFiniteStateObservableCreateCallback<TValue, TFromReadableStreamObservableFinalState, TFiniteStateObservableMode, IFromReadableStreamObservableKeyValueMap<TValue>> {
  return GenerateFiniteStateObservableHookFromAsyncIterableWithPauseWorkflow<TValue>((async function * () {
    let result: ReadableStreamReadResult<TValue>;
    while (!(result = await reader.read()).done) {
      yield result.value;
    }
  })());
}
