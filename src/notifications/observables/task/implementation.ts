import {
  ITask, ITaskContext, ITaskContextConstructor, ITaskKeyValueMap, TTaskCreateCallback, TTaskState
} from './interfaces';
import { INotificationsObservableContext } from '../../core/notifications-observable/interfaces';
import {
  INotificationsObservableInternal, NotificationsObservable
} from '../../core/notifications-observable/implementation';
import { ConstructClassWithPrivateMembers } from '../../../misc/helpers/ClassWithPrivateMembers';
import { IsObject } from '../../../helpers';
import { IProgress, IProgressOptions } from '../../../misc/progress/interfaces';
import { IsProgress, Progress } from '../../../misc/progress/implementation';
import { TCancelStrategy } from '../../../misc/cancel-token/interfaces';



export const TASK_PRIVATE = Symbol('task-private');

export interface ITaskPrivate<TValue> {
  state: TTaskState;
  context: INotificationsObservableContext<ITaskKeyValueMap<TValue>>;
  result: TValue | any | undefined;
}

export interface ITaskInternal<TValue> extends ITask<TValue>, INotificationsObservableInternal<ITaskKeyValueMap<TValue>> {
  [TASK_PRIVATE]: ITaskPrivate<TValue>;
}

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
    && (TASK_PRIVATE in value);
}


/** METHODS **/

export function TaskGetState<TValue>(instance: ITask<TValue>): TTaskState {
  return (instance as ITaskInternal<TValue>)[TASK_PRIVATE].state;
}

export function TaskGetResult<TValue>(instance: ITask<TValue>): TValue | any | undefined {
  return (instance as ITaskInternal<TValue>)[TASK_PRIVATE].result;
}

export function TaskGetDone<TValue>(instance: ITask<TValue>): boolean {
  const privates: ITaskPrivate<TValue> = (instance as ITaskInternal<TValue>)[TASK_PRIVATE];
  return (privates.state === 'complete')
    || (privates.state === 'error')
    || (privates.state === 'cancel');
}


export function TaskStart<TValue>(instance: ITask<TValue>): void {
  const privates: ITaskPrivate<TValue> = (instance as ITaskInternal<TValue>)[TASK_PRIVATE];
  if (privates.state === 'await') {
    privates.state = 'run';
    privates.context.dispatch('start', void 0);
  } else if (privates.state === 'pause') {
    privates.state = 'run';
    privates.context.dispatch('resume', void 0);
  } else {
    throw new Error(`Cannot start a task in the state '${ privates.state }'`);
  }
}

export function TaskPause<TValue>(instance: ITask<TValue>): void {
  const privates: ITaskPrivate<TValue> = (instance as ITaskInternal<TValue>)[TASK_PRIVATE];
  if (privates.state === 'run') {
    privates.state = 'pause';
    privates.context.dispatch('pause', void 0);
  } else {
    throw new Error(`Cannot pause a task in the state '${ privates.state }'`);
  }
}

export function TaskResume<TValue>(instance: ITask<TValue>): void {
  const privates: ITaskPrivate<TValue> = (instance as ITaskInternal<TValue>)[TASK_PRIVATE];
  if (privates.state === 'pause') {
    privates.state = 'run';
    privates.context.dispatch('resume', void 0);
  } else {
    throw new Error(`Cannot resume a task in the state '${ privates.state }'`);
  }
}

export function TaskCancel<TValue>(instance: ITask<TValue>, reason?: any): void {
  const privates: ITaskPrivate<TValue> = (instance as ITaskInternal<TValue>)[TASK_PRIVATE];
  if (
    (privates.state === 'await')
    || (privates.state === 'run')
    || (privates.state === 'pause')
  ) {
    privates.state = 'cancel';
    privates.result = reason;
    privates.context.dispatch('cancel', reason);
  } else {
    throw new Error(`Cannot cancel a task in the state '${ privates.state }'`);
  }
}

export function TaskToPromise<TValue>(instance: ITask<TValue>, strategy?: TCancelStrategy): Promise<TValue> {
  return new Promise<TValue>((resolve: any, reject: any) => {
    const privates: ITaskPrivate<TValue> = (instance as ITaskInternal<TValue>)[TASK_PRIVATE];

    const onComplete = (value: TValue) => {
      resolve(value);
    };

    const onError = (error?: any) => {
      reject(error);
    };

    const onCancel = (reason?: any) => {

      switch (strategy) {
        case void 0:
        case 'never':
          break;
        case 'resolve':
          resolve();
          break;
        case 'reject':
          reject(reason);
          break;
        default:
          reject(new TypeError(`Unexpected strategy: ${ strategy }`));
          break;
      }

    };

    if (privates.state === 'complete') {
      onComplete(privates.result);
    } else if (privates.state === 'error') {
      onError(privates.result);
    } else if (privates.state === 'cancel') {
      onCancel(privates.result);
    } else {

      const clear = () => {
        completeListener.deactivate();
        errorListener.deactivate();
        cancelListener.deactivate();
      };

      const completeListener = instance.addListener('complete', () => {
        clear();
        onComplete(privates.result);
      });

      const errorListener = instance.addListener('error', (error: any) => {
        clear();
        onError(error);
      });

      const cancelListener = instance.addListener('cancel', (reason: any) => {
        clear();
        onCancel(reason);
      });

      completeListener.activate();
      errorListener.activate();
      cancelListener.activate();
    }
  });
}


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

export function TaskProgress<TValue>(instance: ITask<TValue>, progress?: IProgress | IProgressOptions | number, total?: number): void {
  const privates: ITaskPrivate<TValue> = (instance as ITaskInternal<TValue>)[TASK_PRIVATE];
  if (privates.state === 'run') {
    privates.context.dispatch('progress', IsProgress(progress) ? progress : new Progress(progress as any, total));
  } else {
    throw new Error(`Cannot call 'progress' when the task is in the state '${ privates.state }'`);
  }
}



/** CLASS **/

export class Task<TValue> extends NotificationsObservable<ITaskKeyValueMap<TValue>> implements ITask<TValue> {

  constructor(create: TTaskCreateCallback<TValue>) {
    let context: INotificationsObservableContext<ITaskKeyValueMap<TValue>>;
    super((_context: INotificationsObservableContext<ITaskKeyValueMap<TValue>>): void => {
      context = _context;
    });
    // @ts-ignore
    ConstructTask<TValue>(this, context, create);
  }

  get state(): TTaskState {
    return TaskGetState(this);
  }

  get result(): TValue | any | undefined {
    return TaskGetResult(this);
  }

  get done(): boolean {
    return TaskGetDone(this);
  }

  start(): this {
    TaskStart<TValue>(this);
    return this;
  }

  pause(): this {
    TaskPause<TValue>(this);
    return this;
  }

  resume(): this {
    TaskResume<TValue>(this);
    return this;
  }

  cancel(reason?: any): this {
    TaskCancel<TValue>(this, reason);
    return this;
  }

  toPromise(strategy?: TCancelStrategy): Promise<TValue> {
    return TaskToPromise<TValue>(this, strategy);
  }
}



/** ------------ CONTEXT ------------ **/

export const TASK_CONTEXT_PRIVATE = Symbol('task-context-private');

export interface ITaskContextPrivate<TValue> {
  task: ITask<TValue>;
}

export interface ITaskContextInternal<TValue> extends ITaskContext<TValue> {
  [TASK_CONTEXT_PRIVATE]: ITaskContextPrivate<TValue>;
}

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

export function NewTaskContext<TValue>(task: ITask<TValue>): ITaskContext<TValue> {
  ALLOW_TASK_CONTEXT_CONSTRUCT = true;
  const context: ITaskContext<TValue> = new ((TaskContext as unknown) as ITaskContextConstructor)<TValue>(task);
  ALLOW_TASK_CONTEXT_CONSTRUCT = false;
  return context;
}

/** METHODS **/

export function TaskContextNext<TValue>(instance: ITaskContext<TValue>, value: TValue): void {
  TaskNext<TValue>((instance as ITaskContextInternal<TValue>)[TASK_CONTEXT_PRIVATE].task, value);
}

export function TaskContextComplete<TValue>(instance: ITaskContext<TValue>): void {
  TaskComplete<TValue>((instance as ITaskContextInternal<TValue>)[TASK_CONTEXT_PRIVATE].task);
}

export function TaskContextError<TValue>(instance: ITaskContext<TValue>, error?: any): void {
  TaskError<TValue>((instance as ITaskContextInternal<TValue>)[TASK_CONTEXT_PRIVATE].task, error);
}

export function TaskContextProgress<TValue>(instance: ITaskContext<TValue>, progress?: IProgress | IProgressOptions | number, total?: number): void {
  TaskProgress<TValue>((instance as ITaskContextInternal<TValue>)[TASK_CONTEXT_PRIVATE].task, progress, total);
}

export function TaskContextUntilRun<TValue>(instance: ITaskContext<TValue>, callback: (this: ITaskContext<TValue>) => void): void {
  if (instance.task.state === 'run') {
    callback.call(instance);
  } else {
    const run = () => {
      startListener.deactivate();
      resumeListener.deactivate();
      callback.call(instance);
    };

    const startListener = instance.task.addListener('start', run);
    const resumeListener = instance.task.addListener('resume', run);

    startListener.activate();
    resumeListener.activate();
  }
}

export function TaskContextNextUntilRun<TValue>(instance: ITaskContext<TValue>, value: TValue): void {
  return TaskContextUntilRun<TValue>(instance, () => TaskContextNext<TValue>(instance, value));
}

export function TaskContextCompleteUntilRun<TValue>(instance: ITaskContext<TValue>): void {
  return TaskContextUntilRun<TValue>(instance, () => TaskContextComplete<TValue>(instance));
}

export function TaskContextErrorUntilRun<TValue>(instance: ITaskContext<TValue>, error?: any): void {
  return TaskContextUntilRun<TValue>(instance, () => TaskContextError<TValue>(instance, error));
}

export function TaskContextProgressUntilRun<TValue>(instance: ITaskContext<TValue>, progress?: IProgress | IProgressOptions | number, total?: number): void {
  return TaskContextUntilRun<TValue>(instance, () => TaskContextProgress<TValue>(instance, progress, total));
}

/** CLASS **/

export class TaskContext<TValue> implements ITaskContext<TValue> {

  constructor(task: ITask<TValue>) {
    ConstructTaskContext<TValue>(this, task);
  }

  get task(): ITask<TValue> {
    return ((this as unknown) as ITaskContextInternal<TValue>)[TASK_CONTEXT_PRIVATE].task;
  }

  next(value: TValue): void {
    return TaskContextNext<TValue>(this, value);
  }

  complete(): void {
    return TaskContextComplete<TValue>(this);
  }

  error(error?: any): void {
    return TaskContextError<TValue>(this, error);
  }

  progress(loaded: number, total?: number): void;
  progress(progress?: IProgress | IProgressOptions): void;
  progress(progress?: IProgress | IProgressOptions | number, total?: number): void {
    return TaskContextProgress<TValue>(this, progress, total);
  }

  untilRun(callback: (this: ITaskContext<TValue>) => void): void {
    return TaskContextUntilRun<TValue>(this, callback);
  }

  nextUntilRun(value: TValue): void {
    return TaskContextNextUntilRun<TValue>(this, value);
  }

  completeUntilRun(): void {
    return TaskContextCompleteUntilRun<TValue>(this);
  }

  errorUntilRun(error?: any): void {
    return TaskContextErrorUntilRun<TValue>(this, error);
  }

  progressUntilRun(loaded: number, total?: number): void;
  progressUntilRun(progress?: IProgress | IProgressOptions): void;
  progressUntilRun(progress?: IProgress | IProgressOptions | number, total?: number): void {
    return TaskContextProgressUntilRun<TValue>(this, progress, total);
  }
}
