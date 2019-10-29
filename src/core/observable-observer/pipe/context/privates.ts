import { IObserver } from '../../../observer/interfaces';
import { IObservable } from '../../../observable/interfaces';
import { IPipe } from '../interfaces';
import { IPipeContext } from './interfaces';

/** PRIVATES **/

export const PIPE_CONTEXT_PRIVATE = Symbol('pipe-context-private');

export interface IPipeContextPrivate<TObserver extends IObserver<any>, TObservable extends IObservable<any>> {
  pipe: IPipe<TObserver, TObservable>;
}

export interface IPipeContextInternal<TObserver extends IObserver<any>, TObservable extends IObservable<any>> extends IPipeContext<TObserver, TObservable> {
  [PIPE_CONTEXT_PRIVATE]: IPipeContextPrivate<TObserver, TObservable>;
}
