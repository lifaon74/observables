import { DeepMap } from '../../classes/DeepMap';
import { ICancellablePromise } from '../../promises/cancellable-promise/interfaces';
import { IAdvancedAbortController } from '../advanced-abort-controller/interfaces';
import { ICancellableContext } from './interfaces';

/** PRIVATES **/

export interface ICancellablePromiseAndController<T> {
  promise: ICancellablePromise<T>;
  controller: IAdvancedAbortController;
}

export const CANCELLABLE_CONTEXT_PRIVATE = Symbol('cancellable-context-private');

export interface ICancellableContextPrivate {
  map: DeepMap<ICancellablePromiseAndController<any>>;
}

export interface ICancellableContextPrivatesInternal {
  [CANCELLABLE_CONTEXT_PRIVATE]: ICancellableContextPrivate;
}

export interface ICancellableContextInternal extends ICancellableContextPrivatesInternal, ICancellableContext {
}
