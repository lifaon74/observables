import {
  IFromIterableObservable, IFromIterableObservableConstructor, TFromIterableObservableConstructorArgs
} from './interfaces';
import { ConstructClassWithPrivateMembers } from '../../../misc/helpers/ClassWithPrivateMembers';
import { IsObject } from '../../../helpers';
import {
  IFromObservable, IFromObservableCompleteOptions, IFromObservableConstructor, IFromObservableContext
} from '../interfaces';
import { ObservableFactory } from '../../../core/observable/implementation';
import { FromObservableFactory, IFromObservableInternal, IsFromObservableConstructor } from '../implementation';
import {
  Constructor, GetSetSuperArgsFunction, HasFactoryWaterMark, IsFactoryClass, MakeFactory
} from '../../../classes/factory';
import { IObservableConstructor } from '../../../core/observable/interfaces';


export const FROM_ITERABLE_OBSERVABLE_PRIVATE = Symbol('from-iterable-observable-private');

export interface IFromIterableObservablePrivate<T> {
  context: IFromObservableContext<T>;
  pending: boolean;
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
  (observable as IFromIterableObservableInternal<T>)[FROM_ITERABLE_OBSERVABLE_PRIVATE].pending = true;
  (observable as IFromIterableObservableInternal<T>)[FROM_ITERABLE_OBSERVABLE_PRIVATE].iterable = iterable;
}

export function IsFromIterableObservable(value: any): value is IFromIterableObservable<any> {
  return IsObject(value)
    && value.hasOwnProperty(FROM_ITERABLE_OBSERVABLE_PRIVATE as symbol);
}

const IS_FROM_ITERABLE_OBSERVABLE_CONSTRUCTOR = Symbol('is-from-iterable-observable-constructor');

export function IsFromIterableObservableConstructor(value: any): boolean {
  return (typeof value === 'function')
    && HasFactoryWaterMark(value, IS_FROM_ITERABLE_OBSERVABLE_CONSTRUCTOR);
}


export function FromIterableObservableOnObserved<T>(observable: IFromIterableObservable<T>): void {
  if ((observable as IFromIterableObservableInternal<T>)[FROM_ITERABLE_OBSERVABLE_PRIVATE].pending) {
    (observable as IFromIterableObservableInternal<T>)[FROM_ITERABLE_OBSERVABLE_PRIVATE].pending = false;

    const iterator: Iterator<T> = (observable as IFromIterableObservableInternal<T>)[FROM_ITERABLE_OBSERVABLE_PRIVATE].iterable[Symbol.iterator]();
    let result: IteratorResult<T>;
    while (!(result = iterator.next()).done) {
      (observable as IFromIterableObservableInternal<T>)[FROM_ITERABLE_OBSERVABLE_PRIVATE].context.emit(result.value);
    }
    (observable as IFromIterableObservableInternal<T>)[FROM_ITERABLE_OBSERVABLE_PRIVATE].context.complete();
  }
}


export function PureFromIterableObservableFactory<TBase extends Constructor<IFromObservable<any>>>(superClass: TBase) {
  type T = any;
  if (!IsFromObservableConstructor(superClass)) {
    throw new TypeError(`Expected FromObservableConstructor as superClass`);
  }
  const setSuperArgs = GetSetSuperArgsFunction(IsFactoryClass(superClass));

  return class FromIterableObservable extends superClass implements IFromIterableObservable<T> {
    constructor(...args: any[]) {
      const [iterable, onCompleteOptions]: TFromIterableObservableConstructorArgs<T> = args[0];
      let context: IFromObservableContext<T>;
      super(...setSuperArgs(args.slice(1), [
        (_context: IFromObservableContext<T>) => {
          context = _context;
          return {
            onObserved(): void {
              FromIterableObservableOnObserved<T>(this);
            }
          };
        }, onCompleteOptions
      ]));
      // @ts-ignore
      ConstructFromIterableObservable<T>(this, context, iterable);
    }
  };
}

export let FromIterableObservable: IFromIterableObservableConstructor;

export function FromIterableObservableFactory<TBase extends Constructor<IFromObservable<any>>>(superClass: TBase) {
  return MakeFactory<IFromIterableObservableConstructor, [], TBase>(PureFromIterableObservableFactory, [], superClass, {
    name: 'FromIterableObservable',
    instanceOf: FromIterableObservable,
    waterMarks: [IS_FROM_ITERABLE_OBSERVABLE_CONSTRUCTOR],
  });
}

export function FromIterableObservableBaseFactory<TBase extends Constructor>(superClass: TBase) {
  return MakeFactory<IFromIterableObservableConstructor, [IFromObservableConstructor, IObservableConstructor], TBase>(PureFromIterableObservableFactory, [FromObservableFactory, ObservableFactory], superClass, {
    name: 'FromIterableObservable',
    instanceOf: FromIterableObservable,
    waterMarks: [IS_FROM_ITERABLE_OBSERVABLE_CONSTRUCTOR,],
  });
}

FromIterableObservable = class FromIterableObservable extends FromIterableObservableBaseFactory<ObjectConstructor>(Object) {
  constructor(iterable: Iterable<any>, onCompleteOptions?: IFromObservableCompleteOptions) {
    super([iterable, onCompleteOptions], [], []);
  }
} as IFromIterableObservableConstructor;
