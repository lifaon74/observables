import { ITask, ITaskContext } from '../interfaces';
import { Task } from '../implementation';
import { IProgress, IProgressOptions } from '../../../../misc/progress/interfaces';

/**
 * Links a task with another:
 *  - transfers the 'start', 'cancel', 'resume' and 'pause' from the parent to the child task
 *    -> until the child child is done ('errored', 'complete', or cancelled by parent class)
 */
function PassthroughsTask(context: ITaskContext<any>, task: ITask<any>) {

  const onChildTaskCancel = () => {
    if (!context.task.done) {
      context.errorUntilRun(new Error(`Child task has been cancelled`));
    }
  };

  if (task.state === 'cancel') {
    onChildTaskCancel();
  } else {
    const onParentTaskCancel = (reason: any) => {
      task.cancel(reason);
    };

    const onParentTaskPause = () => {
      task.pause();
    };

    const onParentTaskRun = () => {
      task.start();
    };

    if (context.task.state === 'cancel') {
      onParentTaskCancel(context.task.result);
    } else if (context.task.state === 'pause') {
      onParentTaskPause();
    } else if (context.task.state === 'run') {
      onParentTaskRun();
    } else {
      const clear = () => {
        parentTaskStartListener.deactivate();
        parentTaskCancelListener.deactivate();
        parentTaskPauseListener.deactivate();
        parentTaskResumeListener.deactivate();
        childTaskCompleteListener.deactivate();
        childTaskErrorListener.deactivate();
        childTaskCancelListener.deactivate();
      };

      const parentTaskStartListener = context.task.addListener('start', onParentTaskRun);
      const parentTaskCancelListener = context.task.addListener('cancel', onParentTaskCancel);
      const parentTaskPauseListener = context.task.addListener('pause', onParentTaskPause);
      const parentTaskResumeListener = context.task.addListener('resume', onParentTaskRun);

      const childTaskCompleteListener = task.addListener('complete', clear);
      const childTaskErrorListener = task.addListener('error', clear);
      const childTaskCancelListener = task.addListener('cancel', () => {
        clear();
        onChildTaskCancel();
      });

      parentTaskStartListener.activate();
      parentTaskCancelListener.activate();
      parentTaskPauseListener.activate();
      parentTaskResumeListener.activate();
      childTaskCompleteListener.activate();
      childTaskErrorListener.activate();
      childTaskCancelListener.activate();
    }
  }
}

/**
 * Runs the 'tasks' in sequence.
 *  - progress is 'number of tasks done' / 'total number of tasks'
 */
export function taskFromTasksInSequence<T>(tasks: ITask<any>[]): ITask<void> {
  return new Task<void>((context: ITaskContext<void>) => {
    let promise: Promise<void> = Promise.resolve();
    for (let i = 0, l = tasks.length;i < l; i++) {
      const task: ITask<any> = tasks[i];
      promise = promise
        .then(() => {
          context.progressUntilRun(i + 1, l);
          PassthroughsTask(context, task);
          return task.toPromise('never');
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


export type TProgressMode =
  'aggregate' // for each tasks, try to aggregate the progresses
  | 'count' // progress is 'number of tasks done' / 'total number of tasks'
  ;

/**
 * Takes N 'progresses' in input and returns (if possible) the aggregated progress
 */
function AggregateProgresses(progresses: (Required<IProgressOptions> | null)[]): null | Required<IProgressOptions> {
  return progresses.reduce<null | Required<IProgressOptions>>((previousValue: null | Required<IProgressOptions>, currentValue: IProgress | null) => {
    if ((previousValue === null) || (currentValue === null)) {
      return null;
    } else {
      return {
        loaded: previousValue.loaded + currentValue.loaded,
        total: previousValue.total + currentValue.total,
      };
    }
  }, {
    loaded: 0,
    total: 0,
  });
}

/**
 * Runs the 'tasks' in parallel.
 */
export function taskFromTasksInParallel<T>(tasks: ITask<any>[], mode: TProgressMode = 'count'): ITask<void> {
  return new Task<void>((context: ITaskContext<void>) => {
    let count: number = 0;
    const progresses: (Required<IProgressOptions> | null)[] = Array.from({ length: tasks.length }, () => {
      return {
        loaded: 0,
        total: Number.POSITIVE_INFINITY
      };
      // return null;
    });

    Promise.all(
      tasks.map((task: ITask<any>, index: number) => {
        PassthroughsTask(context, task);

        const errorListener = context.task.addListener('error', (error?: any) => {
          task.cancel(error);
        });
        errorListener.activate();

        let promise: Promise<void> = task.toPromise('never')
          .finally(() => {
            errorListener.deactivate();
          });

        if (mode === 'aggregate') {
          const progressListener = task.addListener('progress', (progress: IProgress) => {
            progresses[index] = progress;
            const aggregatedProgress: null | Required<IProgressOptions> = AggregateProgresses(progresses);
            if (aggregatedProgress !== null) {
              context.progressUntilRun(aggregatedProgress);
            }
          });
          progressListener.activate();

          promise = promise
            .finally(() => {
              progressListener.deactivate();
            });
        } else {
          promise = promise
            .then(() => {
              count++;
              context.progressUntilRun(count, tasks.length);
            });
        }

        return promise;
      })
    )
      .then(() => {
        context.completeUntilRun();
      }, (error: any) => {
        context.errorUntilRun(error);
      });
  });
}

