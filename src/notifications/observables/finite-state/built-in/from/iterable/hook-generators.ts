import { IFiniteStateObservable } from '../../../interfaces';
import { IsAsyncIterable } from '../../../../../../helpers';
import {
  IFromIterableObservableKeyValueMap, TFromIterableObservableCreateCallback,
  TFromIterableObservableCreateCallbackContext, TFromIterableObservableFinalState, TFromIterableObservableMode,
  TGetSyncOrAsyncIterableGenerator, TGetSyncOrAsyncIterableIterator, TGetSyncOrAsyncIterableValueType
} from './types';

/** TYPES **/


export type TGenerateFiniteStateObservableHookFromIterableWithPauseWorkflowResumeFunction<TIterable extends (Iterable<any> | AsyncIterable<any>)> = TIterable extends Iterable<any>
  ? () => void
  : TIterable extends AsyncIterable<any>
    ? () => Promise<void>
    : never;

type TGenerateFiniteStateObservableHookFromIterableWithPauseWorkflowInstance<TIterable extends (Iterable<any> | AsyncIterable<any>)> = IFiniteStateObservable<TGetSyncOrAsyncIterableValueType<TIterable>, TFromIterableObservableFinalState, TFromIterableObservableMode, IFromIterableObservableKeyValueMap<TIterable>>;


/** FUNCTION **/

/**
 * Generates an Hook for a FiniteStateObservable, based on an iterable (sync or async):
 *  - when the Observable is freshly observed, creates an iterator from the iterable
 *  - iterates over the elements (emits 'next'). While iterating, if the observable is no more observed pause the iteration
 *  - when all elements are read, emits a 'complete'
 */
export function GenerateFiniteStateObservableHookFromIterableWithPauseWorkflow<TIterable extends (Iterable<any> | AsyncIterable<any>)>(
  iterable: TIterable,
  isAsync: boolean = IsAsyncIterable(iterable),
): TFromIterableObservableCreateCallback<TIterable> {

  type TValue = TGetSyncOrAsyncIterableValueType<TIterable>;

  return function (context: TFromIterableObservableCreateCallbackContext<TIterable>) {
    let iterator: TGetSyncOrAsyncIterableIterator<TIterable>;
    let state: 'paused' | 'iterating' | 'complete' = 'paused';

    const pause = (): void => {
      if (state === 'iterating') {
        state = 'paused';
      }
    };

    const generator: () => TGetSyncOrAsyncIterableGenerator<TIterable> = iterable[isAsync ? Symbol.asyncIterator : Symbol.iterator];

    let resume: TGenerateFiniteStateObservableHookFromIterableWithPauseWorkflowResumeFunction<TIterable>;

    if (isAsync) {
      resume = (async () => {
        if (state === 'paused') {
          state = 'iterating';
          let result: IteratorResult<TValue>;
          try {
            while ((state === 'iterating') && !(result = await (iterator as AsyncIterator<TValue>).next()).done) {
              context.next(result.value);
            }
            if (state === 'iterating') {
              context.complete();
            }
          } catch (error) {
            context.error(error);
          }

          if (state === 'iterating') {
            state = 'complete';
          }
        }
      }) as TGenerateFiniteStateObservableHookFromIterableWithPauseWorkflowResumeFunction<TIterable>;
    } else {
      resume = (() => {
        if (state === 'paused') {
          state = 'iterating';
          let result: IteratorResult<TValue>;
          try {
            while ((state === 'iterating') && !(result = (iterator as Iterator<TValue>).next()).done) {
              context.next(result.value);
            }
            if (state === 'iterating') {
              context.complete();
            }
          } catch (error) {
            context.error(error);
          }

          if (state === 'iterating') {
            state = 'complete';
          }
        }
      }) as TGenerateFiniteStateObservableHookFromIterableWithPauseWorkflowResumeFunction<TIterable>;
    }


    return {
      onObserved(): void {
        const instance: TGenerateFiniteStateObservableHookFromIterableWithPauseWorkflowInstance<TIterable> = this as TGenerateFiniteStateObservableHookFromIterableWithPauseWorkflowInstance<TIterable>;
        if (
          (iterator === void 0)
          && (instance.observers.length === 1) // optional check
          && (instance.state === 'next') // optional check
        ) {
          iterator = generator.call(iterable);
        }

        if (instance.observers.length > 0) { // optional check
          resume();
        }
      },
      onUnobserved(): void {
        const instance: TGenerateFiniteStateObservableHookFromIterableWithPauseWorkflowInstance<TIterable> = this as TGenerateFiniteStateObservableHookFromIterableWithPauseWorkflowInstance<TIterable>;
        if (
          (!instance.observed)
          && (instance.state === 'next') // optional check
        ) {
          pause();
        }
      },
    };
  };
}
