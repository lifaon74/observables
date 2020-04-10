import { TTaskFromIterableReturn } from '../../../notifications/observables/task/built-in/from/iterable';
import { TInferSyncOrAsyncIterableValueType, TSyncOrAsyncIterable } from './interfaces';
import { IsAsyncIterable } from './is/is-async-iterable';

/**
 * Functions which automatically iterates over an iterable, with a pause/resume workflow
 */

export interface IPausableIteration {
  pause(): void;
  resume(): void;
}

export interface IPausableIterationWithDonePromise extends IPausableIteration {
  promise: Promise<void>;
}

export function PausableAsyncIteration<TValue>(
  iterator: AsyncIterator<TValue>,
  next: (value: TValue) => void,
  complete: () => void,
  error: (reason: any) => void
): IPausableIterationWithDonePromise {
  let state: 'paused' | 'running' | 'done' = 'paused';
  let pendingUntilRunning: (() => void)[] = [];

  const pause = (): void => {
    if (state === 'running') {
      state = 'paused';
    }
  };

  const resume = (): void => {
    if (state === 'paused') {
      state = 'running';
      while (pendingUntilRunning.length > 0) {
        (pendingUntilRunning.shift() as () => void)();
      }
    }
  };

  const untilRunning = () => {
    return new Promise<void>((resolve: () => void) => {
      pendingUntilRunning.push(resolve);
    });
  };

  const iterate = async () => {
    while (true) {
      while (state !== 'running') {
        await untilRunning();
      }

      let result: IteratorResult<TTaskFromIterableReturn<TValue>>;

      try {
        result = await iterator.next();
      } catch (_error) {
        while (state !== 'running') {
          await untilRunning();
        }
        state = 'done';
        error(_error);
        return;
      }

      if (result.done) {
        while (state !== 'running') {
          await untilRunning();
        }
        state = 'done';
        complete();
        return;
      } else {
        while (state !== 'running') {
          await untilRunning();
        }
        next((result as IteratorYieldResult<TValue>).value);
      }
    }
  };

  return {
    pause,
    resume,
    promise: iterate(),
  };
}

export function PausableSyncIteration<TValue>(
  iterator: Iterator<TValue>,
  next: (value: TValue) => void,
  complete: () => void,
  error: (reason: any) => void
): IPausableIteration {
  let state: 'paused' | 'running' | 'done' = 'paused';

  const pause = (): void => {
    if (state === 'running') {
      state = 'paused';
    }
  };

  let result: IteratorResult<TTaskFromIterableReturn<TValue>> | any;
  let resultState: 'awaiting' | 'error' | 'value' = 'awaiting';

  const resume = (): void => {
    if (state === 'paused') {
      state = 'running';

      while (state === 'running') {
        switch (resultState) {
          case 'error':   // an error was awaiting to be resolved
            state = 'done';
            error(result);
            return;
          case 'value':   // a value was awaiting to be resolved
            if (result.done) {
              complete();
              state = 'done';
              return;
            } else {
              next((result as IteratorYieldResult<TValue>).value);
              break;
            }
        }

        resultState = 'awaiting';
        try {
          result = iterator.next();
          resultState = 'value';
        } catch (_error) {
          result = _error;
          resultState = 'error';
        }
      }
    }
  };

  return {
    pause,
    resume,
  };
}


export function PausableIteration<TIterable extends TSyncOrAsyncIterable<any>>(
  iterable: TIterable,
  next: (value: TInferSyncOrAsyncIterableValueType<TIterable>) => void,
  complete: () => void,
  error: (reason: any) => void,
  isAsync: boolean = IsAsyncIterable(iterable),
): IPausableIteration {
  type TValue = TInferSyncOrAsyncIterableValueType<TIterable>;
  return isAsync
    ? PausableAsyncIteration<TValue>(iterable[Symbol.asyncIterator](), next, complete, error)
    : PausableSyncIteration<TValue>(iterable[Symbol.iterator](), next, complete, error);
}

