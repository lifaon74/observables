import { ConstructClassWithPrivateMembers } from '../../../misc/helpers/ClassWithPrivateMembers';
import { IsObject } from '../../../helpers';
import { AsyncIteratorClass } from '../../../misc/iterable/async-iterator/implementation';
import { IteratorResult } from '../../../misc/iterable/interfaces';
import { IAsyncIteratorOfObservable } from './interfaces';
import { ICompleteStateObservable } from '../../../notifications/observables/complete-state/interfaces';
import { INotificationsObserver } from '../../../notifications/core/notifications-observer/interfaces';

export const ASYNC_ITERATOR_OF_OBSERVABLE_PRIVATE = Symbol('async-iterator-private');

export interface IAsyncIteratorOfObservablePrivate<T> {
  observable: ICompleteStateObservable<T>;

  nextObserver: INotificationsObserver<'next', T>;
  completeObserver: INotificationsObserver<'complete', void>;
  errorObserver: INotificationsObserver<'error', any>;

  resolve: (value: IteratorResult<T>) => void;
  reject: (error: any) => void;
}

export interface IAsyncIteratorOfObservableInternal<T> extends IAsyncIteratorOfObservable<T> {
  [ASYNC_ITERATOR_OF_OBSERVABLE_PRIVATE]: IAsyncIteratorOfObservablePrivate<T>;
}

export function ConstructAsyncIteratorOfObservable<T>(
  instance: IAsyncIteratorOfObservable<T>,
  observable: ICompleteStateObservable<T>,
): void {
  ConstructClassWithPrivateMembers(instance, ASYNC_ITERATOR_OF_OBSERVABLE_PRIVATE);
  const privates: IAsyncIteratorOfObservablePrivate<T> = (instance as IAsyncIteratorOfObservableInternal<T>)[ASYNC_ITERATOR_OF_OBSERVABLE_PRIVATE];

  privates.observable = observable;

  privates.nextObserver = privates.observable
    .addListener('next', (value: T) => {
      AsyncIteratorOfObservableResolve<T>(instance, value, false);
    });

  privates.completeObserver = privates.observable
    .addListener('complete', () => {
      AsyncIteratorOfObservableResolve<T>(instance, void 0, true);
    });

  privates.errorObserver = privates.observable
    .addListener('error', (error: any) => {
      AsyncIteratorOfObservableReject<T>(instance, error);
    });
}

export function IsAsyncIteratorOfObservable(value: any): value is IAsyncIteratorOfObservable<any> {
  return IsObject(value)
    && value.hasOwnProperty(ASYNC_ITERATOR_OF_OBSERVABLE_PRIVATE as symbol);
}

function AsyncIteratorOfObservableActivateObservers<T>(instance: IAsyncIteratorOfObservable<T>): void {
  const privates: IAsyncIteratorOfObservablePrivate<T> = (instance as IAsyncIteratorOfObservableInternal<T>)[ASYNC_ITERATOR_OF_OBSERVABLE_PRIVATE];
  privates.nextObserver.activate();
  privates.completeObserver.activate();
  privates.errorObserver.activate();
}

function AsyncIteratorOfObservableDeactivateObservers<T>(instance: IAsyncIteratorOfObservable<T>): void {
  const privates: IAsyncIteratorOfObservablePrivate<T> = (instance as IAsyncIteratorOfObservableInternal<T>)[ASYNC_ITERATOR_OF_OBSERVABLE_PRIVATE];
  privates.nextObserver.deactivate();
  privates.completeObserver.deactivate();
  privates.errorObserver.deactivate();
}

function AsyncIteratorOfObservableResolve<T>(instance: IAsyncIteratorOfObservable<T>, value: T | undefined, done: boolean): void {
  (instance as IAsyncIteratorOfObservableInternal<T>)[ASYNC_ITERATOR_OF_OBSERVABLE_PRIVATE].resolve({
    value: value,
    done: done,
  });
  AsyncIteratorOfObservableDeactivateObservers<T>(instance);
}

function AsyncIteratorOfObservableReject<T>(instance: IAsyncIteratorOfObservable<T>, error: any): void {
  (instance as IAsyncIteratorOfObservableInternal<T>)[ASYNC_ITERATOR_OF_OBSERVABLE_PRIVATE].reject(error);
  AsyncIteratorOfObservableDeactivateObservers<T>(instance);
}

function AsyncIteratorOfObservableNext<T>(instance: IAsyncIteratorOfObservable<T>): Promise<IteratorResult<T>> {
  return new Promise<IteratorResult<T>>((resolve: (value: IteratorResult<T>) => void, reject: (error: any) => void) => {
    const privates: IAsyncIteratorOfObservablePrivate<T> = (instance as IAsyncIteratorOfObservableInternal<T>)[ASYNC_ITERATOR_OF_OBSERVABLE_PRIVATE];
    privates.resolve = resolve;
    privates.reject = reject;
    AsyncIteratorOfObservableActivateObservers<T>(instance);
  });
}


export class AsyncIteratorOfObservable<T> extends AsyncIteratorClass<T, void> {
  constructor(observable: ICompleteStateObservable<T>) {
    super(() => {
      return AsyncIteratorOfObservableNext<T>(this);
    });
    ConstructAsyncIteratorOfObservable<T>(this, observable);
  }
}
