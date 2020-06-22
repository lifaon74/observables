import { IProgress } from '../../../../../misc/progress/interfaces';
import { ITask } from '../../interfaces';
import { Task } from '../../implementation';
import { ITaskContext } from '../../context/interfaces';
import {
  TInferSyncOrAsyncGeneratorFunctionValueType, TInferSyncOrAsyncGeneratorValueType, TInferSyncOrAsyncIterableValueType,
  TSyncOrAsyncIterable
} from '../../../../../misc/helpers/iterators/interfaces';
import { TTaskCreateCallback } from '../../types';
import { LinkTaskWithBasicHandlers } from '../helpers/link-task-with-basic-handlers';
import { IPausableIteration } from '../../../../../misc/helpers/iterators/pausable-iteration/interfaces';
import { PausableIteration } from '../../../../../misc/helpers/iterators/pausable-iteration/implementation';
import { IsAsyncIterable } from '../../../../../misc/helpers/iterators/is/is-async-iterable';


function taskFromIterableInternal<TIterable extends TSyncOrAsyncIterable<TTaskFromIterableReturn<any>>>(
  context: ITaskContext<TInferSyncOrAsyncIterableValueType<TIterable>>,
  iterable: TIterable,
): void {
  type TValue = TInferSyncOrAsyncIterableValueType<TIterable>;
  const iteration: IPausableIteration<TValue> = new PausableIteration<TValue>({
    iterable: iterable as TSyncOrAsyncIterable<TValue>,
    next: (value: TValue) => {
      context.next(value);
    },
    complete: () => {
      context.complete();
    },
    error: (reason: any) => {
      context.error(reason);
    }
  });

  let started: boolean = false;
  const isSyncIterable: boolean = !IsAsyncIterable(iterable);

  LinkTaskWithBasicHandlers(
    context.task,
    {
      run: () => {
        if (isSyncIterable) {
          if (!started) {
            started = false;
            setImmediate(() => iteration.run());
          }
        } else {
          iteration.run();
        }
      },
      pause: () => {
        iteration.pause();
      },
      done: () => {
        iteration.pause();
      },
    }
  );
}

// function taskFromIterableInternal<TIterable extends TSyncOrAsyncIterable<TTaskFromIterableReturn<any>>>(
//   context: ITaskContext<TInferSyncOrAsyncIterableValueType<TIterable>>,
//   iterable: TIterable,
//   isAsync: boolean = IsAsyncIterable(iterable),
// ): void {
//   const iteration: IPausableIteration = PausableIteration<TIterable>(
//     iterable,
//     (value: any) => {
//       context.next(value);
//     },
//     () => {
//       clear();
//       context.complete();
//     },
//     (reason: any) => {
//       clear();
//       context.error(reason);
//     },
//     isAsync
//   );
//
//   const clear = () => {
//     startListener.deactivate();
//     resumeListener.deactivate();
//     pauseListener.deactivate();
//     abortListener.deactivate();
//   };
//
//   const run = () => {
//     iteration.resume();
//   };
//
//   const startListener = context.task.addListener('start', run);
//   const resumeListener = context.task.addListener('resume', run);
//   const pauseListener = context.task.addListener('pause', () => {
//     iteration.pause();
//   });
//   const abortListener = context.task.addListener('abort', () => {
//     iteration.pause();
//     clear();
//   });
//
//   startListener.activate();
//   resumeListener.activate();
//   pauseListener.activate();
//   abortListener.activate();
// }

/** ITERABLE **/

export interface ITaskFromIterableValue<T> {
  value?: T;
  progress?: IProgress;
}

export type TTaskFromIterableReturn<T> = ITaskFromIterableValue<T> | void | never | undefined | unknown;


/**
 * Creates a Task from an Iterable.
 *  - the iterable slices the execution and may return a progress and a value
 */
export function taskFromIterable<TIterable extends TSyncOrAsyncIterable<TTaskFromIterableReturn<any>>>(
  iterable: TIterable,
): ITask<TInferSyncOrAsyncIterableValueType<TIterable>> {
  type TValue = TInferSyncOrAsyncIterableValueType<TIterable>;
  return new Task<TValue>((context: ITaskContext<TValue>) => {
    taskFromIterableInternal(context, iterable);
  });
}

/** GENERATOR **/


export type TTaskFromSyncOrAsyncGeneratorFunction<T = unknown, TReturn = any, TNext = unknown> =
  ((...args: Parameters<TTaskCreateCallback<T>>) => Generator<T, TReturn, TNext>)
  | ((...args: Parameters<TTaskCreateCallback<T>>) => AsyncGenerator<T, TReturn, TNext>);

export function taskFromGeneratorFunction<TGeneratorFunction extends TTaskFromSyncOrAsyncGeneratorFunction<TTaskFromIterableReturn<any>>>(
  generatorFunction: TGeneratorFunction
): ITask<TInferSyncOrAsyncGeneratorFunctionValueType<TGeneratorFunction>> {
  type TGenerator = ReturnType<TGeneratorFunction>;
  type TValue = TInferSyncOrAsyncGeneratorValueType<TGenerator>;

  return new Task<TValue>(function (context: ITaskContext<TValue>) {
    taskFromIterableInternal<TGenerator>(context as ITaskContext<any>, generatorFunction.call(this, context));
  });
}

