import { IFiniteStateObservable } from '../../../interfaces';
import {
  IFromIterableObservableKeyValueMap, TFromIterableObservableCreateCallback,
  TFromIterableObservableCreateCallbackContext, TFromIterableObservableFinalState, TFromIterableObservableMode
} from './types';
import {
  TInferSyncOrAsyncIterableValueType, TSyncOrAsyncIterable
} from '../../../../../../misc/helpers/iterators/interfaces';
import { IPausableIteration, PausableIteration } from '../../../../../../misc/helpers/iterators/pausable-iteration';

/** TYPES **/

type TGenerateFiniteStateObservableHookFromIterableWithPauseWorkflowInstance<TIterable extends TSyncOrAsyncIterable<any>> = IFiniteStateObservable<TInferSyncOrAsyncIterableValueType<TIterable>, TFromIterableObservableFinalState, TFromIterableObservableMode, IFromIterableObservableKeyValueMap<TIterable>>;


/** FUNCTION **/

/**
 * Generates an Hook for a FiniteStateObservable, based on an iterable (sync or async):
 *  - when the Observable is freshly observed, creates an iterator from the iterable
 *  - iterates over the elements (emits 'next'). While iterating, if the observable is no more observed pause the iteration
 *  - when all elements are read, emits a 'complete'
 */
export function GenerateFiniteStateObservableHookFromIterableWithPauseWorkflow<TIterable extends TSyncOrAsyncIterable<any>>(
  iterable: TIterable,
  isAsync?: boolean,
): TFromIterableObservableCreateCallback<TIterable> {
  return function (context: TFromIterableObservableCreateCallbackContext<TIterable>) {
    let iteration: IPausableIteration;

    return {
      onObserved(): void {
        const instance: TGenerateFiniteStateObservableHookFromIterableWithPauseWorkflowInstance<TIterable> = this as TGenerateFiniteStateObservableHookFromIterableWithPauseWorkflowInstance<TIterable>;
        if (
          (iteration === void 0)
          && (instance.observers.length === 1) // optional check
          && (instance.state === 'next') // optional check
        ) {
          iteration = PausableIteration<TIterable>(
            iterable,
            (value: any) => {
              context.next(value);
            },
            () => {
              context.complete();
            },
            (reason: any) => {
              context.error(reason);
            },
            isAsync
          );
        }

        if (instance.observers.length > 0) { // optional check
          iteration.resume();
        }
      },
      onUnobserved(): void {
        const instance: TGenerateFiniteStateObservableHookFromIterableWithPauseWorkflowInstance<TIterable> = this as TGenerateFiniteStateObservableHookFromIterableWithPauseWorkflowInstance<TIterable>;
        if (
          (!instance.observed)
          && (instance.state === 'next') // optional check
        ) {
          iteration.pause();
        }
      },
    };
  };
}
