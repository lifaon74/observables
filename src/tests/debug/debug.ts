import { debugTask } from './observables/task/debug-task';

export async function runDebug() {
  // await debugFiniteStateObservable();
  // await debugCancellableContext();
  await debugTask();
}
