import { Constructor, HasFactoryWaterMark, MakeFactory } from '../../../classes/factory';
import {
  IAsyncIterator, IAsyncIteratorConstructor, TAsyncIteratorConstructorArgs, TAsyncIteratorNextCallback
} from './interfaces';
import { ConstructClassWithPrivateMembers } from '../../helpers/ClassWithPrivateMembers';
import { IsObject } from '../../../helpers';
import { IteratorResult } from '../interfaces';

export const ASYNC_ITERATOR_PRIVATE = Symbol('async-iterator-private');

export interface IAsyncIteratorPrivate<T, U> {
  next: TAsyncIteratorNextCallback<T, U>;
  done: boolean;
  nextPromise: Promise<IteratorResult<T>>;
}

export interface IAsyncIteratorInternal<T, U> extends IAsyncIterator<T, U> {
  [ASYNC_ITERATOR_PRIVATE]: IAsyncIteratorPrivate<T, U>;
}

export function ConstructAsyncIterator<T, U>(
  instance: IAsyncIterator<T, U>,
  next: TAsyncIteratorNextCallback<T, U>
): void {
  ConstructClassWithPrivateMembers(instance, ASYNC_ITERATOR_PRIVATE);
  const privates: IAsyncIteratorPrivate<T, U> = (instance as IAsyncIteratorInternal<T, U>)[ASYNC_ITERATOR_PRIVATE];
  privates.next = next;
  privates.done = false;
  privates.nextPromise = Promise.resolve(void 0) as any;
}

export function IsAsyncIterator(value: any): value is IAsyncIterator<any, any> {
  return IsObject(value)
    && value.hasOwnProperty(ASYNC_ITERATOR_PRIVATE as symbol);
}

const IS_ASYNC_ITERATOR_CONSTRUCTOR = Symbol('is-async-iterator-constructor');


export function IsAsyncIteratorConstructor(value: any, direct?: boolean): value is IAsyncIteratorConstructor {
  return (typeof value === 'function') && ((value === AsyncIteratorClass) || HasFactoryWaterMark(value, IS_ASYNC_ITERATOR_CONSTRUCTOR, direct));
}


export function AsyncIteratorGetDone<T, U>(instance: IAsyncIterator<T, U>): boolean {
  return (instance as IAsyncIteratorInternal<T, U>)[ASYNC_ITERATOR_PRIVATE].done;
}

export function AsyncIteratorNext<T, U>(instance: IAsyncIterator<T, U>, value: U): Promise<IteratorResult<T>> {
  const privates: IAsyncIteratorPrivate<T, U> = (instance as IAsyncIteratorInternal<T, U>)[ASYNC_ITERATOR_PRIVATE];

  return privates.nextPromise = privates.nextPromise
    .then(() => {
      if (privates.done) {
        return AsyncIteratorGenerateDoneIteratorResult<T>();
      } else {
        return new Promise<IteratorResult<T>>(resolve => resolve(privates.next(value)))
          .then(
            (result: IteratorResult<T>) => {
              if (
                (typeof result === 'object')
                && (result !== null)
                && ('done' in result)
                && ('value' in result)
              ) {
                if (result.done) {
                  privates.done = true;
                }
                return result;
              } else {
                // AsyncIteratorThrowInternal<T, U>(instance, new TypeError(`iterator.next() returned a non-object value`));
                privates.done = true;
                throw new TypeError(`iterator.next() returned a non-object value`);
              }
            },
            (error: any) => {
              // AsyncIteratorThrowInternal<T, U>(instance, error);
              privates.done = true;
              throw error;
            }
          );
        // .catch((error: any) => AsyncIteratorThrowInternal<T, U>(instance, error));
      }
    }, () => {
      privates.done = true;
      return AsyncIteratorGenerateDoneIteratorResult<T>();
    });
}


export function AsyncIteratorReturn<T, U>(instance: IAsyncIterator<T, U>, value: T): Promise<IteratorResult<T>> {
  return (instance as IAsyncIteratorInternal<T, U>)[ASYNC_ITERATOR_PRIVATE].nextPromise = (instance as IAsyncIteratorInternal<T, U>)[ASYNC_ITERATOR_PRIVATE].nextPromise
    .then(
      () => AsyncIteratorReturnInternal<T, U>(instance, value),
      () => AsyncIteratorReturnInternal<T, U>(instance, value)
    );
}

export function AsyncIteratorThrow<T, U>(instance: IAsyncIterator<T, U>, error: any): Promise<IteratorResult<T>> {
  return (instance as IAsyncIteratorInternal<T, U>)[ASYNC_ITERATOR_PRIVATE].nextPromise = (instance as IAsyncIteratorInternal<T, U>)[ASYNC_ITERATOR_PRIVATE].nextPromise
    .then(
      () => AsyncIteratorThrowInternal<T, U>(instance, error),
      () => AsyncIteratorThrowInternal<T, U>(instance, error)
    );
}


export function AsyncIteratorReturnInternal<T, U>(instance: IAsyncIterator<T, U>, value: T): IteratorResult<T> {
  (instance as IAsyncIteratorInternal<T, U>)[ASYNC_ITERATOR_PRIVATE].done = true;
  return AsyncIteratorGenerateDoneIteratorResult<T>(value);
}

export function AsyncIteratorThrowInternal<T, U>(instance: IAsyncIterator<T, U>, error: any): never {
  (instance as IAsyncIteratorInternal<T, U>)[ASYNC_ITERATOR_PRIVATE].done = true;
  throw error;
}


export function AsyncIteratorGenerateValueIteratorResult<T>(value: T): IteratorResult<T> {
  return {
    value: value,
    done: false,
  };
}

export function AsyncIteratorGenerateDoneIteratorResult<T>(value?: T): IteratorResult<T> {
  return {
    value: value,
    done: true
  };
}


function PureAsyncIteratorFactory<TBase extends Constructor<any>>(superClass: TBase) {
  type T = any;
  type U = any;

  return class AsyncIterator extends superClass implements IAsyncIterator<T, U> {
    constructor(...args: any[]) {
      const [next]: TAsyncIteratorConstructorArgs<T, U> = args[0];
      super(...args.slice(1));
      ConstructAsyncIterator(this, next);
    }

    get done(): boolean {
      return AsyncIteratorGetDone<T, U>(this);
    }

    next(value: U): Promise<IteratorResult<T>> {
      return AsyncIteratorNext<T, U>(this, value);
    }

    return(value: T): Promise<IteratorResult<T>> {
      return AsyncIteratorReturn<T, U>(this, value);
    }

    throw(error: any): Promise<IteratorResult<T>> {
      return AsyncIteratorThrow<T, U>(this, error);
    }

    [Symbol.asyncIterator](): AsyncIterableIterator<T> {
      return this;
    }
  };
}


export let AsyncIteratorClass: IAsyncIteratorConstructor;

export function AsyncIteratorFactory<TBase extends Constructor>(superClass: TBase) {
  return MakeFactory<IAsyncIteratorConstructor, [], TBase>(PureAsyncIteratorFactory, [], superClass, {
    name: 'AsyncIteratorClass',
    instanceOf: AsyncIteratorClass,
    waterMarks: [IS_ASYNC_ITERATOR_CONSTRUCTOR]
  });
}

AsyncIteratorClass = class AsyncIterator extends AsyncIteratorFactory<ObjectConstructor>(Object) {
  constructor(next: TAsyncIteratorNextCallback<any, any>) {
    super([next], []);
  }
} as IAsyncIteratorConstructor;


