import { IObserver } from '../../observer/interfaces';
import { IObservable } from '../../observable/interfaces';
import { IPipe } from './interfaces';

/** PRIVATES **/

export const PIPE_PRIVATE = Symbol('pipe-private');

export interface IPipePrivate<TObserver extends IObserver<any>, TObservable extends IObservable<any>> {
  observer: TObserver;
  observable: TObservable;

  autoActivate: boolean;
  autoDeactivate: boolean;
}

export interface IPipePrivatesInternal<TObserver extends IObserver<any>, TObservable extends IObservable<any>> {
  [PIPE_PRIVATE]: IPipePrivate<TObserver, TObservable>;
}

export interface IPipeInternal<TObserver extends IObserver<any>, TObservable extends IObservable<any>> extends IPipePrivatesInternal<TObserver, TObservable>, IPipe<TObserver, TObservable> {
}
