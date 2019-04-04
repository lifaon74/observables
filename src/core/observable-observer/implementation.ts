import { IObservableObserver, IPipe, IPipeContext, IPipeContextConstructor, IPipeHook, TObservableObserverActivateMode } from './interfaces';
import { IObservable, ObservableType } from '../observable/interfaces';
import { IObserver, ObserverType } from '../observer/interfaces';
import { IObservableInternal, IObservablePrivate, Observable, OBSERVABLE_PRIVATE, ObservableEmitAll } from '../observable/implementation';
import { IObserverInternal, Observer, OBSERVER_PRIVATE, ObserverActivate, ObserverDeactivate } from '../observer/implementation';
import { ConstructClassWithPrivateMembers } from '../../misc/helpers/ClassWithPrivateMembers';
import { noop } from '../../helpers';


export const PIPE_PRIVATE = Symbol('pipe-private');

export interface IPipePrivate<TObserver extends IObserver<any>, TObservable extends IObservable<any>> {
  observer: TObserver;
  observable: TObservable;

  autoActivate: boolean;
  autoDeactivate: boolean;
}

export interface IPipeInternal<TObserver extends IObserver<any>, TObservable extends IObservable<any>> extends IPipe<TObserver, TObservable> {
  [PIPE_PRIVATE]: IPipePrivate<TObserver, TObservable>;
}

export function ConstructPipe<TObserver extends IObserver<any>, TObservable extends IObservable<any>>(instance: IPipe<TObserver, TObservable>, create: () => IObservableObserver<TObserver, TObservable>): void {
  ConstructClassWithPrivateMembers(instance, PIPE_PRIVATE);
  ((instance as unknown) as IPipeInternal<TObserver, TObservable>)[PIPE_PRIVATE].autoActivate = true;
  ((instance as unknown) as IPipeInternal<TObserver, TObservable>)[PIPE_PRIVATE].autoDeactivate = true;

  if (typeof create === 'function') {
    const result: IObservableObserver<TObserver, TObservable> = create.call(instance);

    if ((typeof result === 'object') && (result !== null)) {

      if (OBSERVER_PRIVATE in result.observer) {
        ((instance as unknown) as IPipeInternal<TObserver, TObservable>)[PIPE_PRIVATE].observer = result.observer;
      } else {
        throw new TypeError(`Expected property observer of type Observer in return of Pipe's create function`);
      }

      if (OBSERVABLE_PRIVATE in result.observable) {
        ((instance as unknown) as IPipeInternal<TObserver, TObservable>)[PIPE_PRIVATE].observable = result.observable;
        type TValueObservable = ObservableType<TObservable>;
        const observablePrivate: IObservablePrivate<TValueObservable> = ((((instance as unknown) as IPipeInternal<TObserver, TObservable>)[PIPE_PRIVATE].observable as unknown) as IObservableInternal<TValueObservable>)[OBSERVABLE_PRIVATE];

        const onObserveHook = observablePrivate.onObserveHook;
        observablePrivate.onObserveHook = (observer: IObserver<TValueObservable>) => {
          PipeUpdateAutoActivate<TObserver, TObservable>(instance);
          onObserveHook(observer);
        };

        const onUnobserveHook = observablePrivate.onUnobserveHook;
        observablePrivate.onUnobserveHook = (observer: IObserver<TValueObservable>) => {
          PipeUpdateAutoDeactivate<TObserver, TObservable>(instance);
          onUnobserveHook(observer);
        };
      } else {
        throw new TypeError(`Expected property observable of type Observable in return of Pipe's create function`);
      }
    } else {
      throw new TypeError(`Expected { observable, observer } as return of Pipe's create function.`);
    }
  } else {
    throw new TypeError(`Expected function as Pipe's create function.`);
  }
}


export function PipeActivate<TObserver extends IObserver<any>, TObservable extends IObservable<any>, O extends IPipe<TObserver, TObservable>>(instance: O, mode: TObservableObserverActivateMode): O {
  switch (mode) {
    case 'auto':
      PipeSetAutoActivate<TObserver, TObservable>(instance, true);
      break;
    case 'manual':
      PipeSetAutoDeactivate<TObserver, TObservable>(instance, false);
      ObserverActivate<ObserverType<TObserver>, TObserver>(instance.observer);
      break;
    default:
      throw new TypeError(`Expected 'auto' or 'manual' as activate mode.`)
  }

  return instance;
}

export function PipeDeactivate<TObserver extends IObserver<any>, TObservable extends IObservable<any>, O extends IPipe<TObserver, TObservable>>(instance: O, mode: TObservableObserverActivateMode): O {
  switch (mode) {
    case 'auto':
      PipeSetAutoDeactivate<TObserver, TObservable>(instance, true);
      break;
    case 'manual':
      PipeSetAutoActivate<TObserver, TObservable>(instance, false);
      ObserverDeactivate<ObserverType<TObserver>, TObserver>(instance.observer);
      break;
    default:
      throw new TypeError(`Expected 'auto' or 'manual' as deactivate mode.`)
  }

  return instance;
}


export function PipeSetAutoActivate<TObserver extends IObserver<any>, TObservable extends IObservable<any>>(instance: IPipe<TObserver, TObservable>, value: boolean): void {
  if (value !== (instance as IPipeInternal<TObserver, TObservable>)[PIPE_PRIVATE].autoActivate) {
    (instance as IPipeInternal<TObserver, TObservable>)[PIPE_PRIVATE].autoActivate = value;
    PipeUpdateAutoActivate<TObserver, TObservable>(instance);
  }
}

export function PipeSetAutoDeactivate<TObserver extends IObserver<any>, TObservable extends IObservable<any>>(instance: IPipe<TObserver, TObservable>, value: boolean): void {
  if (value !== (instance as IPipeInternal<TObserver, TObservable>)[PIPE_PRIVATE].autoDeactivate) {
    (instance as IPipeInternal<TObserver, TObservable>)[PIPE_PRIVATE].autoDeactivate = value;
    PipeUpdateAutoDeactivate<TObserver, TObservable>(instance);
  }
}


export function PipeUpdateAutoActivate<TObserver extends IObserver<any>, TObservable extends IObservable<any>>(instance: IPipe<TObserver, TObservable>): void {
  if (
    (instance as IPipeInternal<TObserver, TObservable>)[PIPE_PRIVATE].autoActivate
    && !(((instance as IPipeInternal<TObserver, TObservable>)[PIPE_PRIVATE].observer as unknown) as IObserverInternal<ObserverType<TObserver>>)[OBSERVER_PRIVATE].activated
    && ((((instance as IPipeInternal<TObserver, TObservable>)[PIPE_PRIVATE].observable as unknown) as IObservableInternal<ObservableType<TObservable>>)[OBSERVABLE_PRIVATE].observers.length > 0)
  ) {
    ObserverActivate<ObserverType<TObserver>, TObserver>(instance.observer);
  }
}

export function PipeUpdateAutoDeactivate<TObserver extends IObserver<any>, TObservable extends IObservable<any>>(instance: IPipe<TObserver, TObservable>): void {
  if (
    (instance as IPipeInternal<TObserver, TObservable>)[PIPE_PRIVATE].autoActivate
    && (((instance as IPipeInternal<TObserver, TObservable>)[PIPE_PRIVATE].observer as unknown) as IObserverInternal<ObserverType<TObserver>>)[OBSERVER_PRIVATE].activated
    && ((((instance as IPipeInternal<TObserver, TObservable>)[PIPE_PRIVATE].observable as unknown) as IObservableInternal<ObservableType<TObservable>>)[OBSERVABLE_PRIVATE].observers.length === 0)
  ) {
    ObserverDeactivate<ObserverType<TObserver>, TObserver>(instance.observer);
  }
}


export function PipeStaticCreate<TValueObserver, TValueObservable>(
  create: (context: IPipeContext<TValueObserver, TValueObservable>) => (IPipeHook<TValueObserver, TValueObservable> | void) = noop
): IPipe<IObserver<TValueObserver>, IObservable<TValueObservable>> {
  if (typeof create === 'function') {
    const context: IPipeContext<TValueObserver, TValueObservable> = NewPipeContext<TValueObserver, TValueObservable>(null);
    let hook: IPipeHook<TValueObserver, TValueObservable> | void = create(context);
    if (hook === void 0) {
      hook = {};
    }
    if ((typeof hook === 'object') && (hook !== null)) {
      const pipe = new Pipe<IObserver<TValueObserver>, IObservable<TValueObservable>>(() => {
        return {
          observer: new Observer(
            ((hook as IPipeHook<TValueObserver, TValueObservable>).onEmit === void 0)
              ? context.emit.bind(context)
              : (hook as IPipeHook<TValueObserver, TValueObservable>).onEmit
          ),
          observable: new Observable<TValueObservable>(() => hook),
        };
      });
      (context as IPipeContextInternal<TValueObserver, TValueObservable>)[PIPE_CONTEXT_PRIVATE].pipe = pipe;
      return pipe;
    } else {
      throw new TypeError(`Expected object as return of Pipe's create function.`);
    }
  } else {
    throw new TypeError(`Expected function as Pipe's create function.`);
  }
}

export class Pipe<TObserver extends IObserver<any>, TObservable extends IObservable<any>> implements IPipe<TObserver, TObservable> {
  static create<TValueObserver, TValueObservable = TValueObserver>(
    create?: (context: IPipeContext<TValueObserver, TValueObservable>) => (IPipeHook<TValueObserver, TValueObservable> | void)
  ): IPipe<IObserver<TValueObserver>, IObservable<TValueObservable>> {
    return PipeStaticCreate<TValueObserver, TValueObservable>(create);
  }

  constructor(create: () => IObservableObserver<TObserver, TObservable>) {
    ConstructPipe<TObserver, TObservable>(this, create);
  }

  get observer(): TObserver {
    return ((this as unknown) as IPipeInternal<TObserver, TObservable>)[PIPE_PRIVATE].observer;
  }

  get observable(): TObservable {
    return ((this as unknown) as IPipeInternal<TObserver, TObservable>)[PIPE_PRIVATE].observable;
  }


  /**
   * OBSERVER
   */

  get activateMode(): TObservableObserverActivateMode {
    return ((this as unknown) as IPipeInternal<TObserver, TObservable>)[PIPE_PRIVATE].autoActivate ? 'auto' : 'manual';
  }

  get deactivateMode(): TObservableObserverActivateMode {
    return ((this as unknown) as IPipeInternal<TObserver, TObservable>)[PIPE_PRIVATE].autoDeactivate ? 'auto' : 'manual';
  }

  get activated(): boolean {
    return this.observer.activated;
  }

  activate(mode: TObservableObserverActivateMode = 'manual'): this {
    return PipeActivate<TObserver, TObservable, this>(this, mode);
  }

  deactivate(mode: TObservableObserverActivateMode = 'manual'): this {
    return PipeDeactivate<TObserver, TObservable, this>(this, mode);
  }
}




/* ---------------- */

export const PIPE_CONTEXT_PRIVATE = Symbol('pipe-context-private');

export interface IPipeContextPrivate<TValueObserver, TValueObservable> {
  pipe: IPipe<IObserver<TValueObserver>, IObservable<TValueObservable>>;
}

export interface IPipeContextInternal<TValueObserver, TValueObservable> extends IPipeContext<TValueObserver, TValueObservable> {
  [PIPE_CONTEXT_PRIVATE]: IPipeContextPrivate<TValueObserver, TValueObservable>;
}

let ALLOW_PIPE_CONTEXT_CONSTRUCT: boolean = false;
export function AllowPipeContextConstruct(allow: boolean): void {
  ALLOW_PIPE_CONTEXT_CONSTRUCT = allow;
}

export function NewPipeContext<TValueObserver, TValueObservable>(instance: IPipe<IObserver<TValueObserver>, IObservable<TValueObservable>>): IPipeContext<TValueObserver, TValueObservable> {
  ALLOW_PIPE_CONTEXT_CONSTRUCT = true;
  const context: IPipeContext<TValueObserver, TValueObservable> = new((PipeContext as unknown) as IPipeContextConstructor)<TValueObserver, TValueObservable>(instance);
  ALLOW_PIPE_CONTEXT_CONSTRUCT = false;
  return context;
}

export function ConstructPipeContext<TValueObserver, TValueObservable>(context: IPipeContext<TValueObserver, TValueObservable>, instance: IPipe<IObserver<TValueObserver>, IObservable<TValueObservable>>): void {
  if (ALLOW_PIPE_CONTEXT_CONSTRUCT) {
    ConstructClassWithPrivateMembers(context, PIPE_CONTEXT_PRIVATE);
    (context as IPipeContextInternal<TValueObserver, TValueObservable>)[PIPE_CONTEXT_PRIVATE].pipe = instance;
  } else {
    throw new TypeError('Illegal constructor');
  }
}

export function PipeContextEmit<TValueObserver, TValueObservable>(context: IPipeContext<TValueObserver, TValueObservable>, value: TValueObservable): void {
  if ((context as IPipeContextInternal<TValueObserver, TValueObservable>)[PIPE_CONTEXT_PRIVATE].pipe === null) {
    throw new Error(`Cannot emit any value until pipe is fully created.`);
  } else {
    ObservableEmitAll<TValueObservable>((context as IPipeContextInternal<TValueObserver, TValueObservable>)[PIPE_CONTEXT_PRIVATE].pipe.observable, value);
  }
}


export class PipeContext<TValueObserver, TValueObservable> implements IPipeContext<TValueObserver, TValueObservable> {

  protected constructor(instance: IPipe<IObserver<TValueObserver>, IObservable<TValueObservable>> | null) {
    ConstructPipeContext<TValueObserver, TValueObservable>(this, instance);
  }

  get pipe(): IPipe<IObserver<TValueObserver>, IObservable<TValueObservable>> | null {
    return ((this as unknown) as  IPipeContextInternal<TValueObserver, TValueObservable>)[PIPE_CONTEXT_PRIVATE].pipe;
  }

  emit(value: TValueObservable): void {
    PipeContextEmit<TValueObserver, TValueObservable>(this, value);
  }
}

