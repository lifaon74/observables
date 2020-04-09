import { IObserver, IObserverConstructor, IObserverTypedConstructor } from './interfaces';
import { IReadonlyList } from '../../misc/readonly-list/interfaces';
import { ReadonlyList } from '../../misc/readonly-list/implementation';
import { IObservable } from '../observable/interfaces';
import { IsObservable } from '../observable/constructor';
import { LinkObservableAndObserver, UnLinkObservableAndObserver } from '../observable/functions';
import { IObserverInternal, IObserverPrivate, OBSERVER_PRIVATE } from './privates';
import { ConstructObserver } from './constructor';
import { TObserverConstructorArgs, TObserverObserveResultNonCyclic, TObserverUnObserveResultNonCyclic } from './types';
import { BaseClass, Constructor, IBaseClassConstructor, MakeFactory } from '@lifaon/class-factory';

/** METHODS **/

/* GETTERS/SETTERS */

export function ObserverGetActivated<T>(instance: IObserver<T>): boolean {
  return ((instance as IObserver<T>) as IObserverInternal<T>)[OBSERVER_PRIVATE].activated;
}

export function ObserverGetObservables<T>(instance: IObserver<T>): IReadonlyList<IObservable<T>> {
  const privates: IObserverPrivate<T> = ((instance as IObserver<T>) as IObserverInternal<T>)[OBSERVER_PRIVATE];
  if (privates.readOnlyObservables === void 0) {
    privates.readOnlyObservables = new ReadonlyList<IObservable<T>>(privates.observables);
  }
  return privates.readOnlyObservables;
}

export function ObserverGetObserving<T>(instance: IObserver<T>): boolean {
  return ((instance as IObserver<T>) as IObserverInternal<T>)[OBSERVER_PRIVATE].observables.length > 0;
}

/* METHODS */

/**
 * Emits a value for an Observer
 */
export function ObserverEmit<T>(instance: IObserver<T>, value: T, observable?: IObservable<T>): void {
  const privates: IObserverPrivate<T> = (instance as IObserverInternal<T>)[OBSERVER_PRIVATE];
  if (privates.activated) {
    privates.onEmit(value, observable);
  }
}

/**
 * Activates an Observer
 */
export function ObserverActivate<T>(instance: IObserver<T>): void {
  const privates: IObserverPrivate<T> = (instance as IObserverInternal<T>)[OBSERVER_PRIVATE];
  if (!privates.activated) {
    privates.activated = true;
    const observables: IObservable<T>[] = privates.observables;
    for (let i = 0, l = observables.length; i < l; i++) {
      LinkObservableAndObserver<T>(observables[i], instance);
    }
  }
}

/**
 * Deactivates an Observer
 */
export function ObserverDeactivate<T>(instance: IObserver<T>): void {
  const privates: IObserverPrivate<T> = (instance as IObserverInternal<T>)[OBSERVER_PRIVATE];
  if (privates.activated) {
    privates.activated = false;
    const observables: IObservable<T>[] = privates.observables;
    for (let i = 0, l = observables.length; i < l; i++) {
      UnLinkObservableAndObserver<T>(observables[i], instance);
    }
  }
}

/**
 * Links an Observer with an Observable
 */
export function ObserverObserve<T>(instance: IObserver<T>, observables: IObservable<T>[]): void {
  const privates: IObserverPrivate<T> = (instance as IObserverInternal<T>)[OBSERVER_PRIVATE];
  for (let i = 0, l = observables.length; i < l; i++) {
    const observable: IObservable<T> = observables[i];
    if (IsObservable(observable)) {
      if (privates.observables.includes(observable)) {
        throw new Error(`Already observing this Observable`);
      } else {
        privates.observables.push(observable);
        if (privates.activated) {
          LinkObservableAndObserver<T>(observables[i], instance);
        }
      }
    } else {
      throw new TypeError(`Expected Observable as argument #${ i + 1 } of Observer.observe.`);
    }
  }
}


/**
 * Unlinks an Observer with an Observable
 */
export function ObserverUnobserve<T>(instance: IObserver<T>, observables: IObservable<T>[]): void {
  for (let i = 0, l = observables.length; i < l; i++) {
    if (IsObservable(observables[i])) {
      ObserverUnobserveOne<T>(instance, observables[i]);
    } else {
      throw new TypeError(`Expected Observable as argument #${ i + 1 } of Observer.unobserve.`);
    }
  }
}

/**
 * Unobserves one observable
 */
export function ObserverUnobserveOne<T>(instance: IObserver<T>, observable: IObservable<T>): void {
  const privates: IObserverPrivate<T> = (instance as IObserverInternal<T>)[OBSERVER_PRIVATE];
  const index: number = privates.observables.indexOf(observable);
  if (index === -1) {
    throw new Error(`Not observing this Observable`);
  } else {
    privates.observables.splice(index, 1);
    if (privates.activated) {
      UnLinkObservableAndObserver<T>(observable, instance);
    }
  }
}

/**
 * Unlinks all Observables of on Observer
 */
export function ObserverUnobserveAll<T>(instance: IObserver<T>): void {
  const privates: IObserverPrivate<T> = (instance as IObserverInternal<T>)[OBSERVER_PRIVATE];
  for (let i = 0, l = privates.observables.length; i < l; i++) {
    if (privates.activated) {
      UnLinkObservableAndObserver<T>(privates.observables[i], instance);
    }
  }
  privates.observables.length = 0;
}


/** CLASS AND FACTORY **/

function PureObserverFactory<TBase extends Constructor>(superClass: TBase) {
  type T = any;

  return class Observer extends superClass implements IObserver<T> {
    constructor(...args: any[]) {
      const [onEmit]: TObserverConstructorArgs<T> = args[0];
      super(...args.slice(1));
      ConstructObserver<T>(this, onEmit);
    }

    get activated(): boolean {
      return ObserverGetActivated<T>(this);
    }

    get observables(): IReadonlyList<IObservable<T>> {
      return ObserverGetObservables<T>(this);
    }

    get observing(): boolean {
      return ObserverGetObserving<T>(this);
    }

    emit(value: T, observable?: IObservable<T>): void {
      ObserverEmit<T>(this, value, observable);
    }

    activate(): this {
      ObserverActivate<T>(this);
      return this;
    }

    deactivate(): this {
      ObserverDeactivate<T>(this);
      return this;
    }

    observe<O extends IObservable<T>[]>(...observables: O): TObserverObserveResultNonCyclic<O, T, this> {
      ObserverObserve<T>(this, observables);
      return this as TObserverObserveResultNonCyclic<O, T, this>;
    }

    unobserve<O extends IObservable<T>[]>(...observables: O): TObserverUnObserveResultNonCyclic<O, T, this> {
      ObserverUnobserve<T>(this, observables);
      return this as TObserverUnObserveResultNonCyclic<O, T, this>;
    }

    disconnect(): this {
      ObserverUnobserveAll<T>(this);
      return this;
    }

  };
}

export let Observer: IObserverConstructor;

export function ObserverFactory<TBase extends Constructor, T = unknown>(superClass: TBase) {
  return MakeFactory<IObserverTypedConstructor<T>, [], TBase>(PureObserverFactory, [], superClass, {
    name: 'Observer',
    instanceOf: Observer,
  });
}

Observer = class Observer extends ObserverFactory<IBaseClassConstructor>(BaseClass) {
  constructor(onEmit: (value: any, observable?: IObservable<any>) => void) {
    super([onEmit]);
  }
} as IObserverConstructor;
