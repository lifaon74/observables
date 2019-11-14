import { IProgress, IProgressOptions } from '../../../misc/progress/interfaces';
import { INotificationsObservable } from '../../core/notifications-observable/interfaces';
import { TAbortStrategy } from '../../../misc/advanced-abort-controller/advanced-abort-signal/types';

/** TYPES **/

export type TTaskState =
  'await' // task is awaiting for a 'start'
  | 'run' // task is currently running
  | 'pause' // task execution is paused
  | 'cancel' // task is cancelled
  | 'complete' // task finished with success
  | 'error' // task errored
  ;

export interface ITaskKeyValueMap<TValue> {
  'start': void;
  'pause': void;
  'resume': void;
  'cancel': any;

  'progress': IProgress;
  'next': TValue;
  'complete': void;
  'error': any;
}

export type TTaskCreateCallback<TValue> = (this: ITask<TValue>, context: ITaskContext<TValue>) => void;

/** INTERFACES **/

export interface ITaskConstructor {
  new<TValue>(create: TTaskCreateCallback<TValue>): ITask<TValue>;
}

/**
 * A Task is an async process which potentially takes some time and may be fragmented.
 * For example, the following algorithm is a Task:
 *  1) fetch data
 *  2) decode data
 *  3) compute something from these data
 * A file copy, is a task too, etc...
 */
export interface ITask<TValue> extends INotificationsObservable<ITaskKeyValueMap<TValue>> {
  readonly state: TTaskState;
  readonly result: TValue | any | undefined;
  readonly done: boolean;

  start(): this;

  pause(): this;

  resume(): this;

  cancel(reason?: any): this;

  toPromise(strategy?: TAbortStrategy): Promise<TValue>;
}

/* CONTEXT */

export interface ITaskContextConstructor {
  // creates a TaskContext
  new<TValue>(task: ITask<TValue>): ITaskContext<TValue>;
}

export interface ITaskContext<TValue> {
  readonly task: ITask<TValue>;

  next(value: TValue): void; // emits Notification('next', value)
  complete(): void; // emits Notification('complete', void)
  error(error?: any): void; // emits Notification('error', void)

  progress(loaded: number, total?: number): void;

  progress(progress?: IProgress | IProgressOptions): void; // emits Notification('progress', progress)

  /**
   * Calls 'callback' when the task is running
   */
  untilRun(callback: (this: ITaskContext<TValue>) => void): void;

  nextUntilRun(value: TValue): void;

  completeUntilRun(): void;

  errorUntilRun(error?: any): void;

  progressUntilRun(loaded: number, total?: number): void;

  progressUntilRun(progress?: IProgress | IProgressOptions): void;
}
