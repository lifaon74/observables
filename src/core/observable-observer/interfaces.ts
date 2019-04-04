import { IObservable, IObservableHook, ObservableType } from '../observable/interfaces';
import { IObserver, ObserverType } from '../observer/interfaces';



/**
 * An ObservableObserver is both a Observable and a Observer: it receives and emits data.
 *  For example, it can be used to transform data.
 */
export interface IObservableObserver<TObserver extends IObserver<any>, TObservable extends IObservable<any>>  {
  readonly observer: TObserver;
  readonly observable: TObservable;
}


export type PipeObservableType<T extends IObservableObserver<IObserver<any>, IObservable<any>>> = ObservableType<T['observable']>;
export type PipeObserverType<T extends IObservableObserver<IObserver<any>, IObservable<any>>> = ObserverType<T['observer']>;


export interface IPipeConstructor {
  create<TValueObserver, TValueObservable = TValueObserver>(
    create?: (context: IPipeContext<TValueObserver, TValueObservable>) => (IPipeHook<TValueObserver, TValueObservable> | void)
  ): IPipe<IObserver<TValueObserver>, IObservable<TValueObservable>>;

  // creates a Pipe
  new<TObserver extends IObserver<any>, TObservable extends IObservable<any>>(create: () => IObservableObserver<TObserver, TObservable>): IPipe<TObserver, TObservable>;
}

/**
 * A Pipe is an ObservableObserver which self activate/deactivate
 */
export interface IPipe<TObserver extends IObserver<any>, TObservable extends IObservable<any>> extends IObservableObserver<TObserver, TObservable>  {
  readonly activateMode: TObservableObserverActivateMode;
  readonly deactivateMode: TObservableObserverActivateMode;
  readonly activated: boolean;

  activate(mode?: TObservableObserverActivateMode): this;
  deactivate(mode?: TObservableObserverActivateMode): this;
}

export type TObservableObserverActivateMode = 'auto' | 'manual';

export type TBasePipe<TValueObserver, TValueObservable> = IPipe<IObserver<TValueObserver>, IObservable<TValueObservable>>;

export interface IPipeContextConstructor {
  // creates a PipeContext
  new<TValueObserver, TValueObservable>(instance: IPipe<IObserver<TValueObserver>, IObservable<TValueObservable>>): IPipeContext<TValueObserver, TValueObservable>;
}

export interface IPipeContext<TValueObserver, TValueObservable> {
  readonly pipe: IPipe<IObserver<TValueObserver>, IObservable<TValueObservable>>;

  emit(value: TValueObservable): void;
}

export interface IPipeHook<TValueObserver, TValueObservable> extends IObservableHook<TValueObservable> {
  // called when this Observer receives data.
  onEmit?(value: TValueObserver, observable?: IObservable<TValueObservable>): void;
}
