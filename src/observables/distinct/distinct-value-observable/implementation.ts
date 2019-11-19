import { IObservable, IObservableTypedConstructor } from '../../../core/observable/interfaces';
import { IObserver } from '../../../core/observer/interfaces';
import {
  IDistinctValueObservable, IDistinctValueObservableConstructor, IDistinctValueObservableTypedConstructor
} from './interfaces';
import { GetSetSuperArgsFunction, IsFactoryClass, MakeFactory } from '../../../classes/class-helpers/factory';
import { Constructor } from '../../../classes/class-helpers/types';
import { BaseClass, IBaseClassConstructor } from '../../../classes/class-helpers/base-class';
import { IS_OBSERVABLE_LIKE_CONSTRUCTOR, IsObservableLikeConstructor } from '../../../core/observable/constructor';
import { ObservableFactory } from '../../../core/observable/implementation';
import { IObservableHook } from '../../../core/observable/hook/interfaces';
import { IObservableContext } from '../../../core/observable/context/interfaces';
import {
  DISTINCT_VALUE_OBSERVABLE_PRIVATE, IDistinctValueObservableInternal, IDistinctValueObservablePrivate
} from './privates';
import { TDistinctValueObservableConstructorArgs } from './types';
import { IDistinctValueObservableContext } from './context/interfaces';
import { ConstructDistinctValueObservable, IS_VALUE_OBSERVABLE_CONSTRUCTOR } from './constructor';


/** CONSTRUCTOR FUNCTIONS **/

export function DistinctValueObservableOnObserved<T>(instance: IDistinctValueObservable<T>, observer: IObserver<T>): void {
  const privates: IDistinctValueObservablePrivate<T> = (instance as IDistinctValueObservableInternal<T>)[DISTINCT_VALUE_OBSERVABLE_PRIVATE];
  if (privates.lastCountPerObserver.has(observer)) {
    if (privates.count !== privates.lastCountPerObserver.get(observer)) {
      observer.emit(privates.value, instance);
    }
    privates.lastCountPerObserver.delete(observer);
  } else {
    if (privates.count !== 0) {
      observer.emit(privates.value, instance);
    }
  }
  privates.onObserveHook(observer);
}

export function DistinctValueObservableOnUnobserved<T>(instance: IDistinctValueObservable<T>, observer: IObserver<T>): void {
  const privates: IDistinctValueObservablePrivate<T> = (instance as IDistinctValueObservableInternal<T>)[DISTINCT_VALUE_OBSERVABLE_PRIVATE];
  privates.lastCountPerObserver.set(observer, privates.count);
  privates.onUnobserveHook(observer);
}


/** CLASS AND FACTORY **/

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

export function DistinctValueObservableFactory<TBase extends Constructor<IObservable<any>>, T = unknown>(superClass: TBase) {
  return MakeFactory<IDistinctValueObservableTypedConstructor<T>, [], TBase>(PureDistinctValueObservableFactory, [], superClass, {
    name: 'DistinctValueObservable',
    instanceOf: DistinctValueObservable,
    waterMarks: [IS_VALUE_OBSERVABLE_CONSTRUCTOR, IS_OBSERVABLE_LIKE_CONSTRUCTOR],
  });
}

export function DistinctValueObservableBaseFactory<TBase extends Constructor, T = unknown>(superClass: TBase) {
  return MakeFactory<IDistinctValueObservableTypedConstructor<T>, [IObservableTypedConstructor<T>], TBase>(PureDistinctValueObservableFactory, [ObservableFactory], superClass, {
    name: 'DistinctValueObservable',
    instanceOf: DistinctValueObservable,
    waterMarks: [IS_VALUE_OBSERVABLE_CONSTRUCTOR, IS_OBSERVABLE_LIKE_CONSTRUCTOR],
  });
}

DistinctValueObservable = class DistinctValueObservable extends DistinctValueObservableBaseFactory<IBaseClassConstructor, unknown>(BaseClass) {
  constructor(create?: (context: IDistinctValueObservableContext<unknown>) => (IObservableHook<unknown> | void)) {
    super([create], []);
  }
} as IDistinctValueObservableConstructor;








