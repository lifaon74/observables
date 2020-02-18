import { IActivableLike } from '../activable/interfaces';
import { TPromiseOrValue } from '../../promises/type-helpers';
import { ICancellablePromiseNormalizedOptions } from '../../promises/cancellable-promise/types';

/* ACTIVABLE */

export type TCancellableContextRegisterActivableOptionsMode = // if key is already present:
  'skip' // doesn't call the promise factory
  | 'warn' // doesn't call the promise factory and displays a warn message for the developer
  | 'throw' // doesn't call the promise factory and throws an error for the developer
  | 'replace' // cancels the previous promise, then calls the promise factory
  ;

export type TCancellableContextRegisterActivableFactory<TActivable extends IActivableLike> = () => TActivable;

export interface ICancellableContextRegisterActivableOptions {
  mode?: TCancellableContextRegisterActivableOptionsMode;
}

export interface ICancellableContextRegisterActivableNormalizedOptions {
  mode: TCancellableContextRegisterActivableOptionsMode;
}

/* CANCELLABLE PROMISE */

export type TCancellableContextRegisterCancellablePromiseOptionsMode = // if key is already present:
  TCancellableContextRegisterActivableOptionsMode
  | 'queue' // waits for previous promise to resolve or reject, then calls the promise factory
  ;
export type TCancellableContextRegisterCancellablePromiseFactory<T> = (options: ICancellablePromiseNormalizedOptions<'never'>) => TPromiseOrValue<T>;

export interface ICancellableContextRegisterCancellablePromiseOptions {
  mode?: TCancellableContextRegisterCancellablePromiseOptionsMode;
}

export interface ICancellableContextRegisterCancellablePromiseNormalizedOptions {
  mode: TCancellableContextRegisterCancellablePromiseOptionsMode;
}
