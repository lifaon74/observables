import { IObserver } from '../../../observer/interfaces';
import { IObservable } from '../../../observable/interfaces';
import { IPipe } from '../interfaces';
import { ObservableType } from '../../../observable/types';

/** INTERFACES **/

/* PRIVATE */
export interface IPipeContextConstructor {
  // creates a PipeContext
  new<TObserver extends IObserver<any>, TObservable extends IObservable<any>>(pipe: IPipe<TObserver, TObservable>): IPipeContext<TObserver, TObservable>;
}

export interface IPipeContext<TObserver extends IObserver<any>, TObservable extends IObservable<any>> {
  readonly pipe: IPipe<TObserver, TObservable>;

  emit(value: ObservableType<TObservable>): void;
}
