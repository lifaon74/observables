import { ITask } from './interfaces';
import { IsObject } from '../../../helpers';
import { ITaskInternal, ITaskPrivate, TASK_PRIVATE } from './privates';
import { INotificationsObservableContext } from '../../core/notifications-observable/context/interfaces';
import { ITaskKeyValueMap, TTaskCreateCallback } from './types';
import { ConstructClassWithPrivateMembers } from '../../../misc/helpers/ClassWithPrivateMembers';
import { NewTaskContext } from './context/implementation';

/** CONSTRUCTOR **/

export function ConstructTask<TValue>(
  instance: ITask<TValue>,
  context: INotificationsObservableContext<ITaskKeyValueMap<TValue>>,
  create: TTaskCreateCallback<TValue>
): void {
  ConstructClassWithPrivateMembers(instance, TASK_PRIVATE);
  const privates: ITaskPrivate<TValue> = (instance as ITaskInternal<TValue>)[TASK_PRIVATE];
  privates.state = 'await';
  privates.context = context;
  privates.result = void 0;

  create.call(instance, NewTaskContext<TValue>(instance));
}

export function IsTask(value: any): value is ITask<any> {
  return IsObject(value)
    && value.hasOwnProperty(TASK_PRIVATE as symbol);
}
