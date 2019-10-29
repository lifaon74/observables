import {
  IObservable, IObservableConstructor, IObservableContext, IObservableContextBase, IObservableContextConstructor,
  IObservableHook, TObservableConstructorArgs, TObservableObservedByResultNonCyclic, TObservablePipeResult,
  TObservablePipeThroughResult, TObserverOrCallback
} from './interfaces';
import { ConstructClassWithPrivateMembers } from '../../misc/helpers/ClassWithPrivateMembers';
import { ReadonlyList } from '../../misc/readonly-list/implementation';
import { IObserver } from '../observer/interfaces';
import { IReadonlyList } from '../../misc/readonly-list/interfaces';
import { IObserverInternal, Observer, OBSERVER_PRIVATE, IsObserver } from '../observer/implementation';
import { IObservableObserver } from '../observable-observer/interfaces';
import { InitObservableHook, IObservableHookPrivate } from './hook';
import { HasFactoryWaterMark, MakeFactory } from '../../classes/class-helpers/factory';
import { IsObject } from '../../helpers';
import { Constructor } from '../../classes/class-helpers/types';
import { BaseClass, IBaseClassConstructor } from '../../classes/class-helpers/base-class';


export const OBSERVABLE_PRIVATE = Symbol('observable-private');

export interface IObservablePrivate<T> extends IObservableHookPrivate<T> {
  observers: IObserver<T>[];
  readOnlyObservers: IReadonlyList<IObserver<T>>;
}

export interface IObservableInternal<T> extends IObservable<T> {
  [OBSERVABLE_PRIVATE]: IObservablePrivate<T>;
}

export function ConstructObservable<T>(
  instance: IObservable<T>,
  create?: (context: IObservableContext<T>) => (IObservableHook<T> | void),
): void {
  ConstructClassWithPrivateMembers(instance, OBSERVABLE_PRIVATE);
  const privates: IObservablePrivate<T> = (instance as IObservableInternal<T>)[OBSERVABLE_PRIVATE];
  privates.observers = [];

  InitObservableHook(
    instance,
    privates,
    NewObservableContext,
    create,
  );
}

export function IsObservable(value: any): value is IObservable<any> {
  return IsObject(value)
    && value.hasOwnProperty(OBSERVABLE_PRIVATE as symbol);
}

const IS_OBSERVABLE_CONSTRUCTOR = Symbol('is-observable-constructor');

/**
 * Returns true if value is an Observable
 * @param value
 * @param direct
 */
export function IsObservableConstructor(value: any, direct?: boolean): value is IObservableConstructor {
  return (typeof value === 'function') && ((value === Observable) || HasFactoryWaterMark(value, IS_OBSERVABLE_CONSTRUCTOR, direct));
}

export const IS_OBSERVABLE_LIKE_CONSTRUCTOR = Symbol('is-observable-constructor');

/**
 * Returns true if value is an ObservableConstructor (direct or indirect) and accepts same arguments than an Observable
 * @param value
 * @param direct
 */
export function IsObservableLikeConstructor(value: any, direct?: boolean): value is IObservableConstructor {
  return (typeof value === 'function')
    && (
      (value === Observable)
      || (HasFactoryWaterMark(value, IS_OBSERVABLE_LIKE_CONSTRUCTOR, direct) && HasFactoryWaterMark(value, IS_OBSERVABLE_CONSTRUCTOR, false))
    );
}


export function ObservableIsFreshlyObserved<T>(instance: IObservable<T>): boolean {
  return (instance as IObservableInternal<T>)[OBSERVABLE_PRIVATE].observers.length === 1;
}

export function ObservableIsObserved<T>(instance: IObservable<T>): boolean {
  return (instance as IObservableInternal<T>)[OBSERVABLE_PRIVATE].observers.length > 0;
}

export function ObservableIsNotObserved<T>(instance: IObservable<T>): boolean {
  return (instance as IObservableInternal<T>)[OBSERVABLE_PRIVATE].observers.length === 0;
}


export function ObservablePipe<T>(instance: IObservable<T>, observerOrCallback: IObserver<any> | ((value: any) => void)): IObserver<any> {
  let observer: IObserver<any>;
  if (typeof observerOrCallback === 'function') {
    observer = new Observer<T>(observerOrCallback);
  } else if (IsObserver(observerOrCallback)) {
    observer = observerOrCallback;
  } else {
    throw new TypeError(`Expected Observer or function.`);
  }
  return observer.observe(instance);
}

export function ObservableObservedBy<T>(instance: IObservable<T>, observers: TObserverOrCallback<T>[]): void {
  for (let i = 0, l = observers.length; i < l; i++) {
    ObservablePipe<T>(instance, observers[i]);
  }
}


export function LinkObservableAndObserver<T>(instance: IObservable<T>, observer: IObserver<T>): void {
  const privates: IObservablePrivate<T> = (instance as IObservableInternal<T>)[OBSERVABLE_PRIVATE];
  privates.observers.push(observer);
  privates.onObserveHook(observer);
}

export function UnLinkObservableAndObserver<T>(instance: IObservable<T>, observer: IObserver<T>): void {
  const privates: IObservablePrivate<T> = (instance as IObservableInternal<T>)[OBSERVABLE_PRIVATE];
  privates.observers.splice(privates.observers.indexOf(observer), 1);
  privates.onUnobserveHook(observer);
}

export function ObservableEmitAll<T>(instance: IObservable<T>, value: T): void {
  const observers: IObserver<T>[] = (instance as IObservableInternal<T>)[OBSERVABLE_PRIVATE].observers.slice(); // shallow copy in case observers mutate
  for (let i = 0, l = observers.length; i < l; i++) {
    (observers[i] as IObserverInternal<T>)[OBSERVER_PRIVATE].onEmit(value, instance);
  }
}

export function ObservableClearObservers<T>(instance: IObservable<T>): void {
  while ((instance as IObservableInternal<T>)[OBSERVABLE_PRIVATE].observers.length > 0) {
    (instance as IObservableInternal<T>)[OBSERVABLE_PRIVATE].observers[0].unobserve(instance);
  }
  // while (instance.observers.length > 0) {
  //   instance.observers.item(0).unobserve(instance);
  // }
}


export function ObservableGetObservers<T>(instance: IObservable<T>): IReadonlyList<IObserver<T>> {
  const privates: IObservablePrivate<T> = (instance as IObservableInternal<T>)[OBSERVABLE_PRIVATE];
  if (privates.readOnlyObservers === void 0) {
    privates.readOnlyObservers = new ReadonlyList<IObserver<T>>(privates.observers);
  }
  return privates.readOnlyObservers;
}

function PureObservableFactory<TBase extends Constructor>(superClass: TBase) {
  type T = any;

  return class Observable extends superClass implements IObservable<T> {
    constructor(...args: any[]) {
      const [create]: TObservableConstructorArgs<T> = args[0];
      super(...args.slice(1));
      ConstructObservable<T>(this, create);
    }

    get observers(): IReadonlyList<IObserver<T>> {
      return ObservableGetObservers<T>(this);
    }

    get observed(): boolean {
      return ObservableIsObserved<T>(this);
    }


    pipeTo<O extends IObserver<any>>(observer: O): O;
    pipeTo<C extends (value: any) => void>(callback: C): IObserver<any>;
    pipeTo(observerOrCallback: IObserver<any> | ((value: any) => void)): IObserver<any> {
      return ObservablePipe<T>(this, observerOrCallback);
    }

    pipeThrough<OO extends IObservableObserver<IObserver<any>, IObservable<any>>>(observableObserver: OO): TObservablePipeThroughResult<OO, T> {
      ObservablePipe<T>(this, observableObserver.observer);
      return observableObserver.observable as TObservablePipeThroughResult<OO, T>;
    }

    pipe<OO extends IObservableObserver<IObserver<any>, IObservable<any>>>(observableObserver: OO): TObservablePipeResult<OO, T> {
      ObservablePipe<T>(this, observableObserver.observer);
      return observableObserver as TObservablePipeResult<OO, T>;
    }

    observedBy<O extends TObserverOrCallback<any>[]>(...observers: O): TObservableObservedByResultNonCyclic<O, T, this> {
      ObservableObservedBy<T>(this, observers);
      return (this as unknown) as TObservableObservedByResultNonCyclic<O, T, this>;
    }

    clearObservers(): this {
      ObservableClearObservers<T>(this);
      return this;
    }
  };
}

export let Observable: IObservableConstructor;

export function ObservableFactory<TBase extends Constructor>(superClass: TBase) {
  return MakeFactory<IObservableConstructor, [], TBase>(PureObservableFactory, [], superClass, {
    name: 'Observable',
    instanceOf: Observable,
    waterMarks: [IS_OBSERVABLE_CONSTRUCTOR, IS_OBSERVABLE_LIKE_CONSTRUCTOR]
  });
}

Observable = class Observable extends ObservableFactory<IBaseClassConstructor>(BaseClass) {
  constructor(create?: (context: IObservableContext<any>) => (IObservableHook<any> | void)) {
    super([create]);
  }
} as IObservableConstructor;


/* ---------------------------------- */


export const OBSERVABLE_CONTEXT_BASE_PRIVATE = Symbol('observable-context-base-private');

export interface IObservableContextBasePrivate<T> {
  observable: IObservable<T>;
}

export interface IObservableContextBaseInternal<T> extends IObservableContextBase<T> {
  [OBSERVABLE_CONTEXT_BASE_PRIVATE]: IObservableContextBasePrivate<T>;
}

let ALLOW_OBSERVABLE_CONTEXT_BASE_CONSTRUCT: boolean = false;

export function AllowObservableContextBaseConstruct(allow: boolean): void {
  ALLOW_OBSERVABLE_CONTEXT_BASE_CONSTRUCT = allow;
}

export function ConstructObservableContextBase<T>(instance: IObservableContextBase<T>, observable: IObservable<T>): void {
  if (ALLOW_OBSERVABLE_CONTEXT_BASE_CONSTRUCT) {
    ConstructClassWithPrivateMembers(instance, OBSERVABLE_CONTEXT_BASE_PRIVATE);
    (instance as IObservableContextBaseInternal<T>)[OBSERVABLE_CONTEXT_BASE_PRIVATE].observable = observable;
  } else {
    throw new TypeError('Illegal constructor');
  }
}


export abstract class ObservableContextBase<T> implements IObservableContextBase<T> {

  protected constructor(observable: IObservable<T>) {
    ConstructObservableContextBase<T>(this, observable);
  }

  get observable(): IObservable<T> {
    return ((this as unknown) as IObservableContextBaseInternal<T>)[OBSERVABLE_CONTEXT_BASE_PRIVATE].observable;
  }

  abstract emit(...args: any[]): any;
}


/* ---------------------------------- */

export function NewObservableContext<T>(observable: IObservable<T>): IObservableContext<T> {
  ALLOW_OBSERVABLE_CONTEXT_BASE_CONSTRUCT = true;
  const context: IObservableContext<T> = new ((ObservableContext as unknown) as IObservableContextConstructor)<T>(observable);
  ALLOW_OBSERVABLE_CONTEXT_BASE_CONSTRUCT = false;
  return context;
}

export function ObservableContextEmit<T>(instance: IObservableContextBase<T>, value: T): void {
  ObservableEmitAll<T>((instance as IObservableContextBaseInternal<T>)[OBSERVABLE_CONTEXT_BASE_PRIVATE].observable, value);
}

export class ObservableContext<T> extends ObservableContextBase<T> implements IObservableContext<T> {

  protected constructor(observable: IObservable<T>) {
    super(observable);
  }

  emit(value: T): void {
    ObservableContextEmit<T>(this, value);
  }
}


