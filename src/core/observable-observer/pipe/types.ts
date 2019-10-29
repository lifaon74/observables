import { IPipe } from './interfaces';
import { IObserver } from '../../observer/interfaces';
import { IObservable } from '../../observable/interfaces';
import { ObserverType } from '../../observer/types';
import { ObservableType } from '../../observable/types';
import { IObservableObserver } from '../interfaces';
import { IPipeContext } from './context/interfaces';
import { IPipeHook } from './hook/interfaces';

/** TYPES **/

export type PipeObservableType<T extends IObservableObserver<IObserver<any>, IObservable<any>>> = ObservableType<T['observable']>;

export type PipeObserverType<T extends IObservableObserver<IObserver<any>, IObservable<any>>> = ObserverType<T['observer']>;

export type TPipeBase<TObserverType, TObservableType> = IPipe<IObserver<TObserverType>, IObservable<TObservableType>>;

export type TPipeContextBase<TObserverType, TObservableType> = IPipeContext<IObserver<TObserverType>, IObservable<TObservableType>>;

export type TPipeHookBase<TObserverType, TObservableType> = IPipeHook<IObserver<TObserverType>, IObservable<TObservableType>>;

export type TPipeActivateMode = 'auto' | 'manual';

export type TBasePipe<TValueObserver, TValueObservable> = IPipe<IObserver<TValueObserver>, IObservable<TValueObservable>>;
