import { Task } from '../../implementation';
import { ITaskContext } from '../../context/interfaces';
import { ITask } from '../../interfaces';

export interface IBasicTaskHandlers {
  run: () => void; // called when the task is running (after 'start' or 'resume')
  pause: () => void; // called when the task is paused (after 'pause')
  finished: () => void; // called when the task is finished (after 'complete', 'error' or 'abort') => task.state to know the state
}


/**
 * Links a Task with some predefined callbacks for a simple workflow.
 *  - properly release local resources when the task is done
 */
export function LinkTaskWithBasicHandlers<TValue>(
  task: ITask<TValue>,
  options: IBasicTaskHandlers,
): void {

  const run = () => {
    options.run();
  };

  const pause = () => {
    options.pause();
  };

  const finished = () => {
    taskStartListener.deactivate();
    taskPauseListener.deactivate();
    taskResumeListener.deactivate();

    taskCompleteListener.deactivate();
    taskErrorListener.deactivate();
    taskAbortListener.deactivate();

    options.finished();
  };

  const taskStartListener = task.addListener('start', run);
  const taskPauseListener = task.addListener('pause', pause);
  const taskResumeListener = task.addListener('resume', run);

  const taskCompleteListener = task.addListener('complete', finished);
  const taskErrorListener = task.addListener('error', finished);
  const taskAbortListener = task.addListener('abort', finished);

  taskStartListener.activate();
  taskPauseListener.activate();
  taskResumeListener.activate();

  taskCompleteListener.activate();
  taskErrorListener.activate();
  taskAbortListener.activate();
}


export function BuildBasicTask<TValue>(create: (context: ITaskContext<TValue>) => IBasicTaskHandlers): ITask<TValue> {
  return new Task<TValue>((context: ITaskContext<TValue>) => {
    LinkTaskWithBasicHandlers(context.task, create(context));
  });
}

