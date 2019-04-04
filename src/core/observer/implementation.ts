import { IObserver, IObserverConstructor, TObserverConstructorArgs } from './interfaces';
import { IReadonlyList } from '../../misc/readonly-list/interfaces';
import { ReadonlyList } from '../../misc/readonly-list/implementation';
import { IObservable } from '../observable/interfaces';
import { ConstructClassWithPrivateMembers } from '../../misc/helpers/ClassWithPrivateMembers';
import { IsObservable, LinkObservableAndObserver, UnLinkObservableAndObserver } from '../observable/implementation';
import { Constructor, FactoryClass } from '../../classes/factory';

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


export function ConstructObserverPrivates<T>(observer: IObserver<T>): void {
  ConstructClassWithPrivateMembers(observer, OBSERVER_PRIVATE);
  (observer as IObserverInternal<T>)[OBSERVER_PRIVATE].activated = false;
  (observer as IObserverInternal<T>)[OBSERVER_PRIVATE].observables = [];
  (observer as IObserverInternal<T>)[OBSERVER_PRIVATE].readOnlyObservables = new ReadonlyList<IObservable<T>>((observer as IObserverInternal<T>)[OBSERVER_PRIVATE].observables);
}

export function ConstructObserver<T>(observer: IObserver<T>, onEmit: (value: T, observable?: IObservable<T>) => void): void {
  ConstructObserverPrivates<T>(observer);

  if (typeof onEmit === 'function') {
    (observer as IObserverInternal<T>)[OBSERVER_PRIVATE].onEmit = onEmit.bind(observer);
  } else {
    throw new TypeError(`Expected function as first argument of Observer.`);
  }
}

/**
 * Returns true if 'value' is an Observer
 * @param value
 * @internal
 */
export function IsObserver(value: any): boolean {
  return (typeof value === 'object') && (value !== null ) && value.hasOwnProperty(OBSERVER_PRIVATE);
}

/**
 * Activates an observer
 * @param observer
 * @exposed
 */
export function ObserverActivate<T, O extends IObserver<T>>(observer: O): O {
  if (!((observer as unknown) as IObserverInternal<T>)[OBSERVER_PRIVATE].activated) {
    ((observer as unknown) as IObserverInternal<T>)[OBSERVER_PRIVATE].activated = true;
    const observables: IObservable<T>[] = ((observer as unknown) as IObserverInternal<T>)[OBSERVER_PRIVATE].observables;
    for (let i = 0, l = observables.length; i < l; i++) {
      LinkObservableAndObserver<T>(observables[i], observer);
    }
  }
  return observer;
}

/**
 * Deactivates an observer
 * @param observer
 * @exposed
 */
export function ObserverDeactivate<T, O extends IObserver<T>>(observer: O): O {
  if (((observer as unknown) as IObserverInternal<T>)[OBSERVER_PRIVATE].activated) {
    ((observer as unknown) as IObserverInternal<T>)[OBSERVER_PRIVATE].activated = false;
    const observables: IObservable<T>[] = ((observer as unknown) as IObserverInternal<T>)[OBSERVER_PRIVATE].observables;
    for (let i = 0, l = observables.length; i < l; i++) {
      UnLinkObservableAndObserver<T>(observables[i], observer);
    }
  }
  return observer;
}

/**
 * Links an Observer with an Observable
 * @param observer
 * @param observables
 * @exposed
 */
export function ObserverObserve<T, O extends IObserver<T>>(observer: O, observables: IObservable<T>[]): O {
  for (let i = 0, l = observables.length; i < l; i++) {
    const observable: IObservable<T> = observables[i];
    if (IsObservable(observable)) {
      if (((observer as unknown) as IObserverInternal<T>)[OBSERVER_PRIVATE].observables.includes(observable)) {
        throw new Error(`Already observing this Observable`);
      } else {
        ((observer as unknown) as IObserverInternal<T>)[OBSERVER_PRIVATE].observables.push(observable);
        if (((observer as unknown) as IObserverInternal<T>)[OBSERVER_PRIVATE].activated) {
          LinkObservableAndObserver<T>(observables[i], observer);
        }
      }
    } else {
      throw new TypeError(`Expected Observable as argument #${i + 1} of Observer.observe.`);
    }
  }
  return observer;

}


/**
 * Unlinks an Observer with an Observable
 * @param observer
 * @param observables
 * @exposed
 */
export function ObserverUnobserve<T, O extends IObserver<T>>(observer: O, observables: IObservable<T>[]): O {
  for (let i = 0, l = observables.length; i < l; i++) {
    if (IsObservable(observables[i])) {
      ObserverUnobserveOne<T>(observer, observables[i]);
    } else {
      throw new TypeError(`Expected Observable as argument #${i + 1} of Observer.unobserve.`);
    }
  }
  return observer;
}

/**
 * Unobserves on observable
 * @param observer
 * @param observable
 * @internal
 */
export function ObserverUnobserveOne<T>(observer: IObserver<T>, observable: IObservable<T>): void {
  const index: number = (observer as IObserverInternal<T>)[OBSERVER_PRIVATE].observables.indexOf(observable);
  if (index === -1) {
    throw new Error(`Not observing this Observable`);
  } else {
    (observer as IObserverInternal<T>)[OBSERVER_PRIVATE].observables.splice(index, 1);
    if ((observer as IObserverInternal<T>)[OBSERVER_PRIVATE].activated) {
      UnLinkObservableAndObserver<T>(observable, observer);
    }
  }
}

/**
 * Unlinks all Observables of on Observer
 * @param observer
 * @exposed
 */
export function ObserverUnobserveAll<T, O extends IObserver<T>>(observer: O): O {
  for (let i = 0, l = ((observer as unknown) as IObserverInternal<T>)[OBSERVER_PRIVATE].observables.length; i < l; i++) {
    if (((observer as unknown) as IObserverInternal<T>)[OBSERVER_PRIVATE].activated) {
      UnLinkObservableAndObserver<T>(((observer as unknown) as IObserverInternal<T>)[OBSERVER_PRIVATE].observables[i], observer);
    }
  }
  ((observer as unknown) as IObserverInternal<T>)[OBSERVER_PRIVATE].observables.length = 0;
  return observer;
}


export function ObserverFactory<TBase extends Constructor>(superClass: TBase) {
  type T = any;
  return FactoryClass(class Observer extends superClass implements IObserver<T> {
    constructor(...args: any[]) {
      const [onEmit]: TObserverConstructorArgs<T> = args[0];
      super(...args.slice(1));
      ConstructObserver<T>(this, onEmit);
    }

    get activated(): boolean {
      return ((this as unknown) as IObserverInternal<T>)[OBSERVER_PRIVATE].activated;
    }

    get observables(): IReadonlyList<IObservable<T>> {
      return ((this as unknown) as IObserverInternal<T>)[OBSERVER_PRIVATE].readOnlyObservables;
    }

    get observing(): boolean {
      return (((this as unknown) as IObserverInternal<T>)[OBSERVER_PRIVATE].observables.length > 0);
    }

    emit(value: T, observable?: IObservable<T>): void {
      if (((this as unknown) as IObserverInternal<T>)[OBSERVER_PRIVATE].activated) {
        ((this as unknown) as IObserverInternal<T>)[OBSERVER_PRIVATE].onEmit(value, observable);
      }
    }

    activate(): this {
      return ObserverActivate<T, this>(this);
    }

    deactivate(): this {
      return ObserverDeactivate<T, this>(this);
    }

    observe(...observables: IObservable<T>[]): this {
      return ObserverObserve<T, this>(this, observables);
    }

    unobserve(...observables: IObservable<T>[]): this {
      return ObserverUnobserve<T, this>(this, observables);
    }

    disconnect(): this {
      return ObserverUnobserveAll<T, this>(this);
    }

  })<TObserverConstructorArgs<T>>('Observer');
}

export const Observer: IObserverConstructor = class Observer extends ObserverFactory<ObjectConstructor>(Object) {
  constructor(onEmit: (value: any, observable?: IObservable<any>) => void) {
    super([onEmit]);
  }
};
