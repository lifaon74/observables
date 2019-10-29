import { IObservableHook } from './interfaces';
import { IObservableContext } from '../context/interfaces';
import { noop } from '../../../helpers';

/**
 * Wrapper around an ObservableHook:
 * Handles onActivate and onDeactivate
 */

// EXAMPLE
/*
new Observable<void>((context: IObservableContext<void>) => {
  return CreateSimpleAndBasicObservableHook<void>(context, {
    onActivate(): void {
      console.log('activated');
    },
    onDeactivate(): void {
      console.log('deactivated');
    }
  });
});
 */

export type TSimpleObservableHook<H extends IObservableHook<any>> = H & {
  onActivate(): void; // called when this observable transits from a non-observed state to an observed state (=> when it has one observer)
  onDeactivate(): void; // called when this observable transits from an observed state to a non-observed state (=> when it has zero observer)
};

export function CreateSimpleObservableHook<H extends IObservableHook<any>>(context: H extends IObservableHook<infer T> ? IObservableContext<T> : never, hook: TSimpleObservableHook<H>): H {
  if (typeof hook.onActivate === 'function') {
    const onActivate = hook.onActivate; // freeze function
    const _onObserved = (typeof hook.onObserved === 'function') ? hook.onObserved : noop;
    hook.onObserved = function onObserved() {
      if (context.observable.observers.length === 1) {
        onActivate.call(this);
      }
      _onObserved.apply(this, arguments);
    };
  } else {
    throw new TypeError(`Expected function as hook.onActivate`);
  }

  if (typeof hook.onDeactivate === 'function') {
    const onDeactivate = hook.onDeactivate; // freeze function
    const _onUnobserved = (typeof hook.onUnobserved === 'function') ? hook.onUnobserved : noop;
    hook.onUnobserved = function onUnobserved() {
      if (context.observable.observers.length === 0) {
        onDeactivate.call(this);
      }
      _onUnobserved.apply(this, arguments);
    };
  } else {
    throw new TypeError(`Expected function as hook.onDeactivate`);
  }
  return hook;
}

export type TSimpleAndBasicObservableHook<T> = TSimpleObservableHook<IObservableHook<T>>;

export function CreateSimpleAndBasicObservableHook<T>(context: IObservableContext<T>, hook: TSimpleObservableHook<IObservableHook<T>>): IObservableHook<T> {
  return CreateSimpleObservableHook<IObservableHook<T>>(context, hook);
}

