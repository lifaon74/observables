import { IProgress } from '../../../../../misc/progress/interfaces';
import { ITask } from '../../interfaces';
import { Task } from '../../implementation';
import { ITaskContext } from '../../context/interfaces';
import {
  TInferSyncOrAsyncIterableValueType, TSyncOrAsyncIterable
} from '../../../../../misc/helpers/iterators/interfaces';
import { IsAsyncIterable } from '../../../../../misc/helpers/iterators/is/is-async-iterable';
import { IPausableIteration, PausableIteration } from '../../../../../misc/helpers/iterators/pausable-iteration';


export interface ITaskFromIteratorValue<T> {
  value?: T;
  progress?: IProgress;
}

export type TTaskFromIteratorReturn<T> = ITaskFromIteratorValue<T> | void;

/**
 * Creates a Task from an Iterable.
 *  - the iterable slices the execution and may return a progress and a value
 */
export function taskFromIterable<TIterable extends TSyncOrAsyncIterable<TTaskFromIteratorReturn<any>>>(
  iterable: TIterable,
  isAsync: boolean = IsAsyncIterable(iterable),
): ITask<TInferSyncOrAsyncIterableValueType<TIterable>> {
  type TValue = TInferSyncOrAsyncIterableValueType<TIterable>;
  return new Task<TValue>((context: ITaskContext<TValue>) => {

    const iteration: IPausableIteration = PausableIteration<TIterable>(
      iterable,
      (value: any) => {
        context.next(value);
      },
      () => {
        clear();
        context.complete();
      },
      (reason: any) => {
        clear();
        context.error(reason);
      },
      isAsync
    );

    const clear = () => {
      iteration.pause();
      startListener.deactivate();
      resumeListener.deactivate();
      pauseListener.deactivate();
      abortListener.deactivate();
    };

    const run = () => {
      iteration.resume();
    };

    const pause = () => {
      iteration.pause();
    };

    const startListener = context.task.addListener('start', run);
    const resumeListener = context.task.addListener('resume', run);
    const pauseListener = context.task.addListener('pause', pause);
    const abortListener = context.task.addListener('abort', clear);

    startListener.activate();
    resumeListener.activate();
    pauseListener.activate();
    abortListener.activate();
  });
}
