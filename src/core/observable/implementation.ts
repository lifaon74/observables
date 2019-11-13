import { IObservable, IObservableConstructor, IObservableTypedConstructor } from './interfaces';
import { Constructor } from '../../classes/class-helpers/types';
import { ConstructObservable, IS_OBSERVABLE_CONSTRUCTOR, IS_OBSERVABLE_LIKE_CONSTRUCTOR } from './constructor';
import { IReadonlyList } from '../../misc/readonly-list/interfaces';
import { IObserver } from '../observer/interfaces';
import { ObservableIsObserved } from './functions';
import { IObservableObserver } from '../observable-observer/interfaces';
import { MakeFactory } from '../../classes/class-helpers/factory';
import { BaseClass, IBaseClassConstructor } from '../../classes/class-helpers/base-class';
import { Observer } from '../observer/implementation';
import { IObservableInternal, IObservablePrivate, OBSERVABLE_PRIVATE } from './privates';
import { ReadonlyList } from '../../misc/readonly-list/implementation';
import { IObservableHook } from './hook/interfaces';
import { IObservableContext } from './context/interfaces';
import {
  TObservableConstructorArgs, TObservableObservedByResultNonCyclic, TObservablePipeResult, TObservablePipeThroughResult,
  TObserverOrCallback
} from './types';
import { IsObserver } from '../observer/constructor';

/** METHODS **/

/* GETTERS/SETTERS */

export function ObservableGetObservers<T>(instance: IObservable<T>): IReadonlyList<IObserver<T>> {
  const privates: IObservablePrivate<T> = (instance as IObservableInternal<T>)[OBSERVABLE_PRIVATE];
  if (privates.readOnlyObservers === void 0) {
    privates.readOnlyObservers = new ReadonlyList<IObserver<T>>(privates.observers);
  }
  return privates.readOnlyObservers;
}

/* METHODS */

export function ObservablePipeTo<T>(instance: IObservable<T>, observerOrCallback: IObserver<any> | ((value: any) => void)): IObserver<any> {
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
    ObservablePipeTo<T>(instance, observers[i]);
  }
}

export function ObservableClearObservers<T>(instance: IObservable<T>): void {
  const privates: IObservablePrivate<T> = (instance as IObservableInternal<T>)[OBSERVABLE_PRIVATE];
  while (privates.observers.length > 0) {
    privates.observers[0].unobserve(instance);
  }
  // while (instance.observers.length > 0) {
  //   instance.observers.item(0).unobserve(instance);
  // }
}

/** CLASS AND FACTORY **/

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
      return ObservablePipeTo<T>(this, observerOrCallback);
    }

    pipeThrough<OO extends IObservableObserver<IObserver<any>, IObservable<any>>>(observableObserver: OO): TObservablePipeThroughResult<OO, T> {
      ObservablePipeTo<T>(this, observableObserver.observer);
      return observableObserver.observable as TObservablePipeThroughResult<OO, T>;
    }

    pipe<OO extends IObservableObserver<IObserver<any>, IObservable<any>>>(observableObserver: OO): TObservablePipeResult<OO, T> {
      ObservablePipeTo<T>(this, observableObserver.observer);
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

export function ObservableFactory<TBase extends Constructor, T = unknown>(superClass: TBase) {
  return MakeFactory<IObservableTypedConstructor<T>, [], TBase>(PureObservableFactory, [], superClass, {
    name: 'Observable',
    instanceOf: Observable,
    waterMarks: [IS_OBSERVABLE_CONSTRUCTOR, IS_OBSERVABLE_LIKE_CONSTRUCTOR]
  });
}

Observable = class Observable extends ObservableFactory<IBaseClassConstructor>(BaseClass) {
  constructor(create?: (context: IObservableContext<unknown>) => (IObservableHook<unknown> | void)) {
    super([create]);
  }
} as IObservableConstructor;

