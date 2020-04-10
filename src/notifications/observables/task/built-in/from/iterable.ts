import { IProgress } from '../../../../../misc/progress/interfaces';
import { ITask } from '../../interfaces';
import { Task } from '../../implementation';
import { ITaskContext } from '../../context/interfaces';
import {
  TInferSyncOrAsyncGeneratorFunctionValueType, TInferSyncOrAsyncGeneratorValueType, TInferSyncOrAsyncIterableValueType,
  TSyncOrAsyncGenerator, TSyncOrAsyncIterable
} from '../../../../../misc/helpers/iterators/interfaces';
import { IsAsyncIterable } from '../../../../../misc/helpers/iterators/is/is-async-iterable';
import { IPausableIteration, PausableIteration } from '../../../../../misc/helpers/iterators/pausable-iteration';
import { TTaskCreateCallback } from '../../types';


function taskFromIterableInternal<TIterable extends TSyncOrAsyncIterable<TTaskFromIterableReturn<any>>>(
  context: ITaskContext<TInferSyncOrAsyncIterableValueType<TIterable>>,
  iterable: TIterable,
  isAsync: boolean = IsAsyncIterable(iterable),
): void {
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
}


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
  isAsync?: boolean,
): ITask<TInferSyncOrAsyncIterableValueType<TIterable>> {
  type TValue = TInferSyncOrAsyncIterableValueType<TIterable>;
  return new Task<TValue>((context: ITaskContext<TValue>) => {
    taskFromIterableInternal(context, iterable, isAsync);
  });
}

/** GENERATOR **/


export type TTaskFromSyncOrAsyncGeneratorFunction<T = unknown, TReturn = any, TNext = unknown> = ((...args: Parameters<TTaskCreateCallback<T>>) => Generator<T, TReturn, TNext>)
  | ((...args: Parameters<TTaskCreateCallback<T>>) => AsyncGenerator<T, TReturn, TNext>);

export function taskFromGeneratorFunction<TGeneratorFunction extends TTaskFromSyncOrAsyncGeneratorFunction<TTaskFromIterableReturn<any>>>(
  generatorFunction: TGeneratorFunction
): ITask<TInferSyncOrAsyncGeneratorFunctionValueType<TGeneratorFunction>> {
  type TGenerator = ReturnType<TGeneratorFunction>;
  type TValue = TInferSyncOrAsyncGeneratorValueType<TGenerator>;

  return new Task<TValue>(function(context: ITaskContext<TValue>) {
    taskFromIterableInternal<TGenerator>(context as ITaskContext<any>, generatorFunction.call(this, context));
  });
}

