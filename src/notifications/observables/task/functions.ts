import { ITask } from './interfaces';
import { IProgress } from '../../../misc/progress/interfaces';
import { ITaskInternal, ITaskPrivate, TASK_PRIVATE } from './privates';

/** FUNCTIONS **/

export function TaskNext<TValue>(instance: ITask<TValue>, value: TValue): void {
  const privates: ITaskPrivate<TValue> = (instance as ITaskInternal<TValue>)[TASK_PRIVATE];
  if (privates.state === 'run') {
    privates.result = value;
    privates.context.dispatch('next', value);
  } else {
    throw new Error(`Cannot call 'next' when the task is in the state '${ privates.state }'`);
  }
}

export function TaskComplete<TValue>(instance: ITask<TValue>): void {
  const privates: ITaskPrivate<TValue> = (instance as ITaskInternal<TValue>)[TASK_PRIVATE];
  if (privates.state === 'run') {
    privates.state = 'complete';
    privates.context.dispatch('complete', void 0);
  } else {
    throw new Error(`Cannot call 'complete' when the task is in the state '${ privates.state }'`);
  }
}

export function TaskError<TValue>(instance: ITask<TValue>, error?: any): void {
  const privates: ITaskPrivate<TValue> = (instance as ITaskInternal<TValue>)[TASK_PRIVATE];
  if (privates.state === 'run') {
    privates.state = 'error';
    privates.result = error;
    privates.context.dispatch('error', error);
  } else {
    throw new Error(`Cannot call 'error' when the task is in the state '${ privates.state }'`);
  }
}

export function TaskProgress<TValue>(instance: ITask<TValue>, progress: IProgress): void {
  const privates: ITaskPrivate<TValue> = (instance as ITaskInternal<TValue>)[TASK_PRIVATE];
  if (privates.state === 'run') {
    privates.context.dispatch('progress', progress);
  } else {
    throw new Error(`Cannot call 'progress' when the task is in the state '${ privates.state }'`);
  }
}
