import { IObserver } from '../../../observer/interfaces';
import { IObservable } from '../../../observable/interfaces';
import { IPipeContext } from './interfaces';
import { IPipe } from '../interfaces';
import { IPipeContextInternal, PIPE_CONTEXT_PRIVATE } from './privates';
import { ConstructClassWithPrivateMembers } from '@lifaon/class-factory';

/** CONSTRUCTOR **/

let ALLOW_PIPE_CONTEXT_CONSTRUCT: boolean = false;

export function AllowPipeContextConstruct(allow: boolean): void {
  ALLOW_PIPE_CONTEXT_CONSTRUCT = allow;
}

export function ConstructPipeContext<TObserver extends IObserver<any>, TObservable extends IObservable<any>>(instance: IPipeContext<TObserver, TObservable>, pipe: IPipe<TObserver, TObservable>): void {
  if (ALLOW_PIPE_CONTEXT_CONSTRUCT) {
    ConstructClassWithPrivateMembers(instance, PIPE_CONTEXT_PRIVATE);
    (instance as IPipeContextInternal<TObserver, TObservable>)[PIPE_CONTEXT_PRIVATE].pipe = pipe;
  } else {
    throw new TypeError('Illegal constructor');
  }
}
