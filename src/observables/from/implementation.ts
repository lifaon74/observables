import { IObservable, IObservableContext, IObservableHook } from '../../core/observable/interfaces';
import {
  AllowObservableContextBaseConstruct, IObservableContextBaseInternal, IObservableInternal,
  IsObservableLikeConstructor,
  OBSERVABLE_CONTEXT_BASE_PRIVATE, ObservableClearObservers,
  ObservableContextBase, ObservableEmitAll, ObservableFactory
} from '../../core/observable/implementation';
import { ConstructClassWithPrivateMembers } from '../../misc/helpers/ClassWithPrivateMembers';
import {
  IFromObservable, IFromObservableConstructor, IFromObservableContext,
  IFromObservableContextConstructor, TFromObservableCompleteAction,
  TFromObservableConstructorArgs, TFromObservableState
} from './interfaces';
import { IsObject } from '../../helpers';
import {
  Constructor, FactoryClass, GetSetSuperArgsFunction, HasFactoryWaterMark, IsFactoryClass
} from '../../classes/factory';
import { IObserver } from '../../core/observer/interfaces';
import { InitObservableHook, IObservableHookPrivate } from '../../core/observable/hook';


export const FROM_OBSERVABLE_PRIVATE = Symbol('from-observable-private');


export interface IFromObservablePrivate<T> extends IObservableHookPrivate<T> {
  context: IObservableContext<T>;
  onComplete: TFromObservableCompleteAction;
  state: TFromObservableState;
  values: T[];
}

export interface IFromObservableInternal<T> extends IFromObservable<T>, IObservableInternal<T> {
  [FROM_OBSERVABLE_PRIVATE]: IFromObservablePrivate<T>;
}


export function ConstructFromObservable<T>(
  observable: IFromObservable<T>,
  context: IObservableContext<T>,
  create?: (context: IFromObservableContext<T>) => (IObservableHook<T> | void),
  onComplete?: TFromObservableCompleteAction
): void {
  ConstructClassWithPrivateMembers(observable, FROM_OBSERVABLE_PRIVATE);
  InitObservableHook(
    observable,
    (observable as IFromObservableInternal<T>)[FROM_OBSERVABLE_PRIVATE],
    create,
    NewFromObservableContext
  );
  (observable as IFromObservableInternal<T>)[FROM_OBSERVABLE_PRIVATE].context = context;
  (observable as IFromObservableInternal<T>)[FROM_OBSERVABLE_PRIVATE].onComplete = NormalizeFromObservableCompleteAction(onComplete);
  (observable as IFromObservableInternal<T>)[FROM_OBSERVABLE_PRIVATE].state = 'awaiting';
  (observable as IFromObservableInternal<T>)[FROM_OBSERVABLE_PRIVATE].values = [];
}



export function IsFromObservable(value: any): value is IFromObservable<any> {
  return IsObject(value)
    && value.hasOwnProperty(FROM_OBSERVABLE_PRIVATE);
}

const IS_FROM_OBSERVABLE_CONSTRUCTOR = Symbol('is-from-observable-constructor');
export function IsFromObservableConstructor(value: any): boolean {
  return (typeof value === 'function') && ((value === FromObservable) || HasFactoryWaterMark(value, IS_FROM_OBSERVABLE_CONSTRUCTOR));
}


export function NormalizeFromObservableCompleteAction(action?: TFromObservableCompleteAction): TFromObservableCompleteAction {
  switch (action) {
    case void 0:
      return 'clear-strict';
    case 'noop':
    case 'cache':
    case 'clear':
    case 'clear-strict':
      return action;
    default:
      throw new TypeError(`Expected 'noop', 'cache', 'clear' or 'clear-strict' as onComplete`);
  }
}


export function FromObservableOnObserved<T>(observable: IFromObservable<T>, observer: IObserver<T>): void {
  const privates: IFromObservablePrivate<T> = (observable as IFromObservableInternal<T>)[FROM_OBSERVABLE_PRIVATE];
  if (privates.state === 'complete') {
    if (privates.onComplete === 'clear-strict') {
      throw new Error(`Cannot observe this Observable because it is in a 'complete' state.`);
    } else if (privates.onComplete === 'cache') {
      for (let i = 0, l = privates.values.length; i < l; i++) {
        ObservableEmitAll<T>(observable, privates.values[i]);
      }
    }
  }
  privates.onObserveHook(observer);
}

export function FromObservableOnUnobserved<T>(observable: IFromObservable<T>, observer: IObserver<T>): void {
  (observable as IFromObservableInternal<T>)[FROM_OBSERVABLE_PRIVATE].onUnobserveHook(observer);
}


export function FromObservableEmit<T>(observable: IFromObservable<T>, value: T): void {
  if ((observable as IFromObservableInternal<T>)[FROM_OBSERVABLE_PRIVATE].state === 'complete') {
    throw new Error(`Cannot emit values from this Observable because it is in a 'complete' state.`);
  } else {
    if ((observable as IFromObservableInternal<T>)[FROM_OBSERVABLE_PRIVATE].onComplete === 'cache') {
      (observable as IFromObservableInternal<T>)[FROM_OBSERVABLE_PRIVATE].values.push(value);
    }
    ObservableEmitAll<T>(observable, value);
  }
}

export function FromObservableComplete<T>(observable: IFromObservable<T>): void {
  (observable as IFromObservableInternal<T>)[FROM_OBSERVABLE_PRIVATE].state = 'complete';

  if (((observable as IFromObservableInternal<T>)[FROM_OBSERVABLE_PRIVATE].onComplete === 'clear') || ((observable as IFromObservableInternal<T>)[FROM_OBSERVABLE_PRIVATE].onComplete === 'clear-strict')) {
    setTimeout(() => {
      ObservableClearObservers<T>(observable);
    }, 0);
  }
}


export function FromObservableFactory<TBase extends Constructor<IObservable<any>>>(superClass: TBase) {
  type T = any;
  if (!IsObservableLikeConstructor(superClass)) {
    throw new TypeError(`Expected Observables' constructor as superClass`);
  }
  const setSuperArgs = GetSetSuperArgsFunction(IsFactoryClass(superClass));

  return FactoryClass(class FromObservable extends superClass implements IFromObservable<T> {
    constructor(...args: any[]) {
      const [create, onComplete]: TFromObservableConstructorArgs<T> = args[0];
      let context: IObservableContext<T> = void 0;
      super(...setSuperArgs(args.slice(1), [
        (_context: IObservableContext<T>) => {
          context = _context;
          return {
            onObserved: (observer: IObserver<T>): void => {
              FromObservableOnObserved(this, observer);
            },
            onUnobserved: (observer: IObserver<T>): void => {
              FromObservableOnUnobserved(this, observer);
            },
          };
        }
      ]));
      ConstructFromObservable<T>(this, context, create, onComplete);
    }

    get complete(): boolean {
      return ((this as unknown) as IFromObservableInternal<T>)[FROM_OBSERVABLE_PRIVATE].state === 'complete';
    }
  })<TFromObservableConstructorArgs<T>>('FromObservable', [IS_FROM_OBSERVABLE_CONSTRUCTOR]);
}


export const FromObservable: IFromObservableConstructor =  class FromObservable extends FromObservableFactory(ObservableFactory<ObjectConstructor>(Object)) {
  constructor(create?: (context: IFromObservableContext<any>) => (IObservableHook<any> | void), onComplete?: TFromObservableCompleteAction) {
    super([create, onComplete], []);
  }
};


/*--------------------------*/


export function NewFromObservableContext<T>(observable: IFromObservable<T>): IFromObservableContext<T> {
  AllowObservableContextBaseConstruct(true);
  const context: IFromObservableContext<T> = new((FromObservableContext as any) as IFromObservableContextConstructor)<T>(observable);
  AllowObservableContextBaseConstruct(false);
  return context;
}

export function FromObservableContextEmit<T>(context: IFromObservableContext<T>, value: T): void {
  FromObservableEmit<T>(context.observable, value);
}

export function FromObservableContextComplete<T>(context: IFromObservableContext<T>): void {
  FromObservableComplete<T>(context.observable);
}

export class FromObservableContext<T> extends ObservableContextBase<T> implements IFromObservableContext<T> {
  protected constructor(observable: IFromObservable<T>) {
    super(observable);
  }

  get observable(): IFromObservable<T> {
    return ((this as unknown) as IObservableContextBaseInternal<T>)[OBSERVABLE_CONTEXT_BASE_PRIVATE].observable as IFromObservable<T>;
  }

  emit(value: T): void {
    FromObservableContextEmit<T>(this, value);
  }

  complete(): void {
    FromObservableContextComplete<T>(this);
  }
}
