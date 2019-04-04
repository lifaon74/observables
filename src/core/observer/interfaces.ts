import { IReadonlyList } from '../../misc/readonly-list/interfaces';
import { IObservable } from '../observable/interfaces';

export type TObserverConstructorArgs<T> = [(value: T, observable?: IObservable<T>) => void];

export interface IObserverConstructor {
  // creates an Observer
  new<T>(onEmit: (value: T, observable?: IObservable<T>) => void): IObserver<T>;
}

export interface IObserverTypedConstructor<T> {
  new(onEmit: (value: T, observable?: IObservable<T>) => void): IObserver<T>;
}

/**
 * A Observer is a push destination: it receives data though 'emit'
 */
export interface IObserver<T> {
  // true if Observer is activated
  readonly activated: boolean;
  // list of Observables observed by this Observer
  readonly observables: IReadonlyList<IObservable<T>>;
  // true if Observer is observing at least one Observable
  readonly observing: boolean;

  // emit a value
  emit(value: T, observable?: IObservable<T>): void;

  // activates the Observer
  activate(): this;

  // deactivates the Observer
  deactivate(): this


  // observes a list of Observables
  observe(...observables: IObservable<T>[]): this;

  // stops observing a list of Observables
  unobserve(...observables: IObservable<T>[]): this;

  // stops observing all its Observables
  disconnect(): this;
}

// returns the type of an Observer
export type ObserverType<T extends IObserver<any>> = T extends IObserver<infer R> ? R : never;
