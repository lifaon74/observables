import { ICancellableContext } from './interfaces';
import { ConstructClassWithPrivateMembers } from '../helpers/ClassWithPrivateMembers';
import {
  CANCELLABLE_CONTEXT_PRIVATE, ICancellableContextInternal, ICancellableContextPrivate, ICancellablePromiseAndController
} from './privates';
import { DeepMap } from '../../classes/DeepMap';
import { IsObject } from '../../helpers';

/** CONSTRUCTOR **/

export function ConstructCancellableContext(
  instance: ICancellableContext
): void {
  ConstructClassWithPrivateMembers(instance, CANCELLABLE_CONTEXT_PRIVATE);
  const privates: ICancellableContextPrivate = (instance as ICancellableContextInternal)[CANCELLABLE_CONTEXT_PRIVATE];
  privates.map = new DeepMap<ICancellablePromiseAndController<any>>();
}

export function IsCancellableContext(value: any): value is ICancellableContext {
  return IsObject(value)
    && value.hasOwnProperty(CANCELLABLE_CONTEXT_PRIVATE as symbol);
}
