import { IPipe, IPipeConstructor } from './interfaces';
import { IPipeContext } from './context/interfaces';
import { IObserver } from '../../observer/interfaces';
import { IObservable } from '../../observable/interfaces';
import { IPipeHook } from './hook/interfaces';
import { IsObject, noop } from '../../../helpers';
import { NewPipeContext } from './context/implementation';
import { Observer, ObserverActivate, ObserverDeactivate } from '../../observer/implementation';
import { Observable } from '../../observable/implementation';
import { IPipeContextInternal, PIPE_CONTEXT_PRIVATE } from './context/privates';
import { IObservableObserver } from '../interfaces';
import { ConstructPipe } from './constructor';
import { IPipeInternal, PIPE_PRIVATE } from './privates';
import { TPipeActivateMode } from './types';
import { ObserverType } from '../../observer/types';
import { PipeSetAutoActivate, PipeSetAutoDeactivate } from './functions';


/** METHODS **/

/* GETTERS/SETTERS */

export function PipeGetObserver<TObserver extends IObserver<any>, TObservable extends IObservable<any>>(instance: IPipe<TObserver, TObservable>): TObserver {
  return (instance as IPipeInternal<TObserver, TObservable>)[PIPE_PRIVATE].observer;
}

export function PipeGetObservable<TObserver extends IObserver<any>, TObservable extends IObservable<any>>(instance: IPipe<TObserver, TObservable>): TObservable {
  return (instance as IPipeInternal<TObserver, TObservable>)[PIPE_PRIVATE].observable;
}

export function PipeGetActivateMode<TObserver extends IObserver<any>, TObservable extends IObservable<any>>(instance: IPipe<TObserver, TObservable>): TPipeActivateMode {
  return (instance as IPipeInternal<TObserver, TObservable>)[PIPE_PRIVATE].autoActivate ? 'auto' : 'manual';
}

export function PipeGetDeactivateMode<TObserver extends IObserver<any>, TObservable extends IObservable<any>>(instance: IPipe<TObserver, TObservable>): TPipeActivateMode {
  return (instance as IPipeInternal<TObserver, TObservable>)[PIPE_PRIVATE].autoDeactivate ? 'auto' : 'manual';
}


/* METHODS */

export function PipeActivate<TObserver extends IObserver<any>, TObservable extends IObservable<any>>(instance: IPipe<TObserver, TObservable>, mode: TPipeActivateMode): void {
  switch (mode) {
    case 'auto':
      PipeSetAutoActivate<TObserver, TObservable>(instance, true);
      break;
    case 'manual':
      PipeSetAutoDeactivate<TObserver, TObservable>(instance, false);
      ObserverActivate<ObserverType<TObserver>>(instance.observer);
      break;
    default:
      throw new TypeError(`Expected 'auto' or 'manual' as activate mode.`);
  }
}

export function PipeDeactivate<TObserver extends IObserver<any>, TObservable extends IObservable<any>>(instance: IPipe<TObserver, TObservable>, mode: TPipeActivateMode): void {
  switch (mode) {
    case 'auto':
      PipeSetAutoDeactivate<TObserver, TObservable>(instance, true);
      break;
    case 'manual':
      PipeSetAutoActivate<TObserver, TObservable>(instance, false);
      ObserverDeactivate<ObserverType<TObserver>>(instance.observer);
      break;
    default:
      throw new TypeError(`Expected 'auto' or 'manual' as deactivate mode.`);
  }
}

/* STATIC METHODS */

export function PipeStaticCreate<TValueObserver, TValueObservable>(
  constructor: IPipeConstructor,
  create: (context: IPipeContext<IObserver<TValueObserver>, IObservable<TValueObservable>>) => (IPipeHook<IObserver<TValueObserver>, IObservable<TValueObservable>> | void) = noop
): IPipe<IObserver<TValueObserver>, IObservable<TValueObservable>> {

  type TObserver = IObserver<TValueObserver>;
  type TObservable = IObservable<TValueObservable>;

  if (typeof create === 'function') {
    const context: IPipeContext<IObserver<TValueObserver>, IObservable<TValueObservable>> = NewPipeContext<TObserver, TObservable>(null as any); // force 'pipe' to null because it will be set later
    let hook: IPipeHook<TObserver, TObservable> | void = create(context);
    if (hook === void 0) {
      hook = {};
    }
    if (IsObject(hook)) {
      const pipe = new constructor<IObserver<TValueObserver>, IObservable<TValueObservable>>(() => {
        return {
          observer: new Observer(
            ((hook as IPipeHook<TObserver, TObservable>).onEmit === void 0)
              ? context.emit.bind(context)
              : (hook as IPipeHook<TObserver, TObservable>).onEmit
          ),
          observable: new Observable<TValueObservable>(() => hook),
        };
      });
      (context as IPipeContextInternal<TObserver, TObservable>)[PIPE_CONTEXT_PRIVATE].pipe = pipe;
      return pipe;
    } else {
      throw new TypeError(`Expected object as return of Pipe's create function.`);
    }
  } else {
    throw new TypeError(`Expected function as Pipe's create function.`);
  }
}


/** CLASS **/

export class Pipe<TObserver extends IObserver<any>, TObservable extends IObservable<any>> implements IPipe<TObserver, TObservable> {
  static create<TValueObserver, TValueObservable = TValueObserver>(
    create?: (context: IPipeContext<IObserver<TValueObserver>, IObservable<TValueObservable>>) => (IPipeHook<IObserver<TValueObserver>, IObservable<TValueObservable>> | void)
  ): IPipe<IObserver<TValueObserver>, IObservable<TValueObservable>> {
    return PipeStaticCreate<TValueObserver, TValueObservable>(this, create);
  }

  constructor(create: () => IObservableObserver<TObserver, TObservable>) {
    ConstructPipe<TObserver, TObservable>(this, create);
  }

  get observer(): TObserver {
    return PipeGetObserver<TObserver, TObservable>(this);
  }

  get observable(): TObservable {
    return PipeGetObservable<TObserver, TObservable>(this);
  }


  /**
   * OBSERVER
   */

  get activateMode(): TPipeActivateMode {
    return PipeGetActivateMode<TObserver, TObservable>(this);
  }

  get deactivateMode(): TPipeActivateMode {
    return PipeGetDeactivateMode<TObserver, TObservable>(this);
  }

  get activated(): boolean {
    return this.observer.activated;
  }

  activate(mode: TPipeActivateMode = 'manual'): this {
    PipeActivate<TObserver, TObservable>(this, mode);
    return this;
  }

  deactivate(mode: TPipeActivateMode = 'manual'): this {
    PipeDeactivate<TObserver, TObservable>(this, mode);
    return this;
  }
}
