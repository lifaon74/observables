
export type TOnObservableCompleteAction ='noop' | 'clear' | 'clear-strict';

export interface IOnObservableCompleteOptions {
  onComplete?: TOnObservableCompleteAction;
}

export function NormalizeOnObservableCompleteAction(action: TOnObservableCompleteAction | undefined): TOnObservableCompleteAction {
  switch (action) {
    case void 0:
      return 'clear-strict';
    case 'noop':
    case 'clear':
    case 'clear-strict':
      return action;
    default:
      throw new TypeError(`Expected 'noop', 'clear' or 'clear-strict' as onComplete`);
  }
}