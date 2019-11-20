import { IObserver } from '../../../observer/interfaces';
import { IObservable } from '../../../observable/interfaces';
import { IObservableHook } from '../../../observable/hook/interfaces';
import { ObservableType } from '../../../observable/types';
import { ObserverType } from '../../../observer/types';

/** INTERFACES **/

export interface IPipeHook<TObserver extends IObserver<any>, TObservable extends IObservable<any>> extends IObservableHook<ObservableType<TObservable>> {
  // called when this Observer receives data.
  onEmit?(value: ObserverType<TObserver>, observable?: TObservable): void;
}
