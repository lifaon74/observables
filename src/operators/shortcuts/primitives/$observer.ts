import { IObserver } from '../../../core/observer/interfaces';
import { IsObserver } from '../../../core/observer/constructor';
import { TObserverOrCallback } from '../../../core/observable/types';
import { Observer } from '../../../core/observer/public';

export type TObserverOrCallbackToObserverActivateMode =
  'none' // (default) no specific action
  | 'activate' // activate the observer
  | 'deactivate' // deactivate the observer
  | 'activate-if-callback' // activate the observer, only if a callback was provided
  ;

/**
 * Converts a callback or an Observer to an Observer
 */
export function $observer<T>(
  input: TObserverOrCallback<T>,
  activateMode: TObserverOrCallbackToObserverActivateMode = 'none',
): IObserver<T> {
  const isObserver: boolean = IsObserver(input);
  const observer: IObserver<T> = isObserver
    ? input as IObserver<T>
    : new Observer<T>(input as (value: T) => void);

  switch (activateMode) {
    case 'none':
      break;
    case 'activate':
      observer.activate();
      break;
    case 'deactivate':
      observer.deactivate();
      break;
    case 'activate-if-callback':
      if (!isObserver) {
        observer.activate();
      }
      break;
    default:
      throw new TypeError(`Unknown activateMode '${ activateMode }'`)
  }

  return observer;

  // return IsObserver(input)
  //   ? input
  //   : new Observer<T>(input as (value: T) => void);
}
