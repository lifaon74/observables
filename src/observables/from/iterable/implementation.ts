import {
  IFromIterableObservable, IFromIterableObservableConstructor, TFromIterableObservableConstructorArgs
} from './interfaces';
import { ConstructClassWithPrivateMembers } from '../../../misc/helpers/ClassWithPrivateMembers';
import { IsObject } from '../../../helpers';
import {
  IFromObservable, IFromObservableContext, TFromObservableCompleteAction
} from '../interfaces';
import { ObservableFactory } from '../../../core/observable/implementation';
import {
  FROM_OBSERVABLE_PRIVATE,
  FromObservableFactory, IFromObservableInternal, IsFromObservableConstructor
} from '../implementation';
import {
  Constructor, FactoryClass, GetSetSuperArgsFunction, HasFactoryWaterMark, IsFactoryClass
} from '../../../classes/factory';


export const FROM_ITERABLE_OBSERVABLE_PRIVATE = Symbol('from-iterable-observable-private');

export interface IFromIterableObservablePrivate<T> {
  context: IFromObservableContext<T>;
  iterable: Iterable<T>;
}

export interface IFromIterableObservableInternal<T> extends IFromIterableObservable<T>, IFromObservableInternal<T> {
  [FROM_ITERABLE_OBSERVABLE_PRIVATE]: IFromIterableObservablePrivate<T>;
}

export function ConstructFromIterableObservable<T>(
  observable: IFromIterableObservable<T>,
  context: IFromObservableContext<T>,
  iterable: Iterable<T>,
): void {
  ConstructClassWithPrivateMembers(observable, FROM_ITERABLE_OBSERVABLE_PRIVATE);
  (observable as IFromIterableObservableInternal<T>)[FROM_ITERABLE_OBSERVABLE_PRIVATE].context = context;
  (observable as IFromIterableObservableInternal<T>)[FROM_ITERABLE_OBSERVABLE_PRIVATE].iterable = iterable;
}

export function IsFromIterableObservable(value: any): value is IFromIterableObservable<any> {
  return IsObject(value)
    && value.hasOwnProperty(FROM_ITERABLE_OBSERVABLE_PRIVATE);
}

const IS_FROM_ITERABLE_OBSERVABLE_CONSTRUCTOR = Symbol('is-from-iterable-observable-constructor');
export function IsFromIterableObservableConstructor(value: any): boolean {
  return (typeof value === 'function')
    && HasFactoryWaterMark(value, IS_FROM_ITERABLE_OBSERVABLE_CONSTRUCTOR);
}


export function FromIterableObservableOnObserved<T>(observable: IFromIterableObservable<T>): void {
  if ((observable as IFromIterableObservableInternal<T>)[FROM_OBSERVABLE_PRIVATE].state === 'awaiting') {
    (observable as IFromIterableObservableInternal<T>)[FROM_OBSERVABLE_PRIVATE].state = 'emitting';

    const iterator: Iterator<T> = (observable as IFromIterableObservableInternal<T>)[FROM_ITERABLE_OBSERVABLE_PRIVATE].iterable[Symbol.iterator]();
    let result: IteratorResult<T>;
    while (!(result = iterator.next()).done) {
      (observable as IFromIterableObservableInternal<T>)[FROM_ITERABLE_OBSERVABLE_PRIVATE].context.emit(result.value);
    }
    (observable as IFromIterableObservableInternal<T>)[FROM_ITERABLE_OBSERVABLE_PRIVATE].context.complete();
  }
}


export function FromIterableObservableFactory<TBase extends Constructor<IFromObservable<any>>>(superClass: TBase) {
  type T = any;
  if (!IsFromObservableConstructor(superClass)) {
    throw new TypeError(`Expected FromObservableConstructor as superClass`);
  }
  const setSuperArgs = GetSetSuperArgsFunction(IsFactoryClass(superClass));

  return FactoryClass(class FromIterableObservable extends superClass implements IFromIterableObservable<T> {

    constructor(...args: any[]) {
      const [iterable, onComplete]: TFromIterableObservableConstructorArgs<T> = args[0];
      let context: IFromObservableContext<T> = void 0;
      super(...setSuperArgs(args.slice(1), [
        (_context: IFromObservableContext<T>) => {
          context = _context;
          return {
            onObserved(): void {
              FromIterableObservableOnObserved<T>(this);
            }
          };
        }, onComplete
      ]));
      ConstructFromIterableObservable<T>(this, context, iterable);
    }
  })<TFromIterableObservableConstructorArgs<T>>('FromIterableObservable', [IS_FROM_ITERABLE_OBSERVABLE_CONSTRUCTOR]);
}

export const FromIterableObservable: IFromIterableObservableConstructor = class FromIterableObservable extends FromIterableObservableFactory(FromObservableFactory(ObservableFactory<ObjectConstructor>(Object))) {
  constructor(iterable: Iterable<any>, onComplete?: TFromObservableCompleteAction) {
    super([iterable, onComplete], [], []);
  }
};
