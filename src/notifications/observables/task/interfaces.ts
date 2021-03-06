import { INotificationsObservable } from '../../core/notifications-observable/interfaces';
import {
  ITaskKeyValueMap, ITaskToCancellablePromiseOptionsLastOnly, ITaskToCancellablePromiseOptionsNotLastOnly,
  ITaskToPromiseOptionsLastOnly,
  ITaskToPromiseOptionsNotLastOnly,
  TTaskCreateCallback, TTaskState
} from './types';
import { ICancellablePromise } from '../../../promises/cancellable-promise/interfaces';

/** INTERFACES **/

// INFO: Task should extends FiniteStateObservable ?
// INFO: is Task really useful ? => may it be replaced by other kind of FiniteStateObservable ?

/**
 * INFO
 *  Task seems different that FiniteStateObservable:
 *    - a Task is a PULL Source (starts by calling a method), where FiniteStateObservable is a PUSH Source (starts when observed)
 *    - a Task may emit an abort, where a FiniteStateObservable can't
 */


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

  toPromise(options?: ITaskToPromiseOptionsNotLastOnly): Promise<TValue[]>;
  toPromise(options: ITaskToPromiseOptionsLastOnly): Promise<TValue>;

  toCancellablePromise(options?: ITaskToCancellablePromiseOptionsNotLastOnly): ICancellablePromise<TValue[]>;
  toCancellablePromise(options: ITaskToCancellablePromiseOptionsLastOnly): ICancellablePromise<TValue>;
}


