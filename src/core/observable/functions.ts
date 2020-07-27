import { IObservable, IObservableTypedConstructor } from './interfaces';
import { IObservableInternal, IObservablePrivate, OBSERVABLE_PRIVATE } from './privates';
import { IObserver } from '../observer/interfaces';
import { IObserverInternal, OBSERVER_PRIVATE } from '../observer/privates';
import { IObservableHook } from './hook/interfaces';
import { IObservableContext } from './context/interfaces';

/** FUNCTIONS **/

/* PUBLIC */

export function ObservableIsFreshlyObserved<T>(instance: IObservable<T>): boolean {
  return (instance as IObservableInternal<T>)[OBSERVABLE_PRIVATE].observers.length === 1;
}

export function ObservableIsObserved<T>(instance: IObservable<T>): boolean {
  return (instance as IObservableInternal<T>)[OBSERVABLE_PRIVATE].observers.length > 0;
}

export function ObservableIsNotObserved<T>(instance: IObservable<T>): boolean {
  return (instance as IObservableInternal<T>)[OBSERVABLE_PRIVATE].observers.length === 0;
}

/* PUBLIC HELPERS */

export type TCreateObservableEmitterTuple<GObservableConstructor extends IObservableTypedConstructor<any>> =
  GObservableConstructor extends new(create?: (context: infer GContext) => (IObservableHook<any> | void)) => infer GObservable
    ? (
      GContext extends IObservableContext<any>
        ? [GObservable, GContext]
        : never
      )
    : never;

export function CreateObservableEmitter<GObservableConstructor extends IObservableTypedConstructor<any>>(
  ctor: GObservableConstructor
): TCreateObservableEmitterTuple<GObservableConstructor> {
  let context: IObservableContext<any>;
  const observable = new ctor((_context: IObservableContext<any>) => {
    context = _context;
  });
  // @ts-ignore
  return [observable, context] as TCreateObservableEmitterTuple<GObservableConstructor>;
}


/* INTERNAL */

export function LinkObservableAndObserver<T>(instance: IObservable<T>, observer: IObserver<T>): void {
  const privates: IObservablePrivate<T> = (instance as IObservableInternal<T>)[OBSERVABLE_PRIVATE];
  privates.observers.push(observer);
  privates.onObserveHook(observer);
}

export function UnLinkObservableAndObserver<T>(instance: IObservable<T>, observer: IObserver<T>): void {
  const privates: IObservablePrivate<T> = (instance as IObservableInternal<T>)[OBSERVABLE_PRIVATE];
  privates.observers.splice(privates.observers.indexOf(observer), 1);
  privates.onUnobserveHook(observer);
}

export function ObservableEmitAll<T>(instance: IObservable<T>, value: T): void {
  const privates: IObservablePrivate<T> = (instance as IObservableInternal<T>)[OBSERVABLE_PRIVATE];
  if (privates.emitting) {
    privates.pendingEmit.push(value);
  } else {
    privates.emitting = true;
    ObservableEmitAllUnsafe<T>(instance, value);
    while (privates.pendingEmit.length > 0) {
      ObservableEmitAllUnsafe<T>(instance, privates.pendingEmit.shift() as T);
    }
    privates.emitting = false;
  }
}

function ObservableEmitAllUnsafe<T>(instance: IObservable<T>, value: T): void {
  const observers: IObserver<T>[] = (instance as IObservableInternal<T>)[OBSERVABLE_PRIVATE].observers.slice(); // shallow copy in case observers mutate
  for (let i = 0, l = observers.length; i < l; i++) {
    (observers[i] as IObserverInternal<T>)[OBSERVER_PRIVATE].onEmit(value, instance);
  }
}
