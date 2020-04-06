import { ITask } from '../../interfaces';
import { Task } from '../../implementation';
import { ITaskContext } from '../../context/interfaces';
import { Progress } from '../../../../../misc/progress/implementation';
import { WrapTask } from '../helpers';

export function taskFromTasksInSequence(
  tasks: ITask<any>[],
): ITask<void> {
  return new Task<void>((context: ITaskContext<void>) => {
    let promise: Promise<void> = Promise.resolve();
    for (let i = 0, l = tasks.length; i < l; i++) {
      const task: ITask<any> = tasks[i];
      promise = promise
        .then(() => {
          WrapTask(context.task, task);
          return task.toPromise({ abortStrategy: 'never' })
            .then(() => {
              context.progressUntilRun(new Progress({ loaded: i + 1, total: l, name: 'count' }));
            });
        });
    }

    promise
      .then(() => {
        context.completeUntilRun();
      }, (error: any) => {
        context.errorUntilRun(error);
      });
  });
}

export function taskFromTasksInParallel(
  tasks: ITask<any>[],
): ITask<void> {
  return new Task<void>((context: ITaskContext<void>) => {
    let loaded: number = 0;
    let total: number = tasks.length;
    Promise.all(
      tasks.map((task: ITask<any>) => {
        WrapTask(context.task, task);

        const errorListener = context.task.addListener('error', (error?: any) => {
          task.abort(error);
        });
        errorListener.activate();

        return task.toCancellablePromise({ abortStrategy: 'never' })
          .finally(() => {
            errorListener.deactivate();
          })
          .then(() => {
            loaded++;
            context.progressUntilRun(new Progress({ loaded, total, name: 'count' }));
          });
      })
    )
      .then(() => {
        context.completeUntilRun();
      }, (error: any) => {
        context.errorUntilRun(error);
      });
  });
}


