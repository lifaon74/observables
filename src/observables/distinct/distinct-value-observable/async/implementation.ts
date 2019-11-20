import { IObservableTypedConstructor } from '../../../../core/observable/interfaces';
import { IObserver } from '../../../../core/observer/interfaces';
import {
  IAsyncDistinctValueObservable, IAsyncDistinctValueObservableConstructor, IAsyncDistinctValueObservableTypedConstructor
} from './interfaces';
import { GetSetSuperArgsFunction, IsFactoryClass, MakeFactory } from '../../../../classes/class-helpers/factory';
import { IDistinctValueObservable, IDistinctValueObservableTypedConstructor } from '../sync/interfaces';
import { DistinctValueObservableFactory, } from '../sync/implementation';
import { Constructor } from '../../../../classes/class-helpers/types';
import { BaseClass, IBaseClassConstructor } from '../../../../classes/class-helpers/base-class';
import { IS_OBSERVABLE_LIKE_CONSTRUCTOR } from '../../../../core/observable/constructor';
import { ObservableFactory } from '../../../../core/observable/implementation';
import { IObservableHook } from '../../../../core/observable/hook/interfaces';
import { IDistinctValueObservableContext } from '../sync/context/interfaces';
import { IsDistinctValueObservableConstructor } from '../sync/constructor';
import { IAsyncDistinctValueObservableContext } from './context/interfaces';
import { DISTINCT_ASYNC_VALUE_OBSERVABLE_PRIVATE, IAsyncDistinctValueObservableInternal } from './privates';
import { ConstructAsyncDistinctValueObservable, IS_ASYNC_VALUE_OBSERVABLE_CONSTRUCTOR } from './constructor';
import { TAsyncDistinctValueObservableConstructorArgs } from './types';


/** CONSTRUCTOR FUNCTIONS **/

export function AsyncDistinctValueObservableOnObserved<T>(instance: IAsyncDistinctValueObservable<T>, observer: IObserver<T>): void {
  (instance as IAsyncDistinctValueObservableInternal<T>)[DISTINCT_ASYNC_VALUE_OBSERVABLE_PRIVATE].onObserveHook(observer);
}

export function AsyncDistinctValueObservableOnUnobserved<T>(instance: IAsyncDistinctValueObservable<T>, observer: IObserver<T>): void {
  (instance as IAsyncDistinctValueObservableInternal<T>)[DISTINCT_ASYNC_VALUE_OBSERVABLE_PRIVATE].onUnobserveHook(observer);
}

/** CLASS AND FACTORY **/

function PureAsyncDistinctValueObservableFactory<TBase extends Constructor<IDistinctValueObservable<any>>>(superClass: TBase) {
  type T = any;
  if (!IsDistinctValueObservableConstructor(superClass)) {
    throw new TypeError(`Expected DistinctValueObservables' constructor as superClass`);
  }
  const setSuperArgs = GetSetSuperArgsFunction(IsFactoryClass(superClass));

  return class AsyncDistinctValueObservable extends superClass implements IAsyncDistinctValueObservable<T> {
    constructor(...args: any[]) {
      const [create]: TAsyncDistinctValueObservableConstructorArgs<T> = args[0];
      let context: IDistinctValueObservableContext<T>;
      super(...setSuperArgs(args.slice(1), [
        (_context: IDistinctValueObservableContext<T>) => {
          context = _context;
          return {
            onObserved: (observer: IObserver<T>): void => {
              AsyncDistinctValueObservableOnObserved(this, observer);
            },
            onUnobserved: (observer: IObserver<T>): void => {
              AsyncDistinctValueObservableOnUnobserved(this, observer);
            }
          };
        }
      ]));
      // @ts-ignore
      ConstructAsyncDistinctValueObservable<T>(this, context, create);
    }
  };
}

export let AsyncDistinctValueObservable: IAsyncDistinctValueObservableConstructor;

export function AsyncDistinctValueObservableFactory<TBase extends Constructor<IDistinctValueObservable<any>>, T = unknown>(superClass: TBase) {
  return MakeFactory<IAsyncDistinctValueObservableTypedConstructor<T>, [], TBase>(PureAsyncDistinctValueObservableFactory, [], superClass, {
    name: 'AsyncDistinctValueObservable',
    instanceOf: AsyncDistinctValueObservable,
    waterMarks: [IS_ASYNC_VALUE_OBSERVABLE_CONSTRUCTOR, IS_OBSERVABLE_LIKE_CONSTRUCTOR],
  });
}

export function AsyncDistinctValueObservableBaseFactory<TBase extends Constructor, T = unknown>(superClass: TBase) {
  return MakeFactory<IAsyncDistinctValueObservableTypedConstructor<T>, [IDistinctValueObservableTypedConstructor<T>, IObservableTypedConstructor<T>], TBase>(PureAsyncDistinctValueObservableFactory, [DistinctValueObservableFactory, ObservableFactory], superClass, {
    name: 'AsyncDistinctValueObservable',
    instanceOf: AsyncDistinctValueObservable,
    waterMarks: [IS_ASYNC_VALUE_OBSERVABLE_CONSTRUCTOR, IS_OBSERVABLE_LIKE_CONSTRUCTOR],
  });
}

AsyncDistinctValueObservable = class AsyncDistinctValueObservable extends AsyncDistinctValueObservableBaseFactory<IBaseClassConstructor, unknown>(BaseClass) {
  constructor(create?: (context: IAsyncDistinctValueObservableContext<unknown>) => (IObservableHook<unknown> | void)) {
    super([create], [], []);
  }
} as IAsyncDistinctValueObservableConstructor;







