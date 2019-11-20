import { IObservable } from '../interfaces';
import { IObservableContextBase } from '../context/base/interfaces';
import { ObservableType } from '../types';
import { IObservableHook } from './interfaces';
import { IObservableHookPrivate } from './privates';
import { IsObject, noop } from '../../../helpers';


// export function InitObservableHook<T, H extends IObservableHook<T> = IObservableHook<T>, TObservable extends IObservable<T> = IObservable<T>>(
//   observable: TObservable,
//   privates: IObservableHookPrivate<T>,
//   createContext: (observable: TObservable) => IObservableContextBase<T>,
//   create?: (context: IObservableContextBase<T>) => (H | void),
// ): H | void {
export function InitObservableHook<TObservable extends IObservable<any>, TObservableContext extends IObservableContextBase<ObservableType<TObservable>>, TObservableHook extends IObservableHook<ObservableType<TObservable>>>(
  observable: TObservable,
  privates: IObservableHookPrivate<ObservableType<TObservable>>,
  createContext: (observable: TObservable) => TObservableContext,
  create?: (context: TObservableContext) => (TObservableHook | void),
): TObservableHook | void {
  privates.onObserveHook = noop;
  privates.onUnobserveHook = noop;

  if (typeof create === 'function') {
    const hook: TObservableHook | void = create.call(observable, createContext(observable));

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

    return hook;
  } else if (create !== void 0) {
    throw new TypeError(`Expected function or void as ${ observable.constructor.name }'s create function.`);
  }
}
