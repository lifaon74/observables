import {
  IFiniteStateObservable, IFiniteStateObservableContext, TFiniteStateObservableCreateCallback,
  TFiniteStateObservableMode
} from '../../interfaces';
import {
  IFromIterableObservableKeyValueMap, TFromIterableObservableFinalState
} from './sync/interfaces';
import { IFromAsyncIterableObservableKeyValueMap, TFromAsyncIterableObservableFinalState } from './async/interfaces';

/**
 * Generates an Hook for a FiniteStateObservable, based on an iterable:
 *  - when the Observable is freshly observed, creates an iterator from the iterable
 *  - iterates over the elements (emits 'next'). While iterating, if the observable is no more observed pause the iteration
 *  - when all elements are read, emits a 'complete'
 * @param iterable
 */
export function GenerateFiniteStateObservableHookFromIterableWithPauseWorkflow<TValue>(
  iterable: Iterable<TValue>
): TFiniteStateObservableCreateCallback<TValue, TFromIterableObservableFinalState, TFiniteStateObservableMode, IFromIterableObservableKeyValueMap<TValue>> {
  type TFinalState = TFromIterableObservableFinalState;
  type TMode = TFiniteStateObservableMode;
  type TKVMap = IFromIterableObservableKeyValueMap<TValue>;
  return function (context: IFiniteStateObservableContext<TValue, TFinalState, TMode, TKVMap>) {
    let iterator: Iterator<TValue>;
    let state: 'paused' | 'iterating' | 'complete' = 'paused';

    function pause() {
      if (state === 'iterating') {
        state = 'paused';
      }
    }

    function resume() {
      if (state === 'paused') {
        state = 'iterating';
        let result: IteratorResult<TValue>;
        try {
          while ((state === 'iterating') && !(result = iterator.next()).done) {
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
    }

    return {
      onObserved(): void {
        const instance: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap> = this as IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>;
        if (
          (iterator === void 0)
          && (instance.observers.length === 1) // optional check
          && (instance.state === 'next') // optional check
        ) {
          iterator = iterable[Symbol.iterator]();
        }

        if (instance.observers.length > 0) { // optional check
          resume();
        }
      },
      onUnobserved(): void {
        const instance: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap> = this as IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>;
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


/**
 * Generates an Hook for a FiniteStateObservable, based on an async iterable:
 *  - when the Observable is freshly observed, creates an iterator from the iterable
 *  - iterates over the elements (emits 'next'). While iterating, if the observable is no more observed pause the iteration
 *  - when all elements are read, emits a 'complete'
 * @param iterable
 */
export function GenerateFiniteStateObservableHookFromAsyncIterableWithPauseWorkflow<TValue>(
  iterable: AsyncIterable<TValue>
): TFiniteStateObservableCreateCallback<TValue, TFromAsyncIterableObservableFinalState, TFiniteStateObservableMode, IFromAsyncIterableObservableKeyValueMap<TValue>> {
  type TFinalState = TFromAsyncIterableObservableFinalState;
  type TMode = TFiniteStateObservableMode;
  type TKVMap = IFromAsyncIterableObservableKeyValueMap<TValue>;
  return function (context: IFiniteStateObservableContext<TValue, TFinalState, TMode, TKVMap>) {
    let iterator: AsyncIterator<TValue>;
    let state: 'paused' | 'iterating' | 'complete' = 'paused';

    function pause() {
      if (state === 'iterating') {
        state = 'paused';
      }
    }

    async function resume() {
      if (state === 'paused') {
        state = 'iterating';
        let result: IteratorResult<TValue>;
        try {
          while ((state === 'iterating') && !(result = await iterator.next()).done) {
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
    }

    return {
      onObserved(): void {
        const instance: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap> = this as IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>;
        if (
          (iterator === void 0)
          && (instance.observers.length === 1) // optional check
          && (instance.state === 'next') // optional check
        ) {
          iterator = iterable[Symbol.asyncIterator]();
        }

        if (instance.observers.length > 0) { // optional check
          resume(); // cannot fail
        }
      },
      onUnobserved(): void {
        const instance: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap> = this as IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>;
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

