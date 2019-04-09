import { IObservable, IObservableContext, IObservableContextConstructor, IObservableHook, TObserverOrCallback, IObservableContextBase, TObservableConstructorArgs, IObservableConstructor, IObservableTypedConstructor } from './interfaces';
import { ConstructClassWithPrivateMembers } from '../../misc/helpers/ClassWithPrivateMembers';
import { ReadonlyList } from '../../misc/readonly-list/implementation';
import { IObserver } from '../observer/interfaces';
import { IReadonlyList } from '../../misc/readonly-list/interfaces';
import { IObserverInternal, Observer, OBSERVER_PRIVATE } from '../observer/implementation';
import { IObservableObserver } from '../observable-observer/interfaces';
import { InitObservableHook, IObservableHookPrivate } from './hook';
import { Constructor, FactoryClass, HasFactoryWaterMark } from '../../classes/factory';


export const OBSERVABLE_PRIVATE = Symbol('observable-private');

export interface IObservablePrivate<T> extends IObservableHookPrivate<T> {
  observers: IObserver<T>[];
  readOnlyObservers: IReadonlyList<IObserver<T>>;
}

export interface IObservableInternal<T> extends IObservable<T> {
  [OBSERVABLE_PRIVATE]: IObservablePrivate<T>;
}

export function ConstructObservable<T>(
  observable: IObservable<T>,
  create?: (context: IObservableContext<T>) => (IObservableHook<T> | void),
): void {
  ConstructClassWithPrivateMembers(observable, OBSERVABLE_PRIVATE);
  InitObservableHook(
    observable,
    (observable as IObservableInternal<T>)[OBSERVABLE_PRIVATE],
    create,
    NewObservableContext
  );
  (observable as IObservableInternal<T>)[OBSERVABLE_PRIVATE].observers = [];
  (observable as IObservableInternal<T>)[OBSERVABLE_PRIVATE].readOnlyObservers = new ReadonlyList<IObserver<T>>((observable as IObservableInternal<T>)[OBSERVABLE_PRIVATE].observers);
}

export function IsObservable(value: any): value is IObservable<any> {
  return (typeof value === 'object') && (value !== null ) && value.hasOwnProperty(OBSERVABLE_PRIVATE);
}

const IS_OBSERVABLE_CONSTRUCTOR = Symbol('is-observable-constructor');
export function IsObservableConstructor(value: any): value is IObservableConstructor {
  return (typeof value === 'function') && ((value === Observable) || HasFactoryWaterMark(value, IS_OBSERVABLE_CONSTRUCTOR));
}


export function ObservableIsFreshlyObserved<T>(observable: IObservable<T>): boolean {
  return (observable as IObservableInternal<T>)[OBSERVABLE_PRIVATE].observers.length === 1;
}

export function ObservableIsObserved<T>(observable: IObservable<T>): boolean {
  return (observable as IObservableInternal<T>)[OBSERVABLE_PRIVATE].observers.length > 0;
}

export function ObservableIsNotObserved<T>(observable: IObservable<T>): boolean {
  return (observable as IObservableInternal<T>)[OBSERVABLE_PRIVATE].observers.length === 0;
}


export function ObservablePipe<T, O extends IObserver<T> = IObserver<T>>(observable: IObservable<T>, observerOrCallback: O | ((value: T) => void)): O {
  let observer: O;
  if (typeof observerOrCallback === 'function') {
    observer = new Observer<T>(observerOrCallback) as any;
  } else if ((typeof observerOrCallback === 'object') && (observerOrCallback !== null)) {
    observer = observerOrCallback;
  } else {
    throw new TypeError(`Expected Observer or function.`)
  }
  return observer.observe(observable);
}

export function ObservableObservedBy<T, O extends IObservable<T> = IObservable<T>>(observable: O, observers: TObserverOrCallback<T>[]): O {
  for (let i = 0, l = observers.length; i < l; i++) {
    ObservablePipe<T, IObserver<T>>(observable, observers[i]);
  }
  return observable;
}



export function LinkObservableAndObserver<T>(observable: IObservable<T>, observer: IObserver<T>): void {
  (observable as IObservableInternal<T>)[OBSERVABLE_PRIVATE].observers.push(observer);
  (observable as IObservableInternal<T>)[OBSERVABLE_PRIVATE].onObserveHook(observer);
}

export function UnLinkObservableAndObserver<T>(observable: IObservable<T>, observer: IObserver<T>): void {
  (observable as IObservableInternal<T>)[OBSERVABLE_PRIVATE].observers.splice((observable as IObservableInternal<T>)[OBSERVABLE_PRIVATE].observers.indexOf(observer), 1);
  (observable as IObservableInternal<T>)[OBSERVABLE_PRIVATE].onUnobserveHook(observer);
}

export function ObservableEmitAll<T>(observable: IObservable<T>, value: T): void {
  const observers: IObserver<T>[] = (observable as IObservableInternal<T>)[OBSERVABLE_PRIVATE].observers.slice(); // shallow copy in case observers mutate
  for (let i = 0, l = observers.length; i < l; i++) {
    (observers[i] as IObserverInternal<T>)[OBSERVER_PRIVATE].onEmit(value, observable);
  }
}

export function ObservableClearObservers<T>(observable: IObservable<T>): void {
  while (observable.observers.length > 0) {
    observable.observers.item(0).unobserve(observable);
  }
}



export function ObservableFactory<TBase extends Constructor>(superClass: TBase) {
  type T = any;
  return FactoryClass(class Observable extends superClass implements IObservable<T> {
    constructor(...args: any[]) {
      const [create]: TObservableConstructorArgs<T> = args[0];
      super(...args.slice(1));
      ConstructObservable<T>(this, create);
    }

    get observers(): IReadonlyList<IObserver<T>> {
      return ((this as unknown) as IObservableInternal<T>)[OBSERVABLE_PRIVATE].readOnlyObservers;
    }

    get observed(): boolean {
      return ObservableIsObserved<T>(this);
    }


    pipeTo<O extends IObserver<T>>(observer: O): O;
    pipeTo(callback: (value: T) => void): IObserver<T>;
    pipeTo<O extends IObserver<T> = IObserver<T>>(observerOrCallback: O | ((value: T) => void)): O {
      return ObservablePipe<T, O>(this, observerOrCallback);
    }

    pipeThrough<O extends IObservableObserver<IObserver<T>, IObservable<any>>>(observableObserver: O): O['observable'] {
      ObservablePipe<T, O['observer']>(this, observableObserver.observer);
      return observableObserver.observable;
    }

    pipe<O extends IObservableObserver<IObserver<T>, IObservable<any>>>(observableObserver: O): O {
      ObservablePipe<T, O['observer']>(this, observableObserver.observer);
      return observableObserver;
    }

    observedBy(...observers: TObserverOrCallback<T>[]): this {
      return ObservableObservedBy<T, this>(this, observers);
    }


  })<TObservableConstructorArgs<T>>('Observable', IS_OBSERVABLE_CONSTRUCTOR);
}

export const Observable: IObservableConstructor = class Observable extends ObservableFactory<ObjectConstructor>(Object) {
  constructor(create?: (context: IObservableContext<any>) => (IObservableHook<any> | void)) {
    super([create]);
  }
};


// export class Observable<T> implements IObservable<T> {
//   constructor(create?: (context: IObservableContext<any>) => (IObservableHook<any> | void)) {
//     ConstructObservable<T>(this, create);
//   }
//
//   get observers(): IReadonlyList<IObserver<T>> {
//     return ((this as unknown) as IObservableInternal<T>)[OBSERVABLE_PRIVATE].readOnlyObservers;
//   }
//
//   get observed(): boolean {
//     return (((this as unknown) as IObservableInternal<T>)[OBSERVABLE_PRIVATE].observers.length > 0);
//   }
//
//
//   pipeTo<O extends IObserver<T>>(observer: O): O;
//   pipeTo(callback: (value: T) => void): IObserver<T>;
//   pipeTo<O extends IObserver<T> = IObserver<T>>(observerOrCallback: O | ((value: T) => void)): O {
//     return ObservablePipe<T, O>(this, observerOrCallback);
//   }
//
//   pipeThrough<O extends IObservableObserver<IObserver<T>, IObservable<any>>>(observableObserver: O): O['observable'] {
//     ObservablePipe<T, O['observer']>(this, observableObserver.observer);
//     return observableObserver.observable;
//   }
//
//   pipe<O extends IObservableObserver<IObserver<T>, IObservable<any>>>(observableObserver: O): O {
//     ObservablePipe<T, O['observer']>(this, observableObserver.observer);
//     return observableObserver;
//   }
//
//   observedBy(...observers: TObserverOrCallback<T>[]): this {
//     return ObservableObservedBy<T, this>(this, observers);
//   }
// }



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

export function ConstructObservableContextBase<T>(context: IObservableContextBase<T>, observable: IObservable<T>): void {
  if (ALLOW_OBSERVABLE_CONTEXT_BASE_CONSTRUCT) {
    ConstructClassWithPrivateMembers(context, OBSERVABLE_CONTEXT_BASE_PRIVATE);
    (context as IObservableContextBaseInternal<T>)[OBSERVABLE_CONTEXT_BASE_PRIVATE].observable = observable;
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
  const context: IObservableContext<T> = new((ObservableContext as unknown) as IObservableContextConstructor)<T>(observable);
  ALLOW_OBSERVABLE_CONTEXT_BASE_CONSTRUCT = false;
  return context;
}

export function ObservableContextEmit<T>(context: IObservableContextBase<T>, value: T): void {
  ObservableEmitAll<T>((context as IObservableContextBaseInternal<T>)[OBSERVABLE_CONTEXT_BASE_PRIVATE].observable, value);
}

export class ObservableContext<T> extends ObservableContextBase<T> implements IObservableContext<T> {

  protected constructor(observable: IObservable<T>) {
    super(observable);
  }

  emit(value: T): void {
    ObservableContextEmit<T>(this, value);
  }
}


