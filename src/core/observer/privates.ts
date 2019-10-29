import { IObserver } from './interfaces';
import { IObservable } from '../observable/interfaces';
import { IReadonlyList } from '../../misc/readonly-list/interfaces';

/** PRIVATES **/

export const OBSERVER_PRIVATE = Symbol('observer-private');

export interface IObserverPrivate<T> {
  activated: boolean;
  observables: IObservable<T>[];
  readOnlyObservables: IReadonlyList<IObservable<T>>;

  onEmit(value: T, observable?: IObservable<T>): void;
}

export interface IObserverInternal<T> extends IObserver<T> {
  [OBSERVER_PRIVATE]: IObserverPrivate<T>;
}
