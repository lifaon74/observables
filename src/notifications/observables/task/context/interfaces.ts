import { IProgress } from '../../../../misc/progress/interfaces';
import { ITask } from '../interfaces';

/** INTERFACES **/

/* PRIVATE */
export interface ITaskContextConstructor {
  // creates a TaskContext
  new<TValue>(task: ITask<TValue>): ITaskContext<TValue>;
}

export interface ITaskContext<TValue> {
  readonly task: ITask<TValue>;

  next(value: TValue): void; // emits Notification('next', value)
  complete(): void; // emits Notification('complete', void)
  error(error?: any): void; // emits Notification('error', void)

  progress(progress: IProgress): void; // emits Notification('progress', progress)

  /**
   * Calls 'callback' when the task is running
   */
  untilRun(callback: (this: ITaskContext<TValue>) => void): void;

  nextUntilRun(value: TValue): void;

  completeUntilRun(): void;

  errorUntilRun(error?: any): void;

  progressUntilRun(progress: IProgress): void;
}
