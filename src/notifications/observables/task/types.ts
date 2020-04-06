import { IProgress } from '../../../misc/progress/interfaces';
import { ITask} from './interfaces';
import { ITaskContext } from './context/interfaces';
import { TFiniteStateObservableFinalState, TFiniteStateObservableKeyValueMapGeneric } from '../finite-state/types';

/** TYPES **/

export type TTaskState =
  'await' // task is awaiting for a 'start'
  | 'run' // task is currently running
  | 'pause' // task execution is paused
  | 'abort' // task is aborted
  | 'complete' // task finished with success
  | 'error' // task errored
  ;

export type TTaskFinalState = TFiniteStateObservableFinalState | 'abort';

export interface ITaskKeyValueMap<TValue> extends TFiniteStateObservableKeyValueMapGeneric<TValue, TTaskFinalState> {
  'start': void;
  'pause': void;
  'resume': void;
  // 'abort': any;

  'progress': IProgress;
  // 'next': TValue;
  // 'complete': void;
  // 'error': any;
}

export type TTaskCreateCallback<TValue> = (this: ITask<TValue>, context: ITaskContext<TValue>) => void;
