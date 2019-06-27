import { ConstructClassWithPrivateMembers } from '../../../misc/helpers/ClassWithPrivateMembers';
import { IsObject } from '../../../helpers';
import { AsyncIteratorClass } from '../../../misc/iterable/async-iterator/implementation';
import { IObservable } from '../../../core/observable/interfaces';
import { IteratorResult } from '../../../misc/iterable/interfaces';
import { IAsyncIteratorOfObservable } from './interfaces';
import { IObserver } from '../../../core/observer/interfaces';
import { IsFromObservable } from '../../../observables/from/implementation';

export const ASYNC_ITERATOR_OF_OBSERVABLE_PRIVATE = Symbol('async-iterator-private');

export interface IAsyncIteratorOfObservablePrivate<T> {
  observable: IObservable<T>;
  observer: IObserver<T>;
  onCompleteObserver: IObserver<void> | undefined;
  resolve: (value: IteratorResult<T>) => void;
}

export interface IAsyncIteratorOfObservableInternal<T> extends IAsyncIteratorOfObservable<T> {
  [ASYNC_ITERATOR_OF_OBSERVABLE_PRIVATE]: IAsyncIteratorOfObservablePrivate<T>;
}

export function ConstructAsyncIteratorOfObservable<T>(
  instance: IAsyncIteratorOfObservable<T>,
  observable: IObservable<T>,
): void {
  ConstructClassWithPrivateMembers(instance, ASYNC_ITERATOR_OF_OBSERVABLE_PRIVATE);
  const privates: IAsyncIteratorOfObservablePrivate<T> = (instance as IAsyncIteratorOfObservableInternal<T>)[ASYNC_ITERATOR_OF_OBSERVABLE_PRIVATE];

  privates.observable = observable;

  privates.observer = privates.observable
    .pipeTo((value: T) => {
      AsyncIteratorOfObservableResolve<T>(instance, value, false);
    });

  if (IsFromObservable(privates.observable)) {
    privates.onCompleteObserver = privates.observable.onComplete
      .pipeTo(() => {
        AsyncIteratorOfObservableResolve<T>(instance, void 0, true);
      });
  }

}

export function IsAsyncIteratorOfObservable(value: any): value is IAsyncIteratorOfObservable<any> {
  return IsObject(value)
    && value.hasOwnProperty(ASYNC_ITERATOR_OF_OBSERVABLE_PRIVATE as symbol);
}

export function AsyncIteratorOfObservableResolve<T>(instance: IAsyncIteratorOfObservable<T>, value: T | undefined, done: boolean): void {
  const privates: IAsyncIteratorOfObservablePrivate<T> = (instance as IAsyncIteratorOfObservableInternal<T>)[ASYNC_ITERATOR_OF_OBSERVABLE_PRIVATE];
  privates.resolve({
    value: value,
    done: done,
  });
  privates.observer.deactivate();
  if (privates.onCompleteObserver !== void 0) {
    privates.onCompleteObserver.deactivate();
  }
}

export function AsyncIteratorOfObservableNext<T>(instance: IAsyncIteratorOfObservable<T>): Promise<IteratorResult<T>> {
  const privates: IAsyncIteratorOfObservablePrivate<T> = (instance as IAsyncIteratorOfObservableInternal<T>)[ASYNC_ITERATOR_OF_OBSERVABLE_PRIVATE];
  return new Promise<IteratorResult<T>>((resolve: (value: IteratorResult<T>) => void) => {
    privates.resolve = resolve;
    if (privates.onCompleteObserver !== void 0) {
      privates.onCompleteObserver.activate();
    }
    privates.observer.activate();
  });
}


export class AsyncIteratorOfObservable<T> extends AsyncIteratorClass<T, void> {
  constructor(observable: IObservable<T>) {
    super(() => {
      return AsyncIteratorOfObservableNext<T>(this);
    });
    ConstructAsyncIteratorOfObservable<T>(this, observable);
  }
}
