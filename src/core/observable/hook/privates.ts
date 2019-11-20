import { IObserver } from '../../observer/interfaces';

/** PRIVATES **/

export interface IObservableHookPrivate<T> {
  onObserveHook(observer: IObserver<T>): void;

  onUnobserveHook(observer: IObserver<T>): void;
}
