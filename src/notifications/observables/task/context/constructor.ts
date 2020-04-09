import { ITaskContext } from './interfaces';
import { ITask } from '../interfaces';
import { ITaskContextInternal, TASK_CONTEXT_PRIVATE } from './privates';
import { ConstructClassWithPrivateMembers } from '@lifaon/class-factory';

let ALLOW_TASK_CONTEXT_CONSTRUCT: boolean = false;

export function AllowTaskContextConstruct(allow: boolean): void {
  ALLOW_TASK_CONTEXT_CONSTRUCT = allow;
}

export function ConstructTaskContext<TValue>(instance: ITaskContext<TValue>, task: ITask<TValue>): void {
  if (ALLOW_TASK_CONTEXT_CONSTRUCT) {
    ConstructClassWithPrivateMembers(instance, TASK_CONTEXT_PRIVATE);
    (instance as ITaskContextInternal<TValue>)[TASK_CONTEXT_PRIVATE].task = task;
  } else {
    throw new TypeError('Illegal constructor');
  }
}
