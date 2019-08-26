/** TYPES **/
import { IProgress, IProgressOptions } from '../../../misc/progress/interfaces';
import { INotificationsObservable } from '../../core/notifications-observable/interfaces';


export type TTaskState = 'await' | 'run' | 'pause' | 'cancel' | 'complete' | 'error';

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

export interface ITask<TValue> extends INotificationsObservable<ITaskKeyValueMap<TValue>> {
  readonly state: TTaskState;
  readonly result: TValue | any | undefined;

  start(): void;

  pause(): void;

  resume(): void;

  cancel(reason?: any): void;

  toPromise(): Promise<TValue>;
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
}
