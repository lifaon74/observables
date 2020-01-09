import { ITask} from '../interfaces';
import { Task } from '../implementation';
import { IProgress, IProgressOptions } from '../../../../misc/progress/interfaces';
import { ITaskContext } from '../context/interfaces';
import { Progress } from '../../../../misc/progress/implementation';

/**
 * Links a task with another:
 *  - transfers the 'start', 'abort', 'resume' and 'pause' from the parent to the child task
 *    -> until the child task is done ('errored', 'complete', or aborted by parent class)
 */
function PassthroughsTask(context: ITaskContext<any>, task: ITask<any>) {

  const onChildTaskAbort = () => {
    if (!context.task.done) {
      context.errorUntilRun(new Error(`Child task has been aborted`));
    }
  };

  if (task.state === 'abort') {
    onChildTaskAbort();
  } else {
    const onParentTaskAbort = (reason: any) => {
      task.abort(reason);
    };

    const onParentTaskPause = () => {
      task.pause();
    };

    const onParentTaskRun = () => {
      task.start();
    };

    if (context.task.state === 'abort') {
      onParentTaskAbort(context.task.result);
    } else if (context.task.state === 'pause') {
      onParentTaskPause();
    } else if (context.task.state === 'run') {
      onParentTaskRun();
    } else {
      const clear = () => {
        parentTaskStartListener.deactivate();
        parentTaskAbortListener.deactivate();
        parentTaskPauseListener.deactivate();
        parentTaskResumeListener.deactivate();
        childTaskCompleteListener.deactivate();
        childTaskErrorListener.deactivate();
        childTaskCancelListener.deactivate();
      };

      const parentTaskStartListener = context.task.addListener('start', onParentTaskRun);
      const parentTaskAbortListener = context.task.addListener('abort', onParentTaskAbort);
      const parentTaskPauseListener = context.task.addListener('pause', onParentTaskPause);
      const parentTaskResumeListener = context.task.addListener('resume', onParentTaskRun);

      const childTaskCompleteListener = task.addListener('complete', clear);
      const childTaskErrorListener = task.addListener('error', clear);
      const childTaskCancelListener = task.addListener('abort', () => {
        clear();
        onChildTaskAbort();
      });

      parentTaskStartListener.activate();
      parentTaskAbortListener.activate();
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
 *  TODO: should support abort
 *  TODO: should dispatch child tasks progress
 */
export function taskFromTasksInSequence<T>(tasks: ITask<any>[]): ITask<void> {
  return new Task<void>((context: ITaskContext<void>) => {
    let promise: Promise<void> = Promise.resolve();
    for (let i = 0, l = tasks.length; i < l; i++) {
      const task: ITask<any> = tasks[i];
      promise = promise
        .then(() => {
          context.progressUntilRun(new Progress({ loaded: i + 1, total: l, name: 'count' }));
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
export type TAggregatedProgress = Required<Omit<IProgressOptions, 'name'>>;

function AggregateProgresses(progresses: (TAggregatedProgress | null)[]): TAggregatedProgress | null {
  return progresses.reduce<TAggregatedProgress | null>((previousValue: TAggregatedProgress | null, currentValue: TAggregatedProgress | null) => {
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
    const progresses: (TAggregatedProgress | null)[] = Array.from({ length: tasks.length }, () => {
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
          task.abort(error);
        });
        errorListener.activate();

        let promise: Promise<void> = task.toPromise('never')
          .finally(() => {
            errorListener.deactivate();
          });

        if (mode === 'aggregate') {
          const progressListener = task.addListener('progress', (progress: IProgress) => {
            progresses[index] = progress;
            const aggregatedProgress: null | TAggregatedProgress = AggregateProgresses(progresses);
            if (aggregatedProgress !== null) {
              context.progressUntilRun(new Progress(aggregatedProgress));
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
              context.progressUntilRun(new Progress(count, tasks.length));
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

