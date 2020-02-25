import { IFiniteStateObservable, IFiniteStateObservableConstructor } from '../../../interfaces';
import {
  IPromiseObservableFromPromiseOptions, IPromiseObservableKeyValueMap, IPromiseObservableOptions,
  TPromiseObservableFactory, TPromiseObservableFinalState, TPromiseObservableMode
} from './types';

/** INTERFACES **/

export interface IPromiseObservableStatic extends Omit<IFiniteStateObservableConstructor, 'new'> {
  fromPromise<T>(promise: Promise<T>, options?: IPromiseObservableFromPromiseOptions): IPromiseObservable<T>;
}

export interface IPromiseObservableConstructor extends IPromiseObservableStatic {
  new<T>(promiseFactory: TPromiseObservableFactory<T>, options?: IPromiseObservableOptions): IPromiseObservable<T>;
}

export interface IPromiseObservableTypedConstructor<T> extends IPromiseObservableStatic {
  new(promiseFactory: TPromiseObservableFactory<T>, options?: IPromiseObservableOptions): IPromiseObservable<T>;
}


/**
 * A PromiseObservable allows to build classes that transform Promises to Observables.
 */
export interface IPromiseObservable<T> extends IFiniteStateObservable<T, TPromiseObservableFinalState, TPromiseObservableMode, IPromiseObservableKeyValueMap<T>> {
}





