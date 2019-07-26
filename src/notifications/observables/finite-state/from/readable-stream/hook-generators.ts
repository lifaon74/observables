import {
  IFiniteStateObservable, IFiniteStateObservableContext, TFiniteStateObservableCreateCallback,
  TFiniteStateObservableMode
} from '../../interfaces';

import { IFromReadableStreamObservableKeyValueMap, TFromReadableStreamObservableFinalState } from './interfaces';
import { GenerateFiniteStateObservableHookFromAsyncIterableWithPauseWorkflow } from '../iterable/hook-generators';

/**
 * Generates an Hook for a FiniteStateObservable, based on an async iterable:
 *  - when the Observable is freshly observed, creates an iterator from the iterable
 *  - iterates over the elements (emits 'next'). While iterating, if the observable is no more observed pause the iteration
 *  - when all elements are read, emits a 'complete'
 * @param stream
 */
export function GenerateFiniteStateObservableHookFromReadableStreamWithPauseWorkflow<TValue>(
  stream: ReadableStream<TValue>
): TFiniteStateObservableCreateCallback<TValue, TFromReadableStreamObservableFinalState, TFiniteStateObservableMode, IFromReadableStreamObservableKeyValueMap<TValue>> {
  return GenerateFiniteStateObservableHookFromAsyncIterableWithPauseWorkflow<TValue>((async function * () {
    const reader: ReadableStreamDefaultReader<TValue> = stream.getReader();
    let result: ReadableStreamReadResult<TValue>;
    while (!(result = await reader.read()).done) {
      yield result.value;
    }
  })());

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

