import {
  IFromIterableObservable, IFromIterableObservableConstructor, TFromIterableObservableConstructorArgs
} from './interfaces';
import { ConstructClassWithPrivateMembers } from '../../../misc/helpers/ClassWithPrivateMembers';
import { IsObject } from '../../../helpers';
import {
  IFromObservable, IFromObservableContext, TFromObservableCompleteAction
} from '../interfaces';
import { ObservableFactory } from '../../../core/observable/implementation';
import { FromObservableFactory, IsFromObservableConstructor } from '../implementation';
import {
  Constructor, FactoryClass, GetSetSuperArgsFunction, HasFactoryWaterMark, IsFactoryClass
} from '../../../classes/factory';


export const FROM_ITERABLE_OBSERVABLE_PRIVATE = Symbol('from-iterable-observable-private');

export interface IFromIterableObservablePrivate<T> {
}

export interface IFromIterableObservableInternal<T> extends IFromIterableObservable<T> {
  [FROM_ITERABLE_OBSERVABLE_PRIVATE]: IFromIterableObservablePrivate<T>;
}

export function ConstructFromIterableObservable<T>(observable: IFromIterableObservable<T>): void {
  ConstructClassWithPrivateMembers(observable, FROM_ITERABLE_OBSERVABLE_PRIVATE);
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

export function FromIterableObservableFactory<TBase extends Constructor<IFromObservable<any>>>(superClass: TBase) {
  type T = any;
  if (!IsFromObservableConstructor(superClass)) {
    throw new TypeError(`Expected IsFromObservableConstructor' constructor as superClass`);
  }
  const setSuperArgs = GetSetSuperArgsFunction(IsFactoryClass(superClass));

  return FactoryClass(class FromIterableObservable extends superClass implements IFromIterableObservable<T> {
    constructor(...args: any[]) {
      const [iterable, onComplete]: TFromIterableObservableConstructorArgs<T> = args[0];
      super(...setSuperArgs(args.slice(1), [
        (context: IFromObservableContext<T>) => {
          const iterator: Iterator<T> = iterable[Symbol.iterator]();
          let result: IteratorResult<T>;
          while (!(result = iterator.next()).done) {
            context.emit(result.value);
          }
          context.complete();
        }, onComplete
      ]));
      ConstructFromIterableObservable<T>(this);
    }
  })<TFromIterableObservableConstructorArgs<T>>('FromIterableObservable', [IS_FROM_ITERABLE_OBSERVABLE_CONSTRUCTOR]);
}

export const FromIterableObservable: IFromIterableObservableConstructor = class FromIterableObservable extends FromIterableObservableFactory(FromObservableFactory(ObservableFactory<ObjectConstructor>(Object))) {
  constructor(iterable: Iterable<any>, onComplete?: TFromObservableCompleteAction) {
    super([iterable, onComplete], [], []);
  }
};
