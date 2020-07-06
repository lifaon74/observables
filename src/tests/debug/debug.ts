import { debugTask } from './observables/task/debug-task';
import { debugObservable } from './observables/observables/debug-observable';


export async function runDebug() {
  // await debugFiniteStateObservable();
  // await debugCancellableContext();
  // await debugPausableIteration();
  // await debugTask();
  await debugObservable();
}
