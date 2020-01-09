import { ITask } from './interfaces';
import { INotificationsObservableInternal } from '../../core/notifications-observable/privates';
import { ITaskKeyValueMap, TTaskState } from './types';
import { INotificationsObservableContext } from '../../core/notifications-observable/context/interfaces';

/** PRIVATES **/

export const TASK_PRIVATE = Symbol('task-private');

export interface ITaskPrivate<TValue> {
  state: TTaskState;
  context: INotificationsObservableContext<ITaskKeyValueMap<TValue>>;
  result: TValue | any | undefined;
}

export interface ITaskInternal<TValue> extends ITask<TValue>, INotificationsObservableInternal<ITaskKeyValueMap<TValue>> {
  [TASK_PRIVATE]: ITaskPrivate<TValue>;
}
