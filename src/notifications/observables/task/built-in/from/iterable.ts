import { IProgress } from '../../../../../misc/progress/interfaces';
import { ITask } from '../../interfaces';
import { Task } from '../../implementation';
import { ITaskContext } from '../../context/interfaces';
import {
  TInferSyncOrAsyncIterableIterator, TInferSyncOrAsyncIterableValueType, TInferSyncOrAsyncIteratorValueType,
  TSyncOrAsyncIterable, TSyncOrAsyncIterator
} from '../../../../../misc/helpers/iterators/interfaces';
import { IsAsyncIterable } from '../../../../../misc/helpers/iterators/is/is-async-iterable';


export interface ITaskFromIteratorValue<T> {
  value?: T;
  progress?: IProgress;
}

export type TTaskFromIteratorReturn<T> = ITaskFromIteratorValue<T> | void;

/**
 * Creates a Task from an Iterator.
 *  - the iterator slices the execution and may return a progress and a value
 *  INFO: prefer to use taskFromFiniteStateObservable
 */
export function taskFromIterator<TIterator extends TSyncOrAsyncIterator<TTaskFromIteratorReturn<any>>>(
  iterator: TIterator,
): ITask<TInferSyncOrAsyncIteratorValueType<TIterator>> {
  type TValue = TInferSyncOrAsyncIteratorValueType<TIterator>;
  return new Task<TValue>((context: ITaskContext<TValue>) => {

    const clear = () => {
      startListener.deactivate();
      resumeListener.deactivate();
      abortListener.deactivate();
    };

    const run = async () => {
      // ensures than 'run' is just called once
      startListener.deactivate();
      resumeListener.deactivate();

      while (context.task.state === 'run') {
        let result: IteratorResult<TTaskFromIteratorReturn<TValue>>;

        try {
          result = await iterator.next();
        } catch (error) {
          context.errorUntilRun(error);
          clear();
          return;
        }

        if (result.done) {
          context.completeUntilRun();
          clear();
          return;
        } else {
          if (result.value !== void 0) {
            if (result.value.value !== void 0) {
              context.nextUntilRun(result.value.value);
            }
            if (result.value.progress !== void 0) {
              context.progressUntilRun(result.value.progress);
            }
          }
        }
      }

      if (!context.task.done) {
        startListener.activate();
        resumeListener.activate();
      }
    };

    const startListener = context.task.addListener('start', run);
    const resumeListener = context.task.addListener('resume', run);
    const abortListener = context.task.addListener('abort', clear);

    startListener.activate();
    abortListener.activate();
  });
}


export function taskFromIterable<TIterable extends TSyncOrAsyncIterable<TTaskFromIteratorReturn<any>>>(
  iterable: TIterable,
  isAsync: boolean = IsAsyncIterable(iterable),
): ITask<TInferSyncOrAsyncIterableValueType<TIterable>> {
  return taskFromIterator<TInferSyncOrAsyncIterableIterator<TIterable>>(iterable[isAsync ? Symbol.asyncIterator : Symbol.iterator]) as unknown as ITask<TInferSyncOrAsyncIterableValueType<TIterable>>;
}

// export function taskFromAsyncIteratorWithCountProgress<T>(iterator: AsyncIterator<T>): ITask<T> {
//   return taskFromIterator<T>((async function * generator() {
//     let count: number = 0;
//     let result: IteratorResult<T>;
//     while (!(result = await iterator.next()).done) {
//       count++;
//       yield { progress: new Progress({ loaded: count, name: 'count' }) };
//     }
//   })());
// }
