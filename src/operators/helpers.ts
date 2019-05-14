/**
 * What to do when an Observable is 'complete' (has nothing more to emits)
 *  - noop: do nothing
 *  - cache: keeps in cache all emitted values and re-emits them each time an Observer observes this Observable
 *  - clear: removes all its observers
 *  - clear-strict (default): removes all its observers and throws an error if a future Observer observes it.
 */
export type TOnObservableCompleteAction = 'noop' | 'cache' | 'clear' | 'clear-strict';

export interface IOnObservableCompleteOptions {
  onComplete?: TOnObservableCompleteAction;
}

export function NormalizeOnObservableCompleteAction(action: TOnObservableCompleteAction | undefined): TOnObservableCompleteAction {
  switch (action) {
    case void 0:
      return 'clear-strict';
    case 'noop':
    case 'cache':
    case 'clear':
    case 'clear-strict':
      return action;
    default:
      throw new TypeError(`Expected 'noop', 'cache', 'clear' or 'clear-strict' as onComplete`);
  }
}
