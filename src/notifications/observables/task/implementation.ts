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

  create.call(instance, NewTaskContext(instance));
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

export function TaskToPromise<TValue>(instance: ITask<TValue>): Promise<TValue> {
  return new Promise<TValue>((resolve: any, reject: any) => {
    const privates: ITaskPrivate<TValue> = (instance as ITaskInternal<TValue>)[TASK_PRIVATE];

    const onComplete = (value: TValue) => {
      resolve(value);
    };

    const onError = (error?: any) => {
      reject(error);
    };

    const onCancel = (reason?: any) => {
      reject(reason);
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
    let _progress: IProgress;
    if (typeof progress === 'number') {
      _progress = new Progress({
        loaded: progress,
        total: total,
      });
    } else if (IsProgress(progress)) {
      _progress = progress;
    } else if (IsObject(progress)) {
      _progress = new Progress(progress);
    } else {
      throw new TypeError(`Expected Progress, object or number as progress`);
    }
    privates.context.dispatch('progress', _progress);
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

  start(): void {
    return TaskStart<TValue>(this);
  }

  pause(): void {
    return TaskPause<TValue>(this);
  }

  resume(): void {
    return TaskResume<TValue>(this);
  }

  cancel(reason?: any): void {
    return TaskCancel<TValue>(this, reason);
  }

  toPromise(): Promise<TValue> {
    return TaskToPromise<TValue>(this);
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
  TaskNext((instance as ITaskContextInternal<TValue>)[TASK_CONTEXT_PRIVATE].task, value);
}

export function TaskContextComplete<TValue>(instance: ITaskContext<TValue>): void {
  TaskComplete((instance as ITaskContextInternal<TValue>)[TASK_CONTEXT_PRIVATE].task);
}

export function TaskContextError<TValue>(instance: ITaskContext<TValue>, error?: any): void {
  TaskError((instance as ITaskContextInternal<TValue>)[TASK_CONTEXT_PRIVATE].task, error);
}

export function TaskContextProgress<TValue>(instance: ITaskContext<TValue>, progress?: IProgress | IProgressOptions | number, total?: number): void {
  TaskProgress((instance as ITaskContextInternal<TValue>)[TASK_CONTEXT_PRIVATE].task, progress, total);
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
    return TaskContextNext(this, value);
  }

  complete(): void {
    return TaskContextComplete(this);
  }

  error(error?: any): void {
    return TaskContextError(this, error);
  }

  progress(loaded: number, total?: number): void;
  progress(progress?: IProgress | IProgressOptions): void;
  progress(progress?: IProgress | IProgressOptions | number, total?: number): void {
    return TaskContextProgress(this, progress, total);
  }
}
