import { INotificationsObservable } from '../../core/notifications-observable/interfaces';
import { TAbortStrategy } from '../../../misc/advanced-abort-controller/advanced-abort-signal/types';
import { ITaskKeyValueMap, TTaskCreateCallback, TTaskState } from './types';

/** INTERFACES **/

// INFO: Task should extends FiniteStateObservable ?
// INFO: is Task really useful ? => may it be replaced by other kind of FiniteStateObservable ?

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

  abort(reason?: any): this;

  toPromise(abortStrategy?: TAbortStrategy): Promise<TValue>;
}


