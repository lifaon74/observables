import { ITask } from '../interfaces';
import { HasOwnProperty, HasProperty } from '../../../../misc/helpers/object/has-property';
import { IProgress } from '../../../../misc/progress/interfaces';


// export type TWrappedTaskMethodNames = 'start' | 'pause' | 'resume' | 'abort';
// export type TWrappedTaskMethodNames = Extract<keyof ITaskKeyValueMap<any>, 'start' | 'pause' | 'resume' | 'abort'>;
export type TWrappedTaskMethodNames = Extract<keyof ITask<any>, 'start' | 'pause' | 'resume' | 'abort'>;

/**
 * Returns a callback which throws when called, notifying the user that it's forbidden to use
 */
export function CreateWrappedTaskForbiddenMethodCall(methodName: TWrappedTaskMethodNames): () => never {
  return () => {
    throw new Error(`Cannot call '${ methodName }' on a wrapped Task`);
  };
}

export function ReplaceNativeMethod<TInstance extends object, TMethodName extends keyof TInstance>(
  instance: TInstance,
  methodName: TMethodName,
  newMethod: TInstance[TMethodName]
): () => void {
  let undo: () => void;
  if (HasOwnProperty(instance, methodName)) {
    const nativeMethod: TInstance[TMethodName] = instance[methodName];
    undo = () => {
      instance[methodName] = nativeMethod;
    };
  } else if (HasProperty(instance, methodName)) {
    undo = () => {
      delete instance[methodName];
    };
  } else {
    throw new Error(`Missing method '${ methodName }'`);
  }

  instance[methodName] = newMethod;

  return undo;
}


export interface IWrapTaskHandlers<TWrappedTaskValue> {
  onNext?(value: TWrappedTaskValue): void,
  onProgress?(progress: IProgress): void,
}

/**
 * Links a task with another:
 *  - transfers the 'start', 'abort', 'resume' and 'pause' from the wrapping to the wrapped task
 *    -> until the wrapped task is done ('errored', 'complete', or aborted by wrapping class)
 */
export function WrapTask<TWrappedTaskValue>(
  wrappingTask: ITask<any>,
  wrappedTask: ITask<TWrappedTaskValue>,
  options: IWrapTaskHandlers<TWrappedTaskValue> = {}
): void {
  if (wrappedTask.done) {
    throw new Error(`Wrapping task must not be in a finite state (wrappingTask.done must be false)`);
  } else if (wrappedTask.state === 'await') {

    if (wrappingTask.state === 'abort') {
      wrappedTask.abort(wrappingTask.result);
    } else {
      const abort = wrappedTask.abort.bind(wrappedTask);
      const pause = wrappedTask.pause.bind(wrappedTask);
      const start = wrappedTask.start.bind(wrappedTask);

      const undoAbortReplace = ReplaceNativeMethod(wrappedTask, 'abort', CreateWrappedTaskForbiddenMethodCall('abort'));
      const undoPauseReplace = ReplaceNativeMethod(wrappedTask, 'pause', CreateWrappedTaskForbiddenMethodCall('pause'));
      const undoStartReplace = ReplaceNativeMethod(wrappedTask, 'start', CreateWrappedTaskForbiddenMethodCall('start'));
      const undoResumeReplace = ReplaceNativeMethod(wrappedTask, 'resume', CreateWrappedTaskForbiddenMethodCall('resume'));

      const clear = () => {
        undoAbortReplace();
        undoPauseReplace();
        undoStartReplace();
        undoResumeReplace();

        wrappingTaskStartListener.deactivate();
        wrappingTaskAbortListener.deactivate();
        wrappingTaskPauseListener.deactivate();
        wrappingTaskResumeListener.deactivate();
        wrappedTaskCompleteListener.deactivate();
        wrappedTaskErrorListener.deactivate();
        wrappedTaskAbortListener.deactivate();
        if (wrappedTaskNextListener !== void 0) {
          wrappedTaskNextListener.deactivate();
        }
        if (wrappedTaskProgressListener !== void 0) {
          wrappedTaskProgressListener.deactivate();
        }
      };

      const wrappingTaskStartListener = wrappingTask.addListener('start', start);
      const wrappingTaskAbortListener = wrappingTask.addListener('abort', abort);
      const wrappingTaskPauseListener = wrappingTask.addListener('pause', pause);
      const wrappingTaskResumeListener = wrappingTask.addListener('resume', start);

      const wrappedTaskCompleteListener = wrappedTask.addListener('complete', clear);
      const wrappedTaskErrorListener = wrappedTask.addListener('error', clear);
      const wrappedTaskAbortListener = wrappedTask.addListener('abort', clear);
      const wrappedTaskNextListener = (options.onNext === void 0) ? void 0 : wrappedTask.addListener('next', options.onNext);
      const wrappedTaskProgressListener = (options.onProgress === void 0) ? void 0 : wrappedTask.addListener('progress', options.onProgress);

      wrappingTaskStartListener.activate();
      wrappingTaskAbortListener.activate();
      wrappingTaskPauseListener.activate();
      wrappingTaskResumeListener.activate();

      wrappedTaskCompleteListener.activate();
      wrappedTaskErrorListener.activate();
      wrappedTaskAbortListener.activate();
      if (wrappedTaskNextListener !== void 0) {
        wrappedTaskNextListener.activate();
      }
      if (wrappedTaskProgressListener !== void 0) {
        wrappedTaskProgressListener.activate();
      }

      if (wrappingTask.state === 'pause') {
        pause();
      } else if (wrappingTask.state === 'run') {
        start();
      }
    }
  } else {
    throw new Error(`Wrapped task must be in an 'await' state`);
  }
}

