import {
  IObservableObserver, IPipe, IPipeContext, IPipeContextConstructor, IPipeHook, TObservableObserverActivateMode
} from './interfaces';
import { IObservable, ObservableType } from '../observable/interfaces';
import { IObserver, ObserverType } from '../observer/interfaces';
import {
  IObservableInternal, IObservablePrivate, Observable, OBSERVABLE_PRIVATE, ObservableEmitAll
} from '../observable/implementation';
import {
  IObserverInternal, Observer, OBSERVER_PRIVATE, ObserverActivate, ObserverDeactivate
} from '../observer/implementation';
import { ConstructClassWithPrivateMembers } from '../../misc/helpers/ClassWithPrivateMembers';
import { IsObject, noop } from '../../helpers';


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

    if (IsObject(result)) {

      if (OBSERVER_PRIVATE in result.observer) {
        ((instance as unknown) as IPipeInternal<TObserver, TObservable>)[PIPE_PRIVATE].observer = result.observer;
      } else {
        throw new TypeError(`Expected property observer of type Observer in return of Pipe's create function`);
      }

      if (OBSERVABLE_PRIVATE in result.observable) {
        ((instance as unknown) as IPipeInternal<TObserver, TObservable>)[PIPE_PRIVATE].observable = result.observable;
        type TValueObservable = ObservableType<TObservable>;
        const observablePrivate: IObservablePrivate<TValueObservable> = ((((instance as unknown) as IPipeInternal<TObserver, TObservable>)[PIPE_PRIVATE].observable as unknown) as IObservableInternal<TValueObservable>)[OBSERVABLE_PRIVATE];

        const _onObserveHook = observablePrivate.onObserveHook;
        observablePrivate.onObserveHook = function onObserveHook(observer: IObserver<TValueObservable>) {
          PipeUpdateAutoActivate<TObserver, TObservable>(instance);
          _onObserveHook.call(this, observer);
        };

        const _onUnobserveHook = observablePrivate.onUnobserveHook;
        observablePrivate.onUnobserveHook = function onUnobserveHook(observer: IObserver<TValueObservable>) {
          PipeUpdateAutoDeactivate<TObserver, TObservable>(instance);
          _onUnobserveHook.call(this, observer);
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

export function IsPipe(value: any): value is IPipe<any, any> {
  return IsObject(value)
    && value.hasOwnProperty(PIPE_PRIVATE);
}

export function PipeActivate<TObserver extends IObserver<any>, TObservable extends IObservable<any>>(instance: IPipe<TObserver, TObservable>, mode: TObservableObserverActivateMode): void {
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

export function PipeDeactivate<TObserver extends IObserver<any>, TObservable extends IObservable<any>>(instance: IPipe<TObserver, TObservable>, mode: TObservableObserverActivateMode): void {
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
    // && ObservableIsObserved<ObservableType<TObservable>>((instance as IPipeInternal<TObserver, TObservable>)[PIPE_PRIVATE].observable)
    && ((((instance as IPipeInternal<TObserver, TObservable>)[PIPE_PRIVATE].observable as unknown) as IObservableInternal<ObservableType<TObservable>>)[OBSERVABLE_PRIVATE].observers.length > 0)
  ) {
    ObserverActivate<ObserverType<TObserver>>(instance.observer);
  }
}

export function PipeUpdateAutoDeactivate<TObserver extends IObserver<any>, TObservable extends IObservable<any>>(instance: IPipe<TObserver, TObservable>): void {
  if (
    (instance as IPipeInternal<TObserver, TObservable>)[PIPE_PRIVATE].autoActivate
    && (((instance as IPipeInternal<TObserver, TObservable>)[PIPE_PRIVATE].observer as unknown) as IObserverInternal<ObserverType<TObserver>>)[OBSERVER_PRIVATE].activated
    && ((((instance as IPipeInternal<TObserver, TObservable>)[PIPE_PRIVATE].observable as unknown) as IObservableInternal<ObservableType<TObservable>>)[OBSERVABLE_PRIVATE].observers.length === 0)
  ) {
    ObserverDeactivate<ObserverType<TObserver>>(instance.observer);
  }
}


export function PipeStaticCreate<TValueObserver, TValueObservable>(
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
      const pipe = new Pipe<IObserver<TValueObserver>, IObservable<TValueObservable>>(() => {
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

export class Pipe<TObserver extends IObserver<any>, TObservable extends IObservable<any>> implements IPipe<TObserver, TObservable> {
  static create<TValueObserver, TValueObservable = TValueObserver>(
    create?: (context: IPipeContext<IObserver<TValueObserver>, IObservable<TValueObservable>>) => (IPipeHook<IObserver<TValueObserver>, IObservable<TValueObservable>> | void)
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
    PipeActivate<TObserver, TObservable>(this, mode);
    return this;
  }

  deactivate(mode: TObservableObserverActivateMode = 'manual'): this {
    PipeDeactivate<TObserver, TObservable>(this, mode);
    return this;
  }
}


/* ---------------- */

export const PIPE_CONTEXT_PRIVATE = Symbol('pipe-context-private');

export interface IPipeContextPrivate<TObserver extends IObserver<any>, TObservable extends IObservable<any>> {
  pipe: IPipe<TObserver, TObservable>;
}

export interface IPipeContextInternal<TObserver extends IObserver<any>, TObservable extends IObservable<any>> extends IPipeContext<TObserver, TObservable> {
  [PIPE_CONTEXT_PRIVATE]: IPipeContextPrivate<TObserver, TObservable>;
}

let ALLOW_PIPE_CONTEXT_CONSTRUCT: boolean = false;

export function AllowPipeContextConstruct(allow: boolean): void {
  ALLOW_PIPE_CONTEXT_CONSTRUCT = allow;
}

export function NewPipeContext<TObserver extends IObserver<any>, TObservable extends IObservable<any>>(instance: IPipe<TObserver, TObservable>): IPipeContext<TObserver, TObservable> {
  ALLOW_PIPE_CONTEXT_CONSTRUCT = true;
  const context: IPipeContext<TObserver, TObservable> = new ((PipeContext as unknown) as IPipeContextConstructor)<TObserver, TObservable>(instance);
  ALLOW_PIPE_CONTEXT_CONSTRUCT = false;
  return context;
}

export function ConstructPipeContext<TObserver extends IObserver<any>, TObservable extends IObservable<any>>(context: IPipeContext<TObserver, TObservable>, instance: IPipe<TObserver, TObservable>): void {
  if (ALLOW_PIPE_CONTEXT_CONSTRUCT) {
    ConstructClassWithPrivateMembers(context, PIPE_CONTEXT_PRIVATE);
    (context as IPipeContextInternal<TObserver, TObservable>)[PIPE_CONTEXT_PRIVATE].pipe = instance;
  } else {
    throw new TypeError('Illegal constructor');
  }
}

export function PipeContextEmit<TObserver extends IObserver<any>, TObservable extends IObservable<any>>(context: IPipeContext<TObserver, TObservable>, value: ObservableType<TObservable>): void {
  if ((context as IPipeContextInternal<TObserver, TObservable>)[PIPE_CONTEXT_PRIVATE].pipe === null) {
    throw new Error(`Cannot emit any value until pipe is fully created.`);
  } else {
    ObservableEmitAll<ObservableType<TObservable>>((context as IPipeContextInternal<TObserver, TObservable>)[PIPE_CONTEXT_PRIVATE].pipe.observable, value);
  }
}


export class PipeContext<TObserver extends IObserver<any>, TObservable extends IObservable<any>> implements IPipeContext<TObserver, TObservable> {

  protected constructor(instance: IPipe<TObserver, TObservable>) {
    ConstructPipeContext<TObserver, TObservable>(this, instance);
  }

  get pipe(): IPipe<TObserver, TObservable> {
    return ((this as unknown) as IPipeContextInternal<TObserver, TObservable>)[PIPE_CONTEXT_PRIVATE].pipe;
  }

  emit(value: ObservableType<TObservable>): void {
    PipeContextEmit<TObserver, TObservable>(this, value);
  }
}

