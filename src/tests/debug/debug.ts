import { debugTask } from './observables/task/debug-task';
import { debugObservable } from './observables/observables/debug-observable';
import { debugShortcutOperators } from './operators/shortcuts/debug-shortcut-operators';


export async function runDebug() {
  // await debugFiniteStateObservable();
  // await debugCancellableContext();
  // await debugPausableIteration();
  // await debugTask();
  // await debugObservable();
  await debugShortcutOperators();
}
