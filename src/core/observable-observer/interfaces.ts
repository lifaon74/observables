import { IObservable, IObservableHook, ObservableType } from '../observable/interfaces';
import { IObserver, ObserverType } from '../observer/interfaces';


/**
 * An ObservableObserver is both a Observable and a Observer: it receives and emits data.
 *  For example, it can be used to transform data.
 */
export interface IObservableObserver<TObserver extends IObserver<any>, TObservable extends IObservable<any>> {
  readonly observer: TObserver;
  readonly observable: TObservable;
}


export type PipeObservableType<T extends IObservableObserver<IObserver<any>, IObservable<any>>> = ObservableType<T['observable']>;
export type PipeObserverType<T extends IObservableObserver<IObserver<any>, IObservable<any>>> = ObserverType<T['observer']>;

export type TPipeBase<TObserverType, TObservableType> = IPipe<IObserver<TObserverType>, IObservable<TObservableType>>;
export type TPipeContextBase<TObserverType, TObservableType> = IPipeContext<IObserver<TObserverType>, IObservable<TObservableType>>;
export type TPipeHookbase<TObserverType, TObservableType> = IPipeHook<IObserver<TObserverType>, IObservable<TObservableType>>;


export interface IPipeConstructor {
  create<TValueObserver, TValueObservable = TValueObserver>(
    create?: (context: IPipeContext<IObserver<TValueObserver>, IObservable<TValueObservable>>) => (IPipeHook<IObserver<TValueObserver>, IObservable<TValueObservable>> | void)
  ): IPipe<IObserver<TValueObserver>, IObservable<TValueObservable>>;

  // creates a Pipe
  new<TObserver extends IObserver<any>, TObservable extends IObservable<any>>(create: () => IObservableObserver<TObserver, TObservable>): IPipe<TObserver, TObservable>;
}

/**
 * A Pipe is an ObservableObserver which self activate/deactivate
 */
export interface IPipe<TObserver extends IObserver<any>, TObservable extends IObservable<any>> extends IObservableObserver<TObserver, TObservable> {
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
  new<TObserver extends IObserver<any>, TObservable extends IObservable<any>>(pipe: IPipe<TObserver, TObservable>): IPipeContext<TObserver, TObservable>;
}

export interface IPipeContext<TObserver extends IObserver<any>, TObservable extends IObservable<any>> {
  readonly pipe: IPipe<TObserver, TObservable>;

  emit(value: ObservableType<TObservable>): void;
}

export interface IPipeHook<TObserver extends IObserver<any>, TObservable extends IObservable<any>> extends IObservableHook<ObservableType<TObservable>> {
  // called when this Observer receives data.
  onEmit?(value: ObserverType<TObserver>, observable?: TObservable): void;
}

