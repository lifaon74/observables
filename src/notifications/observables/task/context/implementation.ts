import { ITaskContext, ITaskContextConstructor } from './interfaces';
import { IProgress } from '../../../../misc/progress/interfaces';
import { ITask } from '../interfaces';
import { ITaskContextInternal, TASK_CONTEXT_PRIVATE } from './privates';
import { AllowTaskContextConstruct, ConstructTaskContext } from './constructor';
import { TaskComplete, TaskError, TaskNext, TaskProgress } from '../functions';

/** NEW **/

export function NewTaskContext<TValue>(task: ITask<TValue>): ITaskContext<TValue> {
  AllowTaskContextConstruct(true);
  const context: ITaskContext<TValue> = new ((TaskContext as unknown) as ITaskContextConstructor)<TValue>(task);
  AllowTaskContextConstruct(false);
  return context;
}

/** METHODS **/

/* GETTERS/SETTERS */

export function TaskContextGetTask<TValue>(instance: ITaskContext<TValue>): ITask<TValue> {
  return (instance as ITaskContextInternal<TValue>)[TASK_CONTEXT_PRIVATE].task;
}

/* METHODS */

export function TaskContextNext<TValue>(instance: ITaskContext<TValue>, value: TValue): void {
  TaskNext<TValue>((instance as ITaskContextInternal<TValue>)[TASK_CONTEXT_PRIVATE].task, value);
}

export function TaskContextComplete<TValue>(instance: ITaskContext<TValue>): void {
  TaskComplete<TValue>((instance as ITaskContextInternal<TValue>)[TASK_CONTEXT_PRIVATE].task);
}

export function TaskContextError<TValue>(instance: ITaskContext<TValue>, error?: any): void {
  TaskError<TValue>((instance as ITaskContextInternal<TValue>)[TASK_CONTEXT_PRIVATE].task, error);
}

export function TaskContextProgress<TValue>(instance: ITaskContext<TValue>, progress: IProgress): void {
  TaskProgress<TValue>((instance as ITaskContextInternal<TValue>)[TASK_CONTEXT_PRIVATE].task, progress);
}

export function TaskContextUntilRun<TValue>(instance: ITaskContext<TValue>, callback: (this: ITaskContext<TValue>) => void): void {
  if (instance.task.state === 'run') {
    callback.call(instance);
  } else if (!instance.task.done) {
    const run = () => {
      startListener.deactivate();
      resumeListener.deactivate();
      callback.call(instance);
    };

    const startListener = instance.task.addListener('start', run);
    const resumeListener = instance.task.addListener('resume', run);

    startListener.activate();
    resumeListener.activate();
  }
}

export function TaskContextNextUntilRun<TValue>(instance: ITaskContext<TValue>, value: TValue): void {
  return TaskContextUntilRun<TValue>(instance, () => TaskContextNext<TValue>(instance, value));
}

export function TaskContextCompleteUntilRun<TValue>(instance: ITaskContext<TValue>): void {
  return TaskContextUntilRun<TValue>(instance, () => TaskContextComplete<TValue>(instance));
}

export function TaskContextErrorUntilRun<TValue>(instance: ITaskContext<TValue>, error?: any): void {
  return TaskContextUntilRun<TValue>(instance, () => TaskContextError<TValue>(instance, error));
}

export function TaskContextProgressUntilRun<TValue>(instance: ITaskContext<TValue>, progress: IProgress): void {
  return TaskContextUntilRun<TValue>(instance, () => TaskContextProgress<TValue>(instance, progress));
}

/** CLASS **/

/* PRIVATE */
export class TaskContext<TValue> implements ITaskContext<TValue> {

  constructor(task: ITask<TValue>) {
    ConstructTaskContext<TValue>(this, task);
  }

  get task(): ITask<TValue> {
    return TaskContextGetTask<TValue>(this);
  }

  next(value: TValue): void {
    return TaskContextNext<TValue>(this, value);
  }

  complete(): void {
    return TaskContextComplete<TValue>(this);
  }

  error(error?: any): void {
    return TaskContextError<TValue>(this, error);
  }

  progress(progress: IProgress): void {
    return TaskContextProgress<TValue>(this, progress);
  }

  untilRun(callback: (this: ITaskContext<TValue>) => void): void {
    return TaskContextUntilRun<TValue>(this, callback);
  }

  nextUntilRun(value: TValue): void {
    return TaskContextNextUntilRun<TValue>(this, value);
  }

  completeUntilRun(): void {
    return TaskContextCompleteUntilRun<TValue>(this);
  }

  errorUntilRun(error?: any): void {
    return TaskContextErrorUntilRun<TValue>(this, error);
  }

  progressUntilRun(progress: IProgress): void {
    return TaskContextProgressUntilRun<TValue>(this, progress);
  }
}
