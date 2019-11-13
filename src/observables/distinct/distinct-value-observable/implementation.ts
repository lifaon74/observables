import {
  IObservable, IObservableConstructor
} from '../../../core/observable/interfaces';
import { IObserver } from '../../../core/observer/interfaces';
import { ConstructClassWithPrivateMembers } from '../../../misc/helpers/ClassWithPrivateMembers';
import {
  IDistinctValueObservable, IDistinctValueObservableConstructor, IDistinctValueObservableContext, IDistinctValueObservableContextConstructor,
  TDistinctValueObservableConstructorArgs
} from './interfaces';
import {
  GetSetSuperArgsFunction, HasFactoryWaterMark, IsFactoryClass, MakeFactory
} from '../../../classes/class-helpers/factory';
import { IsObject } from '../../../helpers';
import { Constructor } from '../../../classes/class-helpers/types';
import { BaseClass, IBaseClassConstructor } from '../../../classes/class-helpers/base-class';
import { IObservableInternal } from '../../../core/observable/privates';
import { IS_OBSERVABLE_LIKE_CONSTRUCTOR, IsObservableLikeConstructor } from '../../../core/observable/constructor';
import { ObservableEmitAll } from '../../../core/observable/functions';
import { ObservableFactory } from '../../../core/observable/implementation';
import { IObservableHook } from '../../../core/observable/hook/interfaces';
import { IObservableContext } from '../../../core/observable/context/interfaces';
import {
  IObservableContextBaseInternal, OBSERVABLE_CONTEXT_BASE_PRIVATE
} from '../../../core/observable/context/base/privates';
import { AllowObservableContextBaseConstruct } from '../../../core/observable/context/base/constructor';
import { ObservableContextBase } from '../../../core/observable/context/base/implementation';
import { IObservableHookPrivate } from '../../../core/observable/hook/privates';
import { InitObservableHook } from '../../../core/observable/hook/init';

export const VALUE_OBSERVABLE_PRIVATE = Symbol('value-observable-private');

export interface IDistinctValueObservablePrivate<T> extends IObservableHookPrivate<T> {
  context: IObservableContext<T>;
  value: T;
  count: number;
  lastCountPerObserver: WeakMap<IObserver<T>, number>;
}

export interface IDistinctValueObservableInternal<T> extends IDistinctValueObservable<T>, IObservableInternal<T> {
  [VALUE_OBSERVABLE_PRIVATE]: IDistinctValueObservablePrivate<T>;
}


export function ConstructDistinctValueObservable<T>(
  observable: IDistinctValueObservable<T>,
  context: IObservableContext<T>,
  create?: (context: IDistinctValueObservableContext<T>) => IObservableHook<T> | void
): void {
  ConstructClassWithPrivateMembers(observable, VALUE_OBSERVABLE_PRIVATE);

  (observable as IDistinctValueObservableInternal<T>)[VALUE_OBSERVABLE_PRIVATE].context = context;
  // (observable as IDistinctValueObservableInternal<T>)[VALUE_OBSERVABLE_PRIVATE].value = void 0;
  (observable as IDistinctValueObservableInternal<T>)[VALUE_OBSERVABLE_PRIVATE].count = 0;
  (observable as IDistinctValueObservableInternal<T>)[VALUE_OBSERVABLE_PRIVATE].lastCountPerObserver = new WeakMap<IObserver<T>, number>();

  InitObservableHook(
    observable,
    (observable as IDistinctValueObservableInternal<T>)[VALUE_OBSERVABLE_PRIVATE],
    NewDistinctValueObservableContext,
    create,
  );
}


export function IsDistinctValueObservable(value: any): value is IDistinctValueObservable<any> {
  return IsObject(value)
    && value.hasOwnProperty(VALUE_OBSERVABLE_PRIVATE);
}

const IS_VALUE_OBSERVABLE_CONSTRUCTOR = Symbol('is-value-observable-constructor');

export function IsDistinctValueObservableConstructor(value: any): boolean {
  return (typeof value === 'function') && ((value === DistinctValueObservable) || HasFactoryWaterMark(value, IS_VALUE_OBSERVABLE_CONSTRUCTOR));
}


export function DistinctValueObservableOnObserved<T>(observable: IDistinctValueObservable<T>, observer: IObserver<T>): void {
  if ((observable as IDistinctValueObservableInternal<T>)[VALUE_OBSERVABLE_PRIVATE].lastCountPerObserver.has(observer)) {
    if ((observable as IDistinctValueObservableInternal<T>)[VALUE_OBSERVABLE_PRIVATE].count !== (observable as IDistinctValueObservableInternal<T>)[VALUE_OBSERVABLE_PRIVATE].lastCountPerObserver.get(observer)) {
      observer.emit((observable as IDistinctValueObservableInternal<T>)[VALUE_OBSERVABLE_PRIVATE].value, observable);
    }
    (observable as IDistinctValueObservableInternal<T>)[VALUE_OBSERVABLE_PRIVATE].lastCountPerObserver.delete(observer);
  } else {
    if ((observable as IDistinctValueObservableInternal<T>)[VALUE_OBSERVABLE_PRIVATE].count !== 0) {
      observer.emit((observable as IDistinctValueObservableInternal<T>)[VALUE_OBSERVABLE_PRIVATE].value, observable);
    }
  }
  (observable as IDistinctValueObservableInternal<T>)[VALUE_OBSERVABLE_PRIVATE].onObserveHook(observer);
}

export function DistinctValueObservableOnUnobserved<T>(observable: IDistinctValueObservable<T>, observer: IObserver<T>): void {
  (observable as IDistinctValueObservableInternal<T>)[VALUE_OBSERVABLE_PRIVATE].lastCountPerObserver.set(observer, (observable as IDistinctValueObservableInternal<T>)[VALUE_OBSERVABLE_PRIVATE].count);
  (observable as IDistinctValueObservableInternal<T>)[VALUE_OBSERVABLE_PRIVATE].onUnobserveHook(observer);
}

export function DistinctValueObservableEmit<T>(observable: IDistinctValueObservable<T>, value: T): void {
  if (value !== (observable as IDistinctValueObservableInternal<T>)[VALUE_OBSERVABLE_PRIVATE].value) {
    (observable as IDistinctValueObservableInternal<T>)[VALUE_OBSERVABLE_PRIVATE].value = value;
    (observable as IDistinctValueObservableInternal<T>)[VALUE_OBSERVABLE_PRIVATE].count++;
    ObservableEmitAll<T>(observable, value);
  }
}


// export class DistinctValueObservable<T> extends Observable<T> implements IDistinctValueObservable<T> {
//   constructor() {
//     let context: IObservableContext<T> = void 0;
//     super((_context: IObservableContext<T>) => {
//       context = _context;
//       return {
//         onObserved: (observer: IObserver<T>): void => {
//           DistinctValueObservableOnObserved<T>(this, observer);
//         },
//         onUnobserved: (observer: IObserver<T>): void => {
//           DistinctValueObservableOnUnobserved<T>(this, observer);
//         },
//       };
//     });
//     ConstructDistinctValueObservable<T>(this, context);
//   }
//
//   get value(): T {
//     return ((this as unknown) as IDistinctValueObservableInternal<T>)[OBSERVABLE_VALUE_PRIVATE].value;
//   }
//
//   valueOf(): T {
//     return ((this as unknown) as IDistinctValueObservableInternal<T>)[OBSERVABLE_VALUE_PRIVATE].value;
//   }
// }


export function PureDistinctValueObservableFactory<TBase extends Constructor<IObservable<any>>>(superClass: TBase) {
  type T = any;
  if (!IsObservableLikeConstructor(superClass)) {
    throw new TypeError(`Expected Observables' constructor as superClass`);
  }
  const setSuperArgs = GetSetSuperArgsFunction(IsFactoryClass(superClass));

  return class DistinctValueObservable extends superClass implements IDistinctValueObservable<T> {
    constructor(...args: any[]) {
      const [create]: TDistinctValueObservableConstructorArgs<T> = args[0];
      let context: IObservableContext<T>;
      super(...setSuperArgs(args.slice(1), [
        (_context: IObservableContext<T>) => {
          context = _context;
          return {
            onObserved: (observer: IObserver<T>): void => {
              DistinctValueObservableOnObserved(this, observer);
            },
            onUnobserved: (observer: IObserver<T>): void => {
              DistinctValueObservableOnUnobserved(this, observer);
            }
          };
        }
      ]));
      // @ts-ignore
      ConstructDistinctValueObservable<T>(this, context, create);
    }
  };
}

export let DistinctValueObservable: IDistinctValueObservableConstructor;

export function DistinctValueObservableFactory<TBase extends Constructor<IObservable<any>>>(superClass: TBase) {
  return MakeFactory<IDistinctValueObservableConstructor, [], TBase>(PureDistinctValueObservableFactory, [], superClass, {
    name: 'DistinctValueObservable',
    instanceOf: DistinctValueObservable,
    waterMarks: [IS_VALUE_OBSERVABLE_CONSTRUCTOR, IS_OBSERVABLE_LIKE_CONSTRUCTOR],
  });
}

export function DistinctValueObservableBaseFactory<TBase extends Constructor>(superClass: TBase) {
  return MakeFactory<IDistinctValueObservableConstructor, [IObservableConstructor], TBase>(PureDistinctValueObservableFactory, [ObservableFactory], superClass, {
    name: 'DistinctValueObservable',
    instanceOf: DistinctValueObservable,
    waterMarks: [IS_VALUE_OBSERVABLE_CONSTRUCTOR, IS_OBSERVABLE_LIKE_CONSTRUCTOR],
  });
}

DistinctValueObservable = class DistinctValueObservable extends DistinctValueObservableBaseFactory<IBaseClassConstructor>(BaseClass) {
  constructor(create?: (context: IDistinctValueObservableContext<any>) => (IObservableHook<any> | void)) {
    super([create], []);
  }
} as IDistinctValueObservableConstructor;


/*--------------------------*/


export function NewDistinctValueObservableContext<T>(observable: IDistinctValueObservable<T>): IDistinctValueObservableContext<T> {
  AllowObservableContextBaseConstruct(true);
  const context: IDistinctValueObservableContext<T> = new ((DistinctValueObservableContext as any) as IDistinctValueObservableContextConstructor)<T>(observable);
  AllowObservableContextBaseConstruct(false);
  return context;
}

export function DistinctValueObservableContextEmit<T>(context: IDistinctValueObservableContext<T>, value: T): void {
  DistinctValueObservableEmit<T>(context.observable, value);
}


export class DistinctValueObservableContext<T> extends ObservableContextBase<T> implements IDistinctValueObservableContext<T> {
  protected constructor(observable: IDistinctValueObservable<T>) {
    super(observable);
  }

  get observable(): IDistinctValueObservable<T> {
    return ((this as unknown) as IObservableContextBaseInternal<T>)[OBSERVABLE_CONTEXT_BASE_PRIVATE].observable as IDistinctValueObservable<T>;
  }

  emit(value: T): void {
    DistinctValueObservableContextEmit<T>(this, value);
  }
}






