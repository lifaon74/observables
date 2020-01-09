import { IProgress } from '../../../../misc/progress/interfaces';
import { ITask} from '../interfaces';
import { Task } from '../implementation';
import { Progress } from '../../../../misc/progress/implementation';
import { ITaskContext } from '../context/interfaces';


export interface ITaskAsyncIteratorValue<T> {
  value?: T;
  progress?: IProgress;
}

export type TTaskAsyncIteratorReturn<T> = ITaskAsyncIteratorValue<T> | void;

/**
 * Creates a Task from an AsyncIterator.
 * The AsyncIterator slices the execution and may return a progress and a value
 */
export function taskFromAsyncIterator<T>(iterator: AsyncIterator<TTaskAsyncIteratorReturn<T>>): ITask<T> {
  return new Task<T>((context: ITaskContext<T>) => {

    const clear = () => {
      startListener.deactivate();
      resumeListener.deactivate();
      cancelListener.deactivate();
    };

    const run = async () => {
      // ensures than 'run' is just called once
      startListener.deactivate();
      resumeListener.deactivate();

      while (context.task.state === 'run') {
        let result: IteratorResult<TTaskAsyncIteratorReturn<T>>;

        try {
          result = await iterator.next();
        } catch (error) {
          context.errorUntilRun(error);
          clear();
          break;
        }

        if (result.done) {
          context.completeUntilRun();
          clear();
          break;
        } else {
          if (result.value !== void 0) {
            if (result.value.value !== void 0) {
              context.nextUntilRun(result.value.value);
            }
            if (result.value.progress !== void 0) {
              context.progressUntilRun(result.value.progress);
            }
          }
        }
      }

      startListener.activate();
      resumeListener.activate();
    };

    const startListener = context.task.addListener('start', run);
    const resumeListener = context.task.addListener('resume', run);
    const cancelListener = context.task.addListener('abort', clear);

    startListener.activate();
    cancelListener.activate();
  });
}


export function taskFromAsyncIteratorWithCountProgress<T>(iterator: AsyncIterator<T>): ITask<T> {
  return taskFromAsyncIterator<T>((async function * generator() {
    let count: number = 0;
    let result: IteratorResult<T>;
    while (!(result = await iterator.next()).done) {
      count++;
      yield { progress: new Progress({ loaded: count, name: 'count' }) };
    }
  })());
}
