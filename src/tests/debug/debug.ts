import { debugTask } from './observables/task/debug-task';
import { debugPausableIteration } from './debug-pausable-iteration';
import { debugFiniteStateObservable } from './observables/finite-state/debug-finite-state-observable';
import { debugCancellableContext } from './debug-cancellable-context';

export async function runDebug() {
  // await debugFiniteStateObservable();
  // await debugCancellableContext();
  // await debugPausableIteration();
  await debugTask();
}
