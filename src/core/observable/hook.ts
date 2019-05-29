import { IObserver } from '../observer/interfaces';
import { IObservable, IObservableContextBase, IObservableHook } from './interfaces';
import { IsObject, noop } from '../../helpers';

export interface IObservableHookPrivate<T> {
  onObserveHook(observer: IObserver<T>): void;

  onUnobserveHook(observer: IObserver<T>): void;
}

export function InitObservableHook<T>(
  observable: IObservable<T>,
  privates: IObservableHookPrivate<T>,
  createContext: (observable: IObservable<T>) => IObservableContextBase<T>,
  create?: (context: IObservableContextBase<T>) => (IObservableHook<T> | void),
): void {
  privates.onObserveHook = noop;
  privates.onUnobserveHook = noop;

  if (typeof create === 'function') {
    const hook: IObservableHook<T> | void = create.call(observable, createContext(observable));

    if (hook !== void 0) {
      if (IsObject(hook)) {
        if (typeof hook.onObserved === 'function') {
          privates.onObserveHook = hook.onObserved.bind(observable);
        }

        if (typeof hook.onUnobserved === 'function') {
          privates.onUnobserveHook = hook.onUnobserved.bind(observable);
        }
      } else {
        throw new TypeError(`Expected object or void as return of ${ observable.constructor.name }'s create function.`);
      }
    }
  } else if (create !== void 0) {
    throw new TypeError(`Expected function or void as ${ observable.constructor.name }'s create function.`);
  }
}
