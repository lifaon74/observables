import { ITask} from '../interfaces';
import { Task } from '../implementation';
import { TPromiseFactory } from '../../../../promises/interfaces';
import { IsCancellablePromise } from '../../../../promises/cancellable-promise/constructor';
import { ITaskContext } from '../context/interfaces';


export function taskFromPromise<T>(promise: Promise<T>): ITask<T> {
  return taskFromPromiseFactory<T>(() => promise);
}

/**
 * Creates a Task from a promise factory
 */
export function taskFromPromiseFactory<T>(promiseFactory: TPromiseFactory<T>): ITask<T> {
  return new Task<T>((context: ITaskContext<T>) => {

    let promise: Promise<T>;

    const clear = () => {
      startListener.deactivate();
      cancelListener.deactivate();
    };

    const cancelListener = context.task.addListener('abort', (reason: any) => {
      clear();
      // if ((promise !== void 0) && IsCancellablePromise(promise)) {
      //   promise.token.cancel(reason);
      // }
    });

    const startListener = context.task.addListener('start', () => {
      startListener.deactivate();
      promise = promiseFactory();
      promise
        .then((value: T) => {
          if (!context.task.done) {
            context.nextUntilRun(value);
            context.completeUntilRun();
          }
          clear();
        }, (error: any) => {
          if (!context.task.done) {
            context.errorUntilRun(error);
          }
          clear();
        });

      if (IsCancellablePromise(promise)) {
        promise.cancelled((reason: any) => {
          if (!context.task.done) {
            context.task.abort(reason);
            // context.errorUntilRun(new Error(`Promise has been cancelled`));
          }
          clear();
        });
      }
    });

    startListener.activate();
    cancelListener.activate();
  });
}


