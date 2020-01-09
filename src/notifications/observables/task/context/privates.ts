import { ITaskContext } from './interfaces';
import { ITask } from '../interfaces';

/** PRIVATES **/

export const TASK_CONTEXT_PRIVATE = Symbol('task-context-private');

export interface ITaskContextPrivate<TValue> {
  task: ITask<TValue>;
}

export interface ITaskContextInternal<TValue> extends ITaskContext<TValue> {
  [TASK_CONTEXT_PRIVATE]: ITaskContextPrivate<TValue>;
}
