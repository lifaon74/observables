import {
  AllowObservableContextBaseConstruct, IObservableContextBaseInternal, IObservableInternal,
  IS_OBSERVABLE_LIKE_CONSTRUCTOR, IsObservableLikeConstructor, OBSERVABLE_CONTEXT_BASE_PRIVATE, ObservableContextBase,
  ObservableEmitAll, ObservableFactory
} from '../../../core/observable/implementation';
import {
  IObservable, IObservableConstructor, IObservableContext, IObservableHook
} from '../../../core/observable/interfaces';
import { IObserver } from '../../../core/observer/interfaces';
import { ConstructClassWithPrivateMembers } from '../../../misc/helpers/ClassWithPrivateMembers';
import {
  IValueObservable, IValueObservableConstructor, IValueObservableContext, IValueObservableContextConstructor,
  TValueObservableConstructorArgs
} from './interfaces';
import {
  Constructor, GetSetSuperArgsFunction, HasFactoryWaterMark, IsFactoryClass, MakeFactory
} from '../../../classes/factory';
import { InitObservableHook, IObservableHookPrivate } from '../../../core/observable/hook';
import { IsObject } from '../../../helpers';

export const VALUE_OBSERVABLE_PRIVATE = Symbol('value-observable-private');

export interface IValueObservablePrivate<T> extends IObservableHookPrivate<T> {
  context: IObservableContext<T>;
  value: T | undefined;
  count: number;
  lastCountPerObserver: WeakMap<IObserver<T>, number>;
}

export interface IValueObservableInternal<T> extends IValueObservable<T>, IObservableInternal<T> {
  [VALUE_OBSERVABLE_PRIVATE]: IValueObservablePrivate<T>;
}


export function ConstructValueObservable<T>(
  observable: IValueObservable<T>,
  context: IObservableContext<T>,
  create?: (context: IValueObservableContext<T>) => IObservableHook<T> | void
): void {
  ConstructClassWithPrivateMembers(observable, VALUE_OBSERVABLE_PRIVATE);
  InitObservableHook(
    observable,
    (observable as IValueObservableInternal<T>)[VALUE_OBSERVABLE_PRIVATE],
    create,
    NewValueObservableContext
  );
  (observable as IValueObservableInternal<T>)[VALUE_OBSERVABLE_PRIVATE].context = context;
  (observable as IValueObservableInternal<T>)[VALUE_OBSERVABLE_PRIVATE].value = void 0;
  (observable as IValueObservableInternal<T>)[VALUE_OBSERVABLE_PRIVATE].count = 0;
  (observable as IValueObservableInternal<T>)[VALUE_OBSERVABLE_PRIVATE].lastCountPerObserver = new WeakMap<IObserver<T>, number>();
}


export function IsValueObservable(value: any): value is IValueObservable<any> {
  return IsObject(value)
    && value.hasOwnProperty(VALUE_OBSERVABLE_PRIVATE);
}

const IS_VALUE_OBSERVABLE_CONSTRUCTOR = Symbol('is-value-observable-constructor');
export function IsValueObservableConstructor(value: any): boolean {
  return (typeof value === 'function') && ((value === ValueObservable) || HasFactoryWaterMark(value, IS_VALUE_OBSERVABLE_CONSTRUCTOR));
}


export function ValueObservableOnObserved<T>(observable: IValueObservable<T>, observer: IObserver<T>): void {
  if ((observable as IValueObservableInternal<T>)[VALUE_OBSERVABLE_PRIVATE].lastCountPerObserver.has(observer)) {
    if ((observable as IValueObservableInternal<T>)[VALUE_OBSERVABLE_PRIVATE].count !== (observable as IValueObservableInternal<T>)[VALUE_OBSERVABLE_PRIVATE].lastCountPerObserver.get(observer)) {
      observer.emit((observable as IValueObservableInternal<T>)[VALUE_OBSERVABLE_PRIVATE].value, observable);
    }
    (observable as IValueObservableInternal<T>)[VALUE_OBSERVABLE_PRIVATE].lastCountPerObserver.delete(observer);
  } else {
    if ((observable as IValueObservableInternal<T>)[VALUE_OBSERVABLE_PRIVATE].count !== 0) {
      observer.emit((observable as IValueObservableInternal<T>)[VALUE_OBSERVABLE_PRIVATE].value, observable);
    }
  }
  (observable as IValueObservableInternal<T>)[VALUE_OBSERVABLE_PRIVATE].onObserveHook(observer);
}

export function ValueObservableOnUnobserved<T>(observable: IValueObservable<T>, observer: IObserver<T>): void {
  (observable as IValueObservableInternal<T>)[VALUE_OBSERVABLE_PRIVATE].lastCountPerObserver.set(observer, (observable as IValueObservableInternal<T>)[VALUE_OBSERVABLE_PRIVATE].count);
  (observable as IValueObservableInternal<T>)[VALUE_OBSERVABLE_PRIVATE].onUnobserveHook(observer);
}

export function ValueObservableEmit<T>(observable: IValueObservable<T>, value: T): void {
  if (value !== (observable as IValueObservableInternal<T>)[VALUE_OBSERVABLE_PRIVATE].value) {
    (observable as IValueObservableInternal<T>)[VALUE_OBSERVABLE_PRIVATE].value = value;
    (observable as IValueObservableInternal<T>)[VALUE_OBSERVABLE_PRIVATE].count++;
    ObservableEmitAll<T>(observable, value);
  }
}


// export class ValueObservable<T> extends Observable<T> implements IValueObservable<T> {
//   constructor() {
//     let context: IObservableContext<T> = void 0;
//     super((_context: IObservableContext<T>) => {
//       context = _context;
//       return {
//         onObserved: (observer: IObserver<T>): void => {
//           ValueObservableOnObserved<T>(this, observer);
//         },
//         onUnobserved: (observer: IObserver<T>): void => {
//           ValueObservableOnUnobserved<T>(this, observer);
//         },
//       };
//     });
//     ConstructValueObservable<T>(this, context);
//   }
//
//   get value(): T {
//     return ((this as unknown) as IValueObservableInternal<T>)[OBSERVABLE_VALUE_PRIVATE].value;
//   }
//
//   valueOf(): T {
//     return ((this as unknown) as IValueObservableInternal<T>)[OBSERVABLE_VALUE_PRIVATE].value;
//   }
// }


export function PureValueObservableFactory<TBase extends Constructor<IObservable<any>>>(superClass: TBase) {
  type T = any;
  if (!IsObservableLikeConstructor(superClass)) {
    throw new TypeError(`Expected Observables' constructor as superClass`);
  }
  const setSuperArgs = GetSetSuperArgsFunction(IsFactoryClass(superClass));

  return class ValueObservable extends superClass implements IValueObservable<T> {
    constructor(...args: any[]) {
      const [create]: TValueObservableConstructorArgs<T> = args[0];
      let context: IObservableContext<T> = void 0;
      super(...setSuperArgs(args.slice(1), [
        (_context: IObservableContext<T>) => {
          context = _context;
          return {
            onObserved: (observer: IObserver<T>): void => {
              ValueObservableOnObserved(this, observer);
            },
            onUnobserved: (observer: IObserver<T>): void => {
              ValueObservableOnUnobserved(this, observer);
            }
          };
        }
      ]));
      ConstructValueObservable<T>(this, context, create);
    }
  };
}

export let ValueObservable: IValueObservableConstructor;

export function ValueObservableFactory<TBase extends Constructor<IObservable<any>>>(superClass: TBase) {
  return MakeFactory<IValueObservableConstructor, [], TBase>(PureValueObservableFactory, [], superClass, {
    name: 'ValueObservable',
    instanceOf: ValueObservable,
    waterMarks: [IS_VALUE_OBSERVABLE_CONSTRUCTOR, IS_OBSERVABLE_LIKE_CONSTRUCTOR],
  });
}

export function ValueObservableBaseFactory<TBase extends Constructor>(superClass: TBase) {
  return MakeFactory<IValueObservableConstructor, [IObservableConstructor], TBase>(PureValueObservableFactory, [ObservableFactory], superClass, {
    name: 'ValueObservable',
    instanceOf: ValueObservable,
    waterMarks: [IS_VALUE_OBSERVABLE_CONSTRUCTOR, IS_OBSERVABLE_LIKE_CONSTRUCTOR],
  });
}

ValueObservable = class ValueObservable extends ValueObservableBaseFactory<ObjectConstructor>(Object) {
  constructor(create?: (context: IValueObservableContext<any>) => (IObservableHook<any> | void)) {
    super([create], []);
  }
} as IValueObservableConstructor;



/*--------------------------*/


export function NewValueObservableContext<T>(observable: IValueObservable<T>): IValueObservableContext<T> {
  AllowObservableContextBaseConstruct(true);
  const context: IValueObservableContext<T> = new((ValueObservableContext as any) as IValueObservableContextConstructor)<T>(observable);
  AllowObservableContextBaseConstruct(false);
  return context;
}

export function ValueObservableContextEmit<T>(context: IValueObservableContext<T>, value: T): void {
  ValueObservableEmit<T>(context.observable, value);
}


export class ValueObservableContext<T> extends ObservableContextBase<T> implements IValueObservableContext<T> {
  protected constructor(observable: IValueObservable<T>) {
    super(observable);
  }

  get observable(): IValueObservable<T> {
    return ((this as unknown) as IObservableContextBaseInternal<T>)[OBSERVABLE_CONTEXT_BASE_PRIVATE].observable as IValueObservable<T>;
  }

  emit(value: T): void {
    ValueObservableContextEmit<T>(this, value);
  }
}






