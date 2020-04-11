import { GenerateFiniteStateObservableHookFromIterableWithPauseWorkflow } from '../iterable/hook-generators';
import { TFiniteStateObservableCreateCallback, TFiniteStateObservableMode } from '../../../types';
import { IFromReadableStreamObservableKeyValueMap, TFromReadableStreamObservableFinalState } from './types';


/**
 * Generates an Hook for a FiniteStateObservable, based on a ReadableStream:
 *  - when the Observable is freshly observed, starts reading the stream
 *  - when the ReadableStream emits a value, transfers it to the FiniteStateObservable using 'next'
 *  - while reading, if the observable is no more observed pause the reading
 *  - when all elements are read, emits a 'complete'
 *  - if the stream errors, emits an 'error'
 */
export function GenerateFiniteStateObservableHookFromReadableStreamWithPauseWorkflow<TValue>(
  stream: ReadableStream<TValue>
): TFiniteStateObservableCreateCallback<TValue, TFromReadableStreamObservableFinalState, TFiniteStateObservableMode, IFromReadableStreamObservableKeyValueMap<TValue>> {
  return GenerateFiniteStateObservableHookFromReadableStreamReaderWithPauseWorkflow<TValue>(stream.getReader());
}


export function GenerateFiniteStateObservableHookFromReadableStreamReaderWithPauseWorkflow<TValue>(
  reader: ReadableStreamReader<TValue>
): TFiniteStateObservableCreateCallback<TValue, TFromReadableStreamObservableFinalState, TFiniteStateObservableMode, IFromReadableStreamObservableKeyValueMap<TValue>> {
  return GenerateFiniteStateObservableHookFromIterableWithPauseWorkflow<AsyncIterable<TValue>>((async function * () {
    let result: ReadableStreamReadResult<TValue>;
    while (!(result = await reader.read()).done) {
      yield (result as ReadableStreamReadValueResult<TValue>).value;
    }
  })());
}
