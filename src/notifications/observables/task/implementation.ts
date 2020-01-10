import { ITask } from './interfaces';
import { NotificationsObservable } from '../../core/notifications-observable/implementation';
import { INotificationsObservableContext } from '../../core/notifications-observable/context/interfaces';
import { TAbortStrategy } from '../../../misc/advanced-abort-controller/advanced-abort-signal/types';
import { ITaskKeyValueMap, TTaskCreateCallback, TTaskState } from './types';
import { ITaskInternal, ITaskPrivate, TASK_PRIVATE } from './privates';
import { ConstructTask } from './constructor';


/** METHODS **/

/* GETTERS/SETTERS */

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
    || (privates.state === 'abort');
}


/* METHODS */

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

export function TaskAbort<TValue>(instance: ITask<TValue>, reason?: any): void {
  const privates: ITaskPrivate<TValue> = (instance as ITaskInternal<TValue>)[TASK_PRIVATE];
  if (
    (privates.state === 'await')
    || (privates.state === 'run')
    || (privates.state === 'pause')
  ) {
    privates.state = 'abort';
    privates.result = reason;
    privates.context.dispatch('abort', reason);
  } else {
    throw new Error(`Cannot abort a task in the state '${ privates.state }'`);
  }
}

export function TaskToPromise<TValue>(instance: ITask<TValue>, abortStrategy?: TAbortStrategy): Promise<TValue> {
  return new Promise<TValue>((resolve: any, reject: any) => {
    const privates: ITaskPrivate<TValue> = (instance as ITaskInternal<TValue>)[TASK_PRIVATE];

    const onComplete = (value: TValue) => {
      resolve(value);
    };

    const onError = (error?: any) => {
      reject(error);
    };

    const onAbort = (reason?: any) => {
      switch (abortStrategy) {
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
          reject(new TypeError(`Unexpected abortStrategy: ${ abortStrategy }`));
          break;
      }
    };

    switch (privates.state) {
      case 'complete':
        onComplete(privates.result);
        break;
      case 'error':
        onError(privates.result);
        break;
      case 'abort':
        onAbort(privates.result);
        break;
      default: {
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

        const cancelListener = instance.addListener('abort', (reason: any) => {
          clear();
          onAbort(reason);
        });

        completeListener.activate();
        errorListener.activate();
        cancelListener.activate();
      }
      break;
    }
  });
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

  abort(reason?: any): this {
    TaskAbort<TValue>(this, reason);
    return this;
  }

  // INFO: could return a CancellablePromise instead
  toPromise(abortStrategy?: TAbortStrategy): Promise<TValue> {
    return TaskToPromise<TValue>(this, abortStrategy);
  }
}


