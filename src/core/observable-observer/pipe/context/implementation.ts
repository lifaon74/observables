import { IObserver } from '../../../observer/interfaces';
import { IObservable } from '../../../observable/interfaces';
import { IPipeContext, IPipeContextConstructor } from './interfaces';
import { ObservableType } from '../../../observable/types';
import { IPipeContextInternal, PIPE_CONTEXT_PRIVATE } from './privates';
import { ObservableEmitAll } from '../../../observable/functions';
import { IPipe } from '../interfaces';
import { AllowPipeContextConstruct, ConstructPipeContext } from './constructor';

/** NEW **/

export function NewPipeContext<TObserver extends IObserver<any>, TObservable extends IObservable<any>>(instance: IPipe<TObserver, TObservable>): IPipeContext<TObserver, TObservable> {
  AllowPipeContextConstruct(true);
  const context: IPipeContext<TObserver, TObservable> = new ((PipeContext as unknown) as IPipeContextConstructor)<TObserver, TObservable>(instance);
  AllowPipeContextConstruct(false);
  return context;
}

/** METHODS **/

/* GETTERS/SETTERS */

export function PipeContextGetPipe<TObserver extends IObserver<any>, TObservable extends IObservable<any>>(
  instance: IPipeContext<TObserver, TObservable>,
): IPipe<TObserver, TObservable> {
  return (instance as IPipeContextInternal<TObserver, TObservable>)[PIPE_CONTEXT_PRIVATE].pipe;
}

/* METHODS */

export function PipeContextEmit<TObserver extends IObserver<any>, TObservable extends IObservable<any>>(instance: IPipeContext<TObserver, TObservable>, value: ObservableType<TObservable>): void {
  if ((instance as IPipeContextInternal<TObserver, TObservable>)[PIPE_CONTEXT_PRIVATE].pipe === null) {
    throw new Error(`Cannot emit any value until pipe is fully created.`);
  } else {
    ObservableEmitAll<ObservableType<TObservable>>((instance as IPipeContextInternal<TObserver, TObservable>)[PIPE_CONTEXT_PRIVATE].pipe.observable, value);
  }
}

/** CLASS **/

/* PRIVATE */
export class PipeContext<TObserver extends IObserver<any>, TObservable extends IObservable<any>> implements IPipeContext<TObserver, TObservable> {

  protected constructor(pipe: IPipe<TObserver, TObservable>) {
    ConstructPipeContext<TObserver, TObservable>(this, pipe);
  }

  get pipe(): IPipe<TObserver, TObservable> {
    return PipeContextGetPipe<TObserver, TObservable>(this);
  }

  emit(value: ObservableType<TObservable>): void {
    PipeContextEmit<TObserver, TObservable>(this, value);
  }
}
