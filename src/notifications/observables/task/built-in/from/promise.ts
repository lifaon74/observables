import { ITask } from '../../interfaces';
import { Task } from '../../implementation';
import { ITaskContext } from '../../context/interfaces';
import { IAdvancedAbortSignal } from '../../../../../misc/advanced-abort-controller/advanced-abort-signal/interfaces';
import { IAdvancedAbortController } from '../../../../../misc/advanced-abort-controller/interfaces';
import { AdvancedAbortController } from '../../../../../misc/advanced-abort-controller/implementation';
import { IProgress } from '../../../../../misc/progress/interfaces';

export type TTaskFromPromiseFactoryCallback<T> = (signal: IAdvancedAbortSignal, progress: (progress: IProgress) => void) => PromiseLike<T>;

/**
 * Creates a Task from a promise factory
 *  - if the task is aborted, the signal is aborted too
 */
export function taskFromPromiseFactory<T>(
  promiseFactory: TTaskFromPromiseFactoryCallback<T>
): ITask<T> {
  return new Task<T>((context: ITaskContext<T>) => {

    const controller: IAdvancedAbortController = new AdvancedAbortController();

    const clear = () => {
      abortListener.deactivate();
      startListener.deactivate();
    };

    const abortListener = context.task.addListener('abort', (reason: any) => {
      clear();
      controller.abort(reason);
    });

    const startListener = context.task.addListener('start', () => {
      startListener.deactivate();
      promiseFactory(controller.signal, (progress: IProgress) => {
        if (!context.task.done) { // because the Task may be in 'abort' state
          context.progressUntilRun(progress);
        }
      })
        .then((value: T) => {
          clear();
          if (!context.task.done) { // because the Task may be in 'abort' state
            context.nextUntilRun(value);
            context.completeUntilRun();
          }
        }, (error: any) => {
          clear();
          if (!context.task.done) {  // because the Task may be in 'abort' state
            context.errorUntilRun(error);
          }
        });
    });

    abortListener.activate();
    startListener.activate();
  });
}

/**
 * INFO: SHOULD not be used, because you'll NEED to abort the promise by yourself when the Task will abort
 */
export function taskFromPromise<T>(promise: Promise<T>): ITask<T> {
  return taskFromPromiseFactory<T>(() => promise);
}
