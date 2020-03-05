import { debugFiniteStateObservable } from './observables/finite-state/debug-finite-state-observable';
import { debugCancellableContext } from './debug-cancellable-context';
import { debugTask } from './observables/task/debug-task';

export async function runDebug() {
  // await debugFiniteStateObservable();
  // await debugCancellableContext();
  await debugTask();
}
