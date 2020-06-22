import { ITask } from '../../interfaces';
import { Task } from '../../implementation';
import { ITaskContext } from '../../context/interfaces';
import { IProgress } from '../../../../../misc/progress/interfaces';
import {
  TFinalStateConstraint, TFiniteStateKeyValueMapConstraint, TFiniteStateObservableGeneric,
  TFiniteStateObservableModeConstraint
} from '../../../finite-state/types';
import { IFiniteStateObservable } from '../../../finite-state/interfaces';
import { TAbortObservableToAsyncIterableStrategy } from '../../../../../operators/to/toAsyncIterable';
import { INotificationsObservable } from '../../../../core/notifications-observable/interfaces';
import { KeyValueMapGeneric } from '../../../../core/types';

/**
 * Creates a Task form a FiniteStateObservable
 *  - INFO: every values emitted by the FiniteStateObservable MUST be cached per observer
 *  - INFO: doesnt use BuildBasicTask for better resource release
 */
export function taskFromFiniteStateObservable<TValue,
  TFinalState extends TFinalStateConstraint<TFinalState>,
  TMode extends TFiniteStateObservableModeConstraint<TMode>,
  TKVMap extends TFiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>,
  TStrategy extends TAbortObservableToAsyncIterableStrategy>(
  observable: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>,
): ITask<TValue> {
  if (
    (observable.mode !== 'cache-per-observer')
    && (observable.mode !== 'cache-all-per-observer')
  ) {
    throw new Error(`Expected 'cache-per-observer' or 'cache-all-per-observer' mode`);
  }
  return new Task<TValue>((context: ITaskContext<TValue>) => {

    const task: ITask<TValue> = context.task;

    const finiteStateObservableCompleteObserver = (observable as unknown as TFiniteStateObservableGeneric)
      .addListener('complete', () => {
        clear();
        context.completeUntilRun();
      });

    const finiteStateObservableErrorObserver = (observable as unknown as TFiniteStateObservableGeneric)
      .addListener('error', (error: any) => {
        clear();
        context.errorUntilRun(error);
      });

    const finiteStateObservableNextObserver = (observable as unknown as TFiniteStateObservableGeneric)
      .addListener('next', (value: TValue) => {
        context.nextUntilRun(value);
      });

    const finiteStateObservableProgressObserver = (observable as unknown as INotificationsObservable<KeyValueMapGeneric>)
      .addListener('progress', (value: IProgress) => {
        context.progressUntilRun(value);
      });

    const run = () => {
      finiteStateObservableCompleteObserver.activate();
      finiteStateObservableErrorObserver.activate();
      finiteStateObservableNextObserver.activate();
      finiteStateObservableProgressObserver.activate();
    };

    const pause = () => {
      finiteStateObservableCompleteObserver.deactivate();
      finiteStateObservableErrorObserver.deactivate();
      finiteStateObservableNextObserver.deactivate();
      finiteStateObservableProgressObserver.deactivate();
    };

    const clear = () => {
      pause();
      taskStartListener.deactivate();
      taskPauseListener.deactivate();
      taskResumeListener.deactivate();
      taskAbortListener.deactivate();
    };

    const taskStartListener = task.addListener('start', run);
    const taskPauseListener = task.addListener('pause', pause);
    const taskResumeListener = task.addListener('resume', run);
    const taskAbortListener = task.addListener('abort', clear);

    taskStartListener.activate();
    taskPauseListener.activate();
    taskResumeListener.activate();
    taskAbortListener.activate();
  });
}
