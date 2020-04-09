import { IObservableContextBase } from './interfaces';
import { IObservable } from '../../interfaces';
import { IObservableContextBaseInternal, OBSERVABLE_CONTEXT_BASE_PRIVATE } from './privates';
import { ConstructClassWithPrivateMembers } from '@lifaon/class-factory';


/** CONSTRUCTOR **/

let ALLOW_OBSERVABLE_CONTEXT_BASE_CONSTRUCT: boolean = false;

export function AllowObservableContextBaseConstruct(allow: boolean): void {
  ALLOW_OBSERVABLE_CONTEXT_BASE_CONSTRUCT = allow;
}

export function ConstructObservableContextBase<T>(instance: IObservableContextBase<T>, observable: IObservable<T>): void {
  if (ALLOW_OBSERVABLE_CONTEXT_BASE_CONSTRUCT) {
    ConstructClassWithPrivateMembers(instance, OBSERVABLE_CONTEXT_BASE_PRIVATE);
    (instance as IObservableContextBaseInternal<T>)[OBSERVABLE_CONTEXT_BASE_PRIVATE].observable = observable;
  } else {
    throw new TypeError(`Illegal constructor`);
  }
}

